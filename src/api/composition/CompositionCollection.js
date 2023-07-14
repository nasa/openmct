/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/**
 * @typedef {import('../objects/ObjectAPI').DomainObject} DomainObject
 */

/**
 * @typedef {import('./CompositionAPI').default} CompositionAPI
 */

/**
 * @typedef {import('../../../openmct').OpenMCT} OpenMCT
 */

/**
 * @typedef {object} ListenerMap
 * @property {Array.<any>} add
 * @property {Array.<any>} remove
 * @property {Array.<any>} load
 * @property {Array.<any>} reorder
 */

/**
 * A CompositionCollection represents the list of domain objects contained
 * by another domain object. It provides methods for loading this
 * list asynchronously, modifying this list, and listening for changes to
 * this list.
 *
 * Usage:
 * ```javascript
 *  var myViewComposition = MCT.composition.get(myViewObject);
 *  myViewComposition.on('add', addObjectToView);
 *  myViewComposition.on('remove', removeObjectFromView);
 *  myViewComposition.load(); // will trigger `add` for all loaded objects.
 *  ```
 */
export default class CompositionCollection {
  domainObject;
  #provider;
  #publicAPI;
  #listeners;
  #mutables;
  /**
   * @constructor
   * @param {DomainObject} domainObject the domain object
   *        whose composition will be contained
   * @param {import('./CompositionProvider').default} provider the provider
   *        to use to retrieve other domain objects
   * @param {OpenMCT} publicAPI the composition API, for
   *        policy checks
   */
  constructor(domainObject, provider, publicAPI) {
    this.domainObject = domainObject;
    /** @type {import('./CompositionProvider').default} */
    this.#provider = provider;
    /** @type {OpenMCT} */
    this.#publicAPI = publicAPI;
    /** @type {ListenerMap} */
    this.#listeners = {
      add: [],
      remove: [],
      load: [],
      reorder: []
    };
    this.onProviderAdd = this.#onProviderAdd.bind(this);
    this.onProviderRemove = this.#onProviderRemove.bind(this);
    this.#mutables = {};

    if (this.domainObject.isMutable) {
      this.returnMutables = true;
      let unobserve = this.domainObject.$on('$_destroy', () => {
        Object.values(this.#mutables).forEach((mutable) => {
          this.#publicAPI.objects.destroyMutable(mutable);
        });
        unobserve();
      });
    }
  }
  /**
   * Listen for changes to this composition.  Supports 'add', 'remove', and
   * 'load' events.
   *
   * @param {string} event event to listen for, either 'add', 'remove' or 'load'.
   * @param {(...args: any[]) => void} callback to trigger when event occurs.
   * @param {any} [context] to use when invoking callback, optional.
   */
  on(event, callback, context) {
    if (!this.#listeners[event]) {
      throw new Error('Event not supported by composition: ' + event);
    }

    if (this.#provider.on && this.#provider.off) {
      if (event === 'add') {
        this.#provider.on(this.domainObject, 'add', this.onProviderAdd, this);
      }

      if (event === 'remove') {
        this.#provider.on(this.domainObject, 'remove', this.onProviderRemove, this);
      }

      if (event === 'reorder') {
        this.#provider.on(this.domainObject, 'reorder', this.#onProviderReorder, this);
      }
    }

    this.#listeners[event].push({
      callback: callback,
      context: context
    });
  }
  /**
   * Remove a listener.  Must be called with same exact parameters as
   * `off`.
   *
   * @param {string} event
   * @param {(...args: any[]) => void} callback
   * @param {any} [context]
   */
  off(event, callback, context) {
    if (!this.#listeners[event]) {
      throw new Error('Event not supported by composition: ' + event);
    }

    const index = this.#listeners[event].findIndex((l) => {
      return l.callback === callback && l.context === context;
    });

    if (index === -1) {
      throw new Error('Tried to remove a listener that does not exist');
    }

    this.#listeners[event].splice(index, 1);
    if (this.#listeners[event].length === 0) {
      this._destroy();

      // Remove provider listener if this is the last callback to
      // be removed.
      if (this.#provider.off && this.#provider.on) {
        if (event === 'add') {
          this.#provider.off(this.domainObject, 'add', this.onProviderAdd, this);
        } else if (event === 'remove') {
          this.#provider.off(this.domainObject, 'remove', this.onProviderRemove, this);
        } else if (event === 'reorder') {
          this.#provider.off(this.domainObject, 'reorder', this.#onProviderReorder, this);
        }
      }
    }
  }
  /**
   * Add a domain object to this composition.
   *
   * A call to [load]{@link module:openmct.CompositionCollection#load}
   * must have resolved before using this method.
   *
   * **TODO:** Remove `skipMutate` parameter.
   *
   * @param {DomainObject} child the domain object to add
   * @param {boolean} skipMutate
   * **Intended for internal use ONLY.**
   * true if the underlying provider should not be updated.
   */
  add(child, skipMutate) {
    if (!skipMutate) {
      if (!this.#publicAPI.composition.checkPolicy(this.domainObject, child)) {
        throw `Object of type ${child.type} cannot be added to object of type ${this.domainObject.type}`;
      }

      this.#provider.add(this.domainObject, child.identifier);
    } else {
      if (this.returnMutables && this.#publicAPI.objects.supportsMutation(child.identifier)) {
        let keyString = this.#publicAPI.objects.makeKeyString(child.identifier);

        child = this.#publicAPI.objects.toMutable(child);
        this.#mutables[keyString] = child;
      }

      this.#emit('add', child);
    }
  }
  /**
   * Load the domain objects in this composition.
   *
   * @param {AbortSignal} abortSignal
   * @returns {Promise.<Array.<DomainObject>>} a promise for
   *          the domain objects in this composition
   * @memberof {module:openmct.CompositionCollection#}
   * @name load
   */
  async load(abortSignal) {
    this.#cleanUpMutables();
    const children = await this.#provider.load(this.domainObject);
    const childObjects = await Promise.all(
      children.map((c) => this.#publicAPI.objects.get(c, abortSignal))
    );
    childObjects.forEach((c) => this.add(c, true));
    this.#emit('load');

    return childObjects;
  }
  /**
   * Remove a domain object from this composition.
   *
   * A call to [load]{@link module:openmct.CompositionCollection#load}
   * must have resolved before using this method.
   *
   * **TODO:** Remove `skipMutate` parameter.
   *
   * @param {DomainObject} child the domain object to remove
   * @param {boolean} skipMutate
   * **Intended for internal use ONLY.**
   * true if the underlying provider should not be updated.
   * @name remove
   */
  remove(child, skipMutate) {
    if (!skipMutate) {
      this.#provider.remove(this.domainObject, child.identifier);
    } else {
      if (this.returnMutables) {
        let keyString = this.#publicAPI.objects.makeKeyString(child);
        if (this.#mutables[keyString] !== undefined && this.#mutables[keyString].isMutable) {
          this.#publicAPI.objects.destroyMutable(this.#mutables[keyString]);
          delete this.#mutables[keyString];
        }
      }

      this.#emit('remove', child);
    }
  }
  /**
   * Reorder the domain objects in this composition.
   *
   * A call to [load]{@link module:openmct.CompositionCollection#load}
   * must have resolved before using this method.
   *
   * @param {number} oldIndex
   * @param {number} newIndex
   * @name remove
   */
  reorder(oldIndex, newIndex, _skipMutate) {
    this.#provider.reorder(this.domainObject, oldIndex, newIndex);
  }
  /**
   * Destroy mutationListener
   */
  _destroy() {
    if (this.mutationListener) {
      this.mutationListener();
      delete this.mutationListener;
    }
  }
  /**
   * Handle reorder from provider.
   * @private
   * @param {object} reorderMap
   */
  #onProviderReorder(reorderMap) {
    this.#emit('reorder', reorderMap);
  }

  /**
   * Handle adds from provider.
   * @private
   * @param {import('../objects/ObjectAPI').Identifier} childId
   * @returns {DomainObject}
   */
  #onProviderAdd(childId) {
    return this.#publicAPI.objects.get(childId).then(
      function (child) {
        this.add(child, true);

        return child;
      }.bind(this)
    );
  }

  /**
   * Handle removal from provider.
   * @param {DomainObject} child
   */
  #onProviderRemove(child) {
    this.remove(child, true);
  }

  /**
   * Emit events.
   *
   * @private
   * @param {string} event
   * @param {...args.<any>} payload
   */
  #emit(event, ...payload) {
    this.#listeners[event].forEach(function (l) {
      if (l.context) {
        l.callback.apply(l.context, payload);
      } else {
        l.callback(...payload);
      }
    });
  }

  /**
   * Destroy all mutables.
   * @private
   */
  #cleanUpMutables() {
    Object.values(this.#mutables).forEach((mutable) => {
      this.#publicAPI.objects.destroyMutable(mutable);
    });
  }
}

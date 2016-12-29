/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define([
    'lodash',
    '../objects/object-utils'
], (
    _,
    objectUtils
) => {

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
     *
     * @interface CompositionCollection
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        whose composition will be contained
     * @param {module:openmct.CompositionProvider} provider the provider
     *        to use to retrieve other domain objects
     * @param {module:openmct.CompositionAPI} api the composition API, for
     *        policy checks
     * @memberof module:openmct
     */
    class CompositionCollection {
      constructor(domainObject, provider, publicAPI) {
        this.domainObject = domainObject;
        this.provider = provider;
        this.publicAPI = publicAPI;
        this.listeners = {
            add: [],
            remove: [],
            load: []
        };
        this.onProviderAdd = this.onProviderAdd.bind(this);
        this.onProviderRemove = this.onProviderRemove.bind(this);
    }


    /**
     * Listen for changes to this composition.  Supports 'add', 'remove', and
     * 'load' events.
     *
     * @param event event to listen for, either 'add', 'remove' or 'load'.
     * @param callback to trigger when event occurs.
     * @param [context] context to use when invoking callback, optional.
     */
    on(event, callback, context) {
      if (!this.listeners[event]) {
        throw new Error('Event not supported by composition: ' + event);
      }
      
      if (event === 'add') {
        this.provider.on(
          this.domainObject,
          'add',
          this.onProviderAdd,
          this
        );
      } 
      if (event === 'remove') {
        this.provider.on(
          this.domainObject,
          'remove',
          this.onProviderRemove,
          this
        );
      }
      this.listeners[event].push({
        callback: callback,
        context: context
      });
    }

    /**
     * Remove a listener.  Must be called with same exact parameters as
     * `off`.
     *
     * @param event
     * @param callback
     * @param [context]
     */

    off(event, callback, context) {
        if (!this.listeners[event]) {
            throw new Error('Event not supported by composition: ' + event);
        }

        let index = _.findIndex(this.listeners[event], (l) => {
            return l.callback === callback && l.context === context;
        });

        if (index === -1) {
            throw new Error('Tried to remove a listener that does not exist');
        }

        this.listeners[event].splice(index, 1);
        if (this.listeners[event].length === 0) {
            // Remove provider listener if this is the last callback to
            // be removed.
            if (event === 'add') {
                this.provider.off(
                    this.domainObject,
                    'add',
                    this.onProviderAdd,
                    this
                );
            } else if (event === 'remove') {
                this.provider.off(
                    this.domainObject,
                    'remove',
                    this.onProviderRemove,
                    this
                );
            }
        }
    }

    /**
     * Add a domain object to this composition.
     *
     * A call to [load]{@link module:openmct.CompositionCollection#load}
     * must have resolved before using this method.
     *
     * @param {module:openmct.DomainObject} child the domain object to add
     * @param {boolean} skipMutate true if the underlying provider should
     *        not be updated
     * @memberof module:openmct.CompositionCollection#
     * @name add
     */
    add(child, skipMutate) {
        if (!skipMutate) {
            this.provider.add(this.domainObject, child.identifier);
        } else {
            this.emit('add', child);
        }
    }

    /**
     * Load the domain objects in this composition.
     *
     * @returns {Promise.<Array.<module:openmct.DomainObject>>} a promise for
     *          the domain objects in this composition
     * @memberof {module:openmct.CompositionCollection#}
     * @name load
     */
    load() {
        return this.provider.load(this.domainObject)
            .then( (children) => {
                return Promise.all(children.map(this.onProviderAdd, this));
            })
            .then( (children) => {
                this.emit('load');
                return children;
            });
    }

    /**
     * Remove a domain object from this composition.
     *
     * A call to [load]{@link module:openmct.CompositionCollection#load}
     * must have resolved before using this method.
     *
     * @param {module:openmct.DomainObject} child the domain object to remove
     * @param {boolean} skipMutate true if the underlying provider should
     *        not be updated
     * @memberof module:openmct.CompositionCollection#
     * @name remove
     */
    remove(child, skipMutate) {
        if (!skipMutate) {
            this.provider.remove(this.domainObject, child.identifier);
        } else {
            this.emit('remove', child);
        }
    }

    /**
     * Handle adds from provider.
     * @private
     */
    onProviderAdd(childId) {
        return this.publicAPI.objects.get(childId).then( (child) => {
            this.add(child, true);
            return child;
        });
    }

    /**
     * Handle removal from provider.
     * @private
     */
    onProviderRemove(child) {
        this.remove(child, true);
    }

    /**
     * Emit events.
     * @private
     */
    emit(event, payload) {
        this.listeners[event].forEach( (l) => {
            if (l.context) {
                l.callback.call(l.context, payload);
            } else {
                l.callback(payload);
            }
        });
    }
}
return CompositionCollection;
});

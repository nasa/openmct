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
import _ from 'lodash';
import objectUtils from '../objects/object-utils';

/**
 * @typedef {import('../objects/ObjectAPI').DomainObject} DomainObject
 */

/**
 * @typedef {import('../objects/ObjectAPI').Identifier} Identifier
 */

/**
 * @typedef {import('./CompositionAPI').default} CompositionAPI
 */

/**
 * @typedef {import('../../../openmct').OpenMCT} OpenMCT
 */

/**
 * A CompositionProvider provides the underlying implementation of
 * composition-related behavior for certain types of domain object.
 *
 * By default, a composition provider will not support composition
 * modification.  You can add support for mutation of composition by
 * defining `add` and/or `remove` methods.
 *
 * If the composition of an object can change over time-- perhaps via
 * server updates or mutation via the add/remove methods, then one must
 * trigger events as necessary.
 *
 */
export default class CompositionProvider {
  #publicAPI;
  #listeningTo;

  /**
   * @param {OpenMCT} publicAPI
   * @param {CompositionAPI} compositionAPI
   */
  constructor(publicAPI, compositionAPI) {
    this.#publicAPI = publicAPI;
    this.#listeningTo = {};

    compositionAPI.addPolicy(this.#cannotContainItself.bind(this));
    compositionAPI.addPolicy(this.#supportsComposition.bind(this));
  }

  get listeningTo() {
    return this.#listeningTo;
  }

  get establishTopicListener() {
    return this.#establishTopicListener.bind(this);
  }

  get publicAPI() {
    return this.#publicAPI;
  }

  /**
   * Check if this provider should be used to load composition for a
   * particular domain object.
   * @method appliesTo
   * @param {import('../objects/ObjectAPI').DomainObject} domainObject the domain object
   *        to check
   * @returns {boolean} true if this provider can provide composition for a given domain object
   */
  appliesTo(domainObject) {
    throw new Error('This method must be implemented by a subclass.');
  }
  /**
   * Load any domain objects contained in the composition of this domain
   * object.
   * @param {DomainObject} domainObject the domain object
   *        for which to load composition
   * @returns {Promise<Identifier[]>} a promise for
   *          the Identifiers in this composition
   * @method load
   */
  load(domainObject) {
    throw new Error('This method must be implemented by a subclass.');
  }
  /**
   * Attach listeners for changes to the composition of a given domain object.
   * Supports `add` and `remove` events.
   *
   * @param {DomainObject} domainObject to listen to
   * @param {string} event the event to bind to, either `add` or `remove`.
   * @param {Function} callback callback to invoke when event is triggered.
   * @param {any} [context] to use when invoking callback.
   */
  on(domainObject, event, callback, context) {
    throw new Error('This method must be implemented by a subclass.');
  }
  /**
   * Remove a listener that was previously added for a given domain object.
   * event name, callback, and context must be the same as when the listener
   * was originally attached.
   *
   * @param {DomainObject} domainObject to remove listener for
   * @param {string} event event to stop listening to: `add` or `remove`.
   * @param {Function} callback callback to remove.
   * @param {any} context of callback to remove.
   */
  off(domainObject, event, callback, context) {
    throw new Error('This method must be implemented by a subclass.');
  }
  /**
   * Remove a domain object from another domain object's composition.
   *
   * This method is optional; if not present, adding to a domain object's
   * composition using this provider will be disallowed.
   *
   * @param {DomainObject} domainObject the domain object
   *        which should have its composition modified
   * @param {Identifier} childId the domain object to remove
   * @method remove
   */
  remove(domainObject, childId) {
    throw new Error('This method must be implemented by a subclass.');
  }
  /**
   * Add a domain object to another domain object's composition.
   *
   * This method is optional; if not present, adding to a domain object's
   * composition using this provider will be disallowed.
   *
   * @param {DomainObject} parent the domain object
   *        which should have its composition modified
   * @param {Identifier} childId the domain object to add
   * @method add
   */
  add(parent, childId) {
    throw new Error('This method must be implemented by a subclass.');
  }

  /**
   * @param {DomainObject} parent
   * @param {Identifier} childId
   * @returns {boolean}
   */
  includes(parent, childId) {
    throw new Error('This method must be implemented by a subclass.');
  }

  /**
   * @param {DomainObject} domainObject
   * @param {number} oldIndex
   * @param {number} newIndex
   * @returns
   */
  reorder(domainObject, oldIndex, newIndex) {
    throw new Error('This method must be implemented by a subclass.');
  }

  /**
   * Listens on general mutation topic, using injector to fetch to avoid
   * circular dependencies.
   * @private
   */
  #establishTopicListener() {
    if (this.topicListener) {
      return;
    }

    this.#publicAPI.objects.eventEmitter.on('mutation', this.#onMutation.bind(this));
    this.topicListener = () => {
      this.#publicAPI.objects.eventEmitter.off('mutation', this.#onMutation.bind(this));
    };
  }

  /**
   * @private
   * @param {DomainObject} parent
   * @param {DomainObject} child
   * @returns {boolean}
   */
  #cannotContainItself(parent, child) {
    return !(
      parent.identifier.namespace === child.identifier.namespace &&
      parent.identifier.key === child.identifier.key
    );
  }

  /**
   * @private
   * @param {DomainObject} parent
   * @returns {boolean}
   */
  #supportsComposition(parent, _child) {
    return this.#publicAPI.composition.supportsComposition(parent);
  }

  /**
   * Handles mutation events.  If there are active listeners for the mutated
   * object, detects changes to composition and triggers necessary events.
   *
   * @private
   * @param {DomainObject} oldDomainObject
   */
  #onMutation(newDomainObject, oldDomainObject) {
    const id = objectUtils.makeKeyString(oldDomainObject.identifier);
    const listeners = this.#listeningTo[id];

    if (!listeners) {
      return;
    }

    const oldComposition = oldDomainObject.composition.map(objectUtils.makeKeyString);
    const newComposition = newDomainObject.composition.map(objectUtils.makeKeyString);

    const added = _.difference(newComposition, oldComposition).map(objectUtils.parseKeyString);
    const removed = _.difference(oldComposition, newComposition).map(objectUtils.parseKeyString);

    function notify(value) {
      return function (listener) {
        if (listener.context) {
          listener.callback.call(listener.context, value);
        } else {
          listener.callback(value);
        }
      };
    }

    added.forEach(function (addedChild) {
      listeners.add.forEach(notify(addedChild));
    });

    removed.forEach(function (removedChild) {
      listeners.remove.forEach(notify(removedChild));
    });
  }
}

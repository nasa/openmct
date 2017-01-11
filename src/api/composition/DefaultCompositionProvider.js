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
     * @interface CompositionProvider
     * @memberof module:openmct
     */

    class DefaultCompositionProvider {
      constructor(publicAPI) {
        this.publicAPI = publicAPI;
        this.listeningTo = {};
      }

    /**
     * Check if this provider should be used to load composition for a
     * particular domain object.
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        to check
     * @returns {boolean} true if this provider can provide
     *          composition for a given domain object
     * @memberof module:openmct.CompositionProvider#
     * @method appliesTo
     */
    appliesTo(domainObject) {
        return !!domainObject.composition;
    }

    /**
     * Load any domain objects contained in the composition of this domain
     * object.
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        for which to load composition
     * @returns {Promise.<Array.<module:openmct.Identifier>>} a promise for
     *          the Identifiers in this composition
     * @memberof module:openmct.CompositionProvider#
     * @method load
     */
    load(domainObject) {
        return Promise.all(domainObject.composition);
    }

    /**
     * Attach listeners for changes to the composition of a given domain object.
     * Supports `add` and `remove` events.
     *
     * @param {module:openmct.DomainObject} domainObject to listen to
     * @param String event the event to bind to, either `add` or `remove`.
     * @param Function callback callback to invoke when event is triggered.
     * @param [context] context to use when invoking callback.
     */
    on(domainObject, event, callback,context) {
        this.establishTopicListener();

        let keyString = objectUtils.makeKeyString(domainObject.identifier);
        let objectListeners = this.listeningTo[keyString];

        if (!objectListeners) {
            objectListeners = this.listeningTo[keyString] = {
                add: [],
                remove: [],
                composition: [].slice.apply(domainObject.composition)
            };
        }

        objectListeners[event].push({
            callback: callback,
            context: context
        });
    }

    /**
     * Remove a listener that was previously added for a given domain object.
     * event name, callback, and context must be the same as when the listener
     * was originally attached.
     *
     * @param {module:openmct.DomainObject} domainObject to remove listener for
     * @param String event event to stop listening to: `add` or `remove`.
     * @param Function callback callback to remove.
     * @param [context] context of callback to remove.
     */
    off(domainObject,event,callback,context) {
        let keyString = objectUtils.makeKeyString(domainObject.identifier);
        let objectListeners = this.listeningTo[keyString];

        let index = _.findIndex(objectListeners[event], (l) => {
            return l.callback === callback && l.context === context;
        });

        objectListeners[event].splice(index, 1);
        if (!objectListeners.add.length && !objectListeners.remove.length) {
            delete this.listeningTo[keyString];
        }
    }

    /**
     * Remove a domain object from another domain object's composition.
     *
     * This method is optional; if not present, adding to a domain object's
     * composition using this provider will be disallowed.
     *
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        which should have its composition modified
     * @param {module:openmct.DomainObject} child the domain object to remove
     * @memberof module:openmct.CompositionProvider#
     * @method remove
     */
    remove(domainObject, childId) {
        // TODO: this needs to be synchronized via mutation.
        throw new Error('Default Provider does not implement removal.');
    }

    /**
     * Add a domain object to another domain object's composition.
     *
     * This method is optional; if not present, adding to a domain object's
     * composition using this provider will be disallowed.
     *
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        which should have its composition modified
     * @param {module:openmct.DomainObject} child the domain object to add
     * @memberof module:openmct.CompositionProvider#
     * @method add
     */
    add(domainObject, child) {
        throw new Error('Default Provider does not implement adding.');
        // TODO: this needs to be synchronized via mutation
    }

    /**
     * Listens on general mutation topic, using injector to fetch to avoid
     * circular dependencies.
     *
     * @private
     */
    establishTopicListener() {
        if (this.topicListener) {
            return;
        }
        let topic = this.publicAPI.$injector.get('topic');
        let mutation = topic('mutation');
        this.topicListener = mutation.listen(this.onMutation.bind(this));
    }

    /**
     * Handles mutation events.  If there are active listeners for the mutated
     * object, detects changes to composition and triggers necessary events.
     *
     * @private
     */
    onMutation(oldDomainObject) {
        let id = oldDomainObject.getId();
        let listeners = this.listeningTo[id];

        if (!listeners) {
            return;
        }

        let oldComposition = listeners.composition.map(objectUtils.makeKeyString);
        let newComposition = oldDomainObject.getModel().composition;

        let added = _.difference(newComposition, oldComposition).map(objectUtils.parseKeyString);
        let removed = _.difference(oldComposition, newComposition).map(objectUtils.parseKeyString);

        const notify = (value) => {
            return (listener) => {
                if (listener.context) {
                    listener.callback.call(listener.context, value);
                } else {
                    listener.callback(value);
                }
            };
        };

        added.forEach( (addedChild) => {
            listeners.add.forEach(notify(addedChild));
        });

        removed.forEach( (removedChild) => {
            listeners.remove.forEach(notify(removedChild));
        });

        listeners.composition = newComposition.map(objectUtils.parseKeyString);
    }
}
return DefaultCompositionProvider;
});

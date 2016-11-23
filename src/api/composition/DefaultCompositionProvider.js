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
], function (
    _,
    objectUtils
) {
    /**
     * A CompositionProvider provides the underlying implementation of
     * composition-related behavior for certain types of domain object.
     *
     * @interface CompositionProvider
     * @memberof module:openmct
     * @augments EventEmitter
     */

    /**
     * appliesTo: can we load composition for an object?
     * events:
     *      add (id)
     *      remove (id)
     * methods:
     *      add
     *      remove
     *      load
     *
     */

    function DefaultCompositionProvider(publicAPI) {
        this.publicAPI = publicAPI;
        this._listeningTo = {};
    }

    DefaultCompositionProvider.prototype =
        Object.create(EventEmitter.prototype);

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
    DefaultCompositionProvider.prototype.appliesTo = function (domainObject) {
        return !!domainObject.composition;
    };

    /**
     * Load any domain objects contained in the composition of this domain
     * object.
     * @param {module:openmct.DomainObjcet} domainObject the domain object
     *        for which to load composition
     * @returns {Promise.<Array.<module:openmct.DomainObject>>} a promise for
     *          the domain objects in this composition
     * @memberof module:openmct.CompositionProvider#
     * @method load
     */
    DefaultCompositionProvider.prototype.load = function (domainObject) {
        return Promise.all(domainObject.composition);
    };

    DefaultCompositionProvider.prototype.establishTopicListener = function () {
        if (this.topicListener) { return; }
        var topic = this.publicAPI.$injector.get('topic');
        var mutation = topic('mutation');
        this.topicListener = mutation.listen(this.onMutation.bind(this));
    }

    DefaultCompositionProvider.prototype.onMutation = function (oldDomainObject) {
        var id = oldDomainObject.getId();
        var listeners = this._listeningTo[id];

        if (!listeners) {
            return;
        }

        var oldComposition = listeners.composition.map(objectUtils.makeKeyString);
        var newComposition = oldDomainObject.getModel().composition;

        var added = _.difference(newComposition, oldComposition).map(objectUtils.parseKeyString);
        var removed = _.difference(oldComposition, newComposition).map(objectUtils.parseKeyString);

        function notify(value) {
            return function (listener) {
                if (listener.context) {
                    listener.callback.call(listener.context, value);
                } else {
                    listener.callback(value)
                }
            };
        }

        added.forEach(function (addedChild) {
            listeners.add.forEach(notify(addedChild));
        });

        removed.forEach(function (removedChild) {
            listeners.remove.forEach(notify(removedChild));
        });

        listeners.composition = newComposition.map(objectUtils.parseKeyString);
    };

    DefaultCompositionProvider.prototype.on = function (
        domainObject,
        event,
        callback,
        context
    ) {
        this.establishTopicListener();

        var keyString = objectUtils.makeKeyString(domainObject.identifier);
        var objectListeners = this._listeningTo[keyString];

        if (!objectListeners) {
            objectListeners = this._listeningTo[keyString] = {
                add: [],
                remove: [],
                composition: [].slice.apply(domainObject.composition),
            };
            // TODO: listen on mutation topic & watch changes.
        }

        objectListeners[event].push({
            callback: callback,
            context: context
        });
    };

    DefaultCompositionProvider.prototype.off = function (
        domainObject,
        event,
        callback,
        context
    ) {
        var keyString = objectUtils.makeKeyString(domainObject.identifier);
        var objectListeners = this._listeningTo[keyString];

        var index = _.findIndex(objectListeners[event], function (l) {
            return l.callback === callback && l.context === context;
        });

        objectListeners[eventName].splice(index, 1);
        if (!objectListeners['add'].length && !objectListeners['remove'].length) {
            delete this._listeningTo[keyString];
        }
    };

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
    DefaultCompositionProvider.prototype.remove = function (domainObject, childId) {
        // TODO: this needs to be synchronized via mutation.
        var index = domainObject.composition.indexOf(childId);
        domainObject.composition.splice(index, 1);
        this.emit(makeEventName(domainObject, 'remove'), childId);
    };

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
    DefaultCompositionProvider.prototype.add = function (domainObject, child) {
        // TODO: this needs to be synchronized via mutation
        domainObject.composition.push(child.key);
        this.emit(makeEventName(domainObject, 'add'), child);
    };

    return DefaultCompositionProvider;
});

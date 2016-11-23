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
    'EventEmitter',
    'lodash',
    '../objects/object-utils'
], function (
    EventEmitter,
    _,
    objectUtils
) {

    /**
     * var composition = mct.composition(myObject);
     * composition.on('add', addObject);
     * composition.on('remove', removeObject);
     * composition.on('load', stopLoading);
     * startLoading();
     * composition.load();
     *
     */


    /**
     * A CompositionCollection represents the list of domain objects contained
     * by another domain object. It provides methods for loading this
     * list asynchronously, and for modifying this list.
     *
     * @interface CompositionCollection
     * @param {module:openmct.DomainObject} domainObject the domain object
     *        whose composition will be contained
     * @param {module:openmct.CompositionProvider} provider the provider
     *        to use to retrieve other domain objects
     * @param {module:openmct.CompositionAPI} api the composition API, for
     *        policy checks
     * @memberof module:openmct
     * @augments EventEmitter
     */
    function CompositionCollection(domainObject, provider, api) {
        this.domainObject = domainObject;
        this.loaded = false;
        this.provider = provider;
        this.api = api;
        this.listeners = {
            add: [],
            remove: [],
            load: []
        };
        this.onProviderAdd = this.onProviderAdd.bind(this);
        this.onProviderRemove = this.onProviderRemove.bind(this);
    }

    CompositionCollection.prototype.onProviderAdd = function (childId) {
        this.api.publicAPI.objects.get(childId).then(function (child) {
            this.add(child, true);
        }.bind(this));
    };

    CompositionCollection.prototype.onProviderRemove = function (child) {
        this.remove(child, true);
    };

    CompositionCollection.prototype.on = function (event, callback, context) {
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
        } if (event === 'remove') {
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
    };

    CompositionCollection.prototype.off = function (event, callback, context) {
        if (!this.listeners[event]) {
            throw new Error('Event not supported by composition: ' + event);
        }

        var index = _.findIndex(this.listeners[event], function (l) {
            return l.callback === callback && l.context === context;
        });

        if (index === -1) {
            throw new Error('Tried to remove a listener that already existed');
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
    };

    CompositionCollection.prototype.emit = function (event, payload) {
        this.listeners[event].forEach(function (l) {
            if (l.context) {
                l.callback.call(l.context, payload);
            } else {
                l.callback(payload);
            }
        });
    };

    /**
     * Check if a domain object can be added to this composition.
     *
     * @param {module:openmct.DomainObject} child the domain object to add
     * @memberof module:openmct.CompositionCollection#
     * @name canContain
     */
    CompositionCollection.prototype.canContain = function (domainObject) {
        return this.api.checkPolicy(this.domainObject, domainObject);
    };

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
    CompositionCollection.prototype.add = function (child, skipMutate) {
        if (!this.loaded) {
            throw new Error("Must load composition before you can add!");
        }
        if (!skipMutate) {
            this.provider.add(this.domainObject, child.identifier);
        } else {
            this.emit('add', child);
        }
    };

    /**
     * Load the domain objects in this composition.
     *
     * @returns {Promise.<Array.<module:openmct.DomainObject>>} a promise for
     *          the domain objects in this composition
     * @memberof {module:openmct.CompositionCollection#}
     * @name load
     */
    CompositionCollection.prototype.load = function () {
        return this.provider.load(this.domainObject)
            .then(function (children) {
                this.loaded = true;
                children.map(this.onProviderAdd, this);
                this.emit('load');
            }.bind(this));
    };

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
    CompositionCollection.prototype.remove = function (child, skipMutate) {
        if (!skipMutate) {
            this.provider.remove(this.domainObject, child.identifier);
        } else {
            this.emit('remove', child);
        }
    };

    return CompositionCollection;
});

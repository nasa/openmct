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
        EventEmitter.call(this);
        this.domainObject = domainObject;
        this.provider = provider;
        this.api = api;
        if (this.provider.on) {
            this.provider.on(
                this.domainObject,
                'add',
                this.onProviderAdd,
                this
            );
            this.provider.on(
                this.domainObject,
                'remove',
                this.onProviderRemove,
                this
            );
        }
    }

    CompositionCollection.prototype = Object.create(EventEmitter.prototype);

    CompositionCollection.prototype.onProviderAdd = function (child) {
        this.add(child, true);
    };

    CompositionCollection.prototype.onProviderRemove = function (child) {
        this.remove(child, true);
    };

    /**
     * Get the index of a domain object within this composition. If the
     * domain object is not contained here, -1 will be returned.
     *
     * A call to [load]{@link module:openmct.CompositionCollection#load}
     * must have resolved before using this method.
     *
     * @param {module:openmct.DomainObject} child the domain object for which
     *        an index should be retrieved
     * @returns {number} the index of that domain object
     * @memberof module:openmct.CompositionCollection#
     * @name indexOf
     */
    CompositionCollection.prototype.indexOf = function (child) {
        return _.findIndex(this.loadedChildren, function (other) {
            return objectUtils.equals(child, other);
        });
    };

    /**
     * Get the index of a domain object within this composition.
     *
     * A call to [load]{@link module:openmct.CompositionCollection#load}
     * must have resolved before using this method.
     *
     * @param {module:openmct.DomainObject} child the domain object for which
     *        containment should be checked
     * @returns {boolean} true if the domain object is contained here
     * @memberof module:openmct.CompositionCollection#
     * @name contains
     */
    CompositionCollection.prototype.contains = function (child) {
        return this.indexOf(child) !== -1;
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
        if (!this.loadedChildren) {
            throw new Error("Must load composition before you can add!");
        }
        if (!this.canContain(child)) {
            throw new Error("This object cannot contain that object.");
        }
        if (this.contains(child)) {
            if (skipMutate) {
                return; // don't add twice, don't error.
            }
            throw new Error("Unable to add child: already in composition");
        }
        this.loadedChildren.push(child);
        this.emit('add', child);
        if (!skipMutate) {
            // add after we have added.
            this.provider.add(this.domainObject, child);
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
                this.loadedChildren = [];
                children.map(function (c) {
                    this.add(c, true);
                }, this);
                this.emit('load');
                return this.loadedChildren.slice();
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
        if (!this.contains(child)) {
            if (skipMutate) {
                return;
            }
            throw new Error("Unable to remove child: not found in composition");
        }
        var index = this.indexOf(child);
        var removed = this.loadedChildren.splice(index, 1)[0];
        this.emit('remove', index, child);
        if (!skipMutate) {
            // trigger removal after we have internally removed it.
            this.provider.remove(this.domainObject, removed);
        }
    };

    /**
     * Stop using this composition collection. This will release any resources
     * associated with this collection.
     * @name destroy
     * @memberof module:openmct.CompositionCollection#
     */
    CompositionCollection.prototype.destroy = function () {
        if (this.provider.off) {
            this.provider.off(
                this.domainObject,
                'add',
                this.onProviderAdd,
                this
            );
            this.provider.off(
                this.domainObject,
                'remove',
                this.onProviderRemove,
                this
            );
        }
    };

    return CompositionCollection;
});

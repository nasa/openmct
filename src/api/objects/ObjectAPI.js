/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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
    'objectUtils',
    './MutableDomainObject',
    './RootRegistry',
    './RootObjectProvider',
    'EventEmitter'
], function (
    _,
    utils,
    MutableDomainObject,
    RootRegistry,
    RootObjectProvider,
    EventEmitter
) {

    /**
     * Utilities for loading, saving, and manipulating domain objects.
     * @interface ObjectAPI
     * @memberof module:openmct
     */

    function ObjectAPI(typeRegistry) {
        this.typeRegistry = typeRegistry;
        this.eventEmitter = new EventEmitter();
        this.providers = {};
        this.rootRegistry = new RootRegistry();
        this.rootProvider = new RootObjectProvider.default(this.rootRegistry);
        this.cache = {};
    }

    /**
     * Set fallback provider, this is an internal API for legacy reasons.
     * @private
     */
    ObjectAPI.prototype.supersecretSetFallbackProvider = function (p) {
        this.fallbackProvider = p;
    };

    /**
     * Retrieve the provider for a given identifier.
     * @private
     */
    ObjectAPI.prototype.getProvider = function (identifier) {
        if (identifier.key === 'ROOT') {
            return this.rootProvider;
        }

        return this.providers[identifier.namespace] || this.fallbackProvider;
    };

    /**
     * Get the root-level object.
     * @returns {Promise.<DomainObject>} a promise for the root object
     */
    ObjectAPI.prototype.getRoot = function () {
        return this.rootProvider.get();
    };

    /**
     * Register a new object provider for a particular namespace.
     *
     * @param {string} namespace the namespace for which to provide objects
     * @param {module:openmct.ObjectProvider} provider the provider which
     *        will handle loading domain objects from this namespace
     * @memberof {module:openmct.ObjectAPI#}
     * @name addProvider
     */
    ObjectAPI.prototype.addProvider = function (namespace, provider) {
        this.providers[namespace] = provider;
    };

    /**
     * Provides the ability to read, write, and delete domain objects.
     *
     * When registering a new object provider, all methods on this interface
     * are optional.
     *
     * @interface ObjectProvider
     * @memberof module:openmct
     */

    /**
     * Create the given domain object in the corresponding persistence store
     *
     * @method create
     * @memberof module:openmct.ObjectProvider#
     * @param {module:openmct.DomainObject} domainObject the domain object to
     *        create
     * @returns {Promise} a promise which will resolve when the domain object
     *          has been created, or be rejected if it cannot be saved
     */

    /**
     * Update this domain object in its persistence store
     *
     * @method update
     * @memberof module:openmct.ObjectProvider#
     * @param {module:openmct.DomainObject} domainObject the domain object to
     *        update
     * @returns {Promise} a promise which will resolve when the domain object
     *          has been updated, or be rejected if it cannot be saved
     */

    /**
     * Delete this domain object.
     *
     * @method delete
     * @memberof module:openmct.ObjectProvider#
     * @param {module:openmct.DomainObject} domainObject the domain object to
     *        delete
     * @returns {Promise} a promise which will resolve when the domain object
     *          has been deleted, or be rejected if it cannot be deleted
     */

    /**
     * Get a domain object.
     *
     * @method get
     * @memberof module:openmct.ObjectProvider#
     * @param {string} key the key for the domain object to load
     * @returns {Promise} a promise which will resolve when the domain object
     *          has been saved, or be rejected if it cannot be saved
     */

    /**
     * Get a domain object.
     *
     * @method get
     * @memberof module:openmct.ObjectAPI#
     * @param {module:openmct.ObjectAPI~Identifier} identifier
     *        the identifier for the domain object to load
     * @returns {Promise} a promise which will resolve when the domain object
     *          has been saved, or be rejected if it cannot be saved
     */
    ObjectAPI.prototype.get = function (identifier) {
        let keystring = this.makeKeyString(identifier);
        if (this.cache[keystring] !== undefined) {
            return this.cache[keystring];
        }

        identifier = utils.parseKeyString(identifier);
        const provider = this.getProvider(identifier);

        if (!provider) {
            throw new Error('No Provider Matched');
        }

        if (!provider.get) {
            throw new Error('Provider does not support get!');
        }

        let objectPromise = provider.get(identifier);

        this.cache[keystring] = objectPromise;

        return objectPromise.then(result => {
            delete this.cache[keystring];

            return result;
        });
    };

    /**
     * Will fetch object, returning it as a MutableDomainObject IF the object is mutable.
     * Before using this function, you should ask yourself whether you really need it. The platform will always provide
     * MutableDomainObjects from API functions if the underlying object can be mutated. The platform will manage the
     * lifecycle of any `MutableDomainObjects` that it provides. If you use `getAsMutable` you are responsible for
     * managing lifecycle yourself. `.$destroy` should be called when the object is no longer needed.
     *
     * @returns {Promise.<MutableDomainObject|DomainObject>} a promise that will resolve with a MutableDomainObject if 
     * the object can be mutated, or a DomainObject if not.
     */
    ObjectAPI.prototype.getAsMutable = function (identifier) {
        return this.get(identifier).then((object) => {
            if (this.isMutable(object)) {
                return this._toMutable(object);
            } else {
                return object;
            }
        });
    };

    ObjectAPI.prototype.delete = function () {
        throw new Error('Delete not implemented');
    };

    ObjectAPI.prototype.isPersistable = function (domainObject) {
        let provider = this.getProvider(domainObject.identifier);

        return provider !== undefined
            && provider.create !== undefined
            && provider.update !== undefined;
    };

    /**
     * Save this domain object in its current state. EXPERIMENTAL
     *
     * @private
     * @memberof module:openmct.ObjectAPI#
     * @param {module:openmct.DomainObject} domainObject the domain object to
     *        save
     * @returns {Promise} a promise which will resolve when the domain object
     *          has been saved, or be rejected if it cannot be saved
     */
    ObjectAPI.prototype.save = function (domainObject) {
        let provider = this.getProvider(domainObject.identifier);
        let savedResolve;
        let result;

        if (!this.isPersistable(domainObject)) {
            result = Promise.reject('Object provider does not support saving');
        } else if (hasAlreadyBeenPersisted(domainObject)) {
            result = Promise.resolve(true);
        } else {
            const persistedTime = Date.now();
            if (domainObject.persisted === undefined) {
                result = new Promise((resolve) => {
                    savedResolve = resolve;
                });
                domainObject.persisted = persistedTime;
                provider.create(domainObject).then((response) => {
                    this.mutate(domainObject, 'persisted', persistedTime);
                    savedResolve(response);
                });
            } else {
                domainObject.persisted = persistedTime;
                this.mutate(domainObject, 'persisted', persistedTime);
                result = provider.update(domainObject);
            }
        }

        return result;
    };

    /**
     * Add a root-level object.
     * @param {module:openmct.ObjectAPI~Identifier|function} an array of
     *        identifiers for root level objects, or a function that returns a
     *        promise for an identifier or an array of root level objects.
     * @method addRoot
     * @memberof module:openmct.ObjectAPI#
     */
    ObjectAPI.prototype.addRoot = function (key) {
        this.rootRegistry.addRoot(key);
    };

    /**
     * Modify a domain object.
     * @param {module:openmct.DomainObject} object the object to mutate
     * @param {string} path the property to modify
     * @param {*} value the new value for this property
     * @method mutate
     * @memberof module:openmct.ObjectAPI#
     */
    ObjectAPI.prototype.mutate = function (domainObject, path, value) {
        if (!this.isMutable(domainObject)) {
            throw `Error: Attempted to mutate immutable object ${domainObject.name}`;
        }

        if (domainObject instanceof MutableDomainObject.default) {
            domainObject.$set(path, value);
        } else {
            let mutable = this._toMutable(domainObject);
            mutable.$set(path, value);
            mutable.$destroy();
        }
    };

    ObjectAPI.prototype._toMutable = function (object) {
        if (object.isMutable) {
            return object;
        } else {
            return MutableDomainObject.default.createMutable(object, this.eventEmitter);
        }
    };

    ObjectAPI.prototype.isMutable = function (object) {
        // Checking for mutability is a bit broken right now. This is an 80% solution,
        // but does not work in many cases.
        const type = this.typeRegistry.get(object.type);

        return type && type.definition.creatable === true;
    };

    /**
     * Observe changes to a domain object.
     * @param {module:openmct.DomainObject} object the object to observe
     * @param {string} path the property to observe
     * @param {Function} callback a callback to invoke when new values for
     *        this property are observed
     * @method observe
     * @memberof module:openmct.ObjectAPI#
     */
    ObjectAPI.prototype.observe = function (domainObject, path, callback) {
        if (domainObject instanceof MutableDomainObject.default) {
            return domainObject.$observe(path, callback);
        } else {
            let mutable = this._toMutable(domainObject);
            mutable.$observe(path, callback);

            return () => mutable.$destroy();
        }
    };

    /**
     * @param {module:openmct.ObjectAPI~Identifier} identifier
     * @returns {string} A string representation of the given identifier, including namespace and key
     */
    ObjectAPI.prototype.makeKeyString = function (identifier) {
        return utils.makeKeyString(identifier);
    };

    /**
     * Given any number of identifiers, will return true if they are all equal, otherwise false.
     * @param {module:openmct.ObjectAPI~Identifier[]} identifiers
     */
    ObjectAPI.prototype.areIdsEqual = function (...identifiers) {
        return identifiers.map(utils.parseKeyString)
            .every(identifier => {
                return identifier === identifiers[0]
                    || (identifier.namespace === identifiers[0].namespace
                        && identifier.key === identifiers[0].key);
            });
    };

    ObjectAPI.prototype.getOriginalPath = function (identifier, path = []) {
        return this.get(identifier).then((domainObject) => {
            path.push(domainObject);
            let location = domainObject.location;

            if (location) {
                return this.getOriginalPath(utils.parseKeyString(location), path);
            } else {
                return path;
            }
        });
    };

    /**
     * Uniquely identifies a domain object.
     *
     * @typedef Identifier
     * @memberof module:openmct.ObjectAPI~
     * @property {string} namespace the namespace to/from which this domain
     *           object should be loaded/stored.
     * @property {string} key a unique identifier for the domain object
     *           within that namespace
     */

    /**
     * A domain object is an entity of relevance to a user's workflow, that
     * should appear as a distinct and meaningful object within the user
     * interface. Examples of domain objects are folders, telemetry sensors,
     * and so forth.
     *
     * A few common properties are defined for domain objects. Beyond these,
     * individual types of domain objects may add more as they see fit.
     *
     * @property {module:openmct.ObjectAPI~Identifier} identifier a key/namespace pair which
     *           uniquely identifies this domain object
     * @property {string} type the type of domain object
     * @property {string} name the human-readable name for this domain object
     * @property {string} [creator] the user name of the creator of this domain
     *           object
     * @property {number} [modified] the time, in milliseconds since the UNIX
     *           epoch, at which this domain object was last modified
     * @property {module:openmct.ObjectAPI~Identifier[]} [composition] if
     *           present, this will be used by the default composition provider
     *           to load domain objects
     * @typedef DomainObject
     * @memberof module:openmct
     */

    function hasAlreadyBeenPersisted(domainObject) {
        return domainObject.persisted !== undefined
            && domainObject.persisted === domainObject.modified;
    }

    return ObjectAPI;
});

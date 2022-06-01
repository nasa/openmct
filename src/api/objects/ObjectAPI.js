/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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

import utils from 'objectUtils';
import MutableDomainObject from './MutableDomainObject';
import RootRegistry from './RootRegistry';
import RootObjectProvider from './RootObjectProvider';
import EventEmitter from 'EventEmitter';
import InterceptorRegistry from './InterceptorRegistry';
import Transaction from './Transaction';
import ConflictError from './ConflictError';
import InMemorySearchProvider from './InMemorySearchProvider';

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
 * @typedef DomainObject
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
 * @memberof module:openmct
 */
/**
 * Utilities for loading, saving, and manipulating domain objects.
 * @interface ObjectAPI
 * @memberof module:openmct
 */
export default class ObjectAPI {
    constructor(typeRegistry, openmct) {
        this.openmct = openmct;
        this.typeRegistry = typeRegistry;
        this.SEARCH_TYPES = Object.freeze({
            OBJECTS: 'OBJECTS',
            ANNOTATIONS: 'ANNOTATIONS',
            NOTEBOOK_ANNOTATIONS: 'NOTEBOOK_ANNOTATIONS',
            TAGS: 'TAGS'
        });
        this.eventEmitter = new EventEmitter();
        this.providers = {};
        this.rootRegistry = new RootRegistry(openmct);
        this.inMemorySearchProvider = new InMemorySearchProvider(openmct);

        this.rootProvider = new RootObjectProvider(this.rootRegistry);
        this.cache = {};
        this.interceptorRegistry = new InterceptorRegistry();

        this.SYNCHRONIZED_OBJECT_TYPES = ['notebook', 'plan'];

        this.errors = {
            Conflict: ConflictError
        };
    }

    /**
     * Retrieve the provider for a given identifier.
     */
    getProvider(identifier) {
        if (identifier.key === 'ROOT') {
            return this.rootProvider;
        }

        return this.providers[identifier.namespace] || this.fallbackProvider;
    }

    /**
     * Get an active transaction instance
     * @returns {Transaction} a transaction object
     */
    getActiveTransaction() {
        return this.transaction;
    }

    /**
     * Get the root-level object.
     * @returns {Promise.<DomainObject>} a promise for the root object
     */
    getRoot() {
        return this.rootProvider.get();
    }

    /**
     * Register a new object provider for a particular namespace.
     *
     * @param {string} namespace the namespace for which to provide objects
     * @param {module:openmct.ObjectProvider} provider the provider which
     *        will handle loading domain objects from this namespace
     * @memberof {module:openmct.ObjectAPI#}
     * @name addProvider
     */
    addProvider(namespace, provider) {
        this.providers[namespace] = provider;
    }

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
     * @param {AbortController.signal} abortSignal (optional) signal to abort fetch requests
     * @returns {Promise} a promise which will resolve when the domain object
     *          has been saved, or be rejected if it cannot be saved
     */

    get(identifier, abortSignal) {
        let keystring = this.makeKeyString(identifier);

        if (this.cache[keystring] !== undefined) {
            return this.cache[keystring];
        }

        identifier = utils.parseKeyString(identifier);
        let dirtyObject;
        if (this.isTransactionActive()) {
            dirtyObject = this.transaction.getDirtyObject(identifier);
        }

        if (dirtyObject) {
            return Promise.resolve(dirtyObject);
        }

        const provider = this.getProvider(identifier);

        if (!provider) {
            throw new Error('No Provider Matched');
        }

        if (!provider.get) {
            throw new Error('Provider does not support get!');
        }

        let objectPromise = provider.get(identifier, abortSignal).then(result => {
            delete this.cache[keystring];

            result = this.applyGetInterceptors(identifier, result);
            if (result.isMutable) {
                result.$refresh(result);
            } else {
                let mutableDomainObject = this._toMutable(result);
                mutableDomainObject.$refresh(result);
            }

            return result;
        }).catch((result) => {
            console.warn(`Failed to retrieve ${keystring}:`, result);

            delete this.cache[keystring];

            result = this.applyGetInterceptors(identifier);

            return result;
        });

        this.cache[keystring] = objectPromise;

        return objectPromise;
    }

    /**
     * Search for domain objects.
     *
     * Object providersSearches and combines results of each object provider search.
     * Objects without search provided will have been indexed
     * and will be searched using the fallback in-memory search.
     * Search results are asynchronous and resolve in parallel.
     *
     * @method search
     * @memberof module:openmct.ObjectAPI#
     * @param {string} query the term to search for
     * @param {AbortController.signal} abortSignal (optional) signal to cancel downstream fetch requests
     * @param {string} searchType the type of search as defined by SEARCH_TYPES
     * @returns {Array.<Promise.<module:openmct.DomainObject>>}
     *          an array of promises returned from each object provider's search function
     *          each resolving to domain objects matching provided search query and options.
     */
    search(query, abortSignal, searchType = this.SEARCH_TYPES.OBJECTS) {
        if (!Object.keys(this.SEARCH_TYPES).includes(searchType.toUpperCase())) {
            throw new Error(`Unknown search type: ${searchType}`);
        }

        const searchPromises = Object.values(this.providers)
            .filter(provider => {
                return ((provider.supportsSearchType !== undefined) && provider.supportsSearchType(searchType));
            })
            .map(provider => provider.search(query, abortSignal, searchType));
        if (!this.inMemorySearchProvider.supportsSearchType(searchType)) {
            throw new Error(`${searchType} not implemented in inMemorySearchProvider`);
        }

        searchPromises.push(this.inMemorySearchProvider.search(query, searchType)
            .then(results => results.hits
                .map(hit => {
                    return hit;
                })));

        return searchPromises;
    }

    /**
     * Will fetch object for the given identifier, returning a version of the object that will automatically keep
     * itself updated as it is mutated. Before using this function, you should ask yourself whether you really need it.
     * The platform will provide mutable objects to views automatically if the underlying object can be mutated. The
     * platform will manage the lifecycle of any mutable objects that it provides. If you use `getMutable` you are
     * committing to managing that lifecycle yourself. `.destroy` should be called when the object is no longer needed.
     *
     * @memberof {module:openmct.ObjectAPI#}
     * @returns {Promise.<MutableDomainObject>} a promise that will resolve with a MutableDomainObject if
     * the object can be mutated.
     */
    getMutable(identifier) {
        if (!this.supportsMutation(identifier)) {
            throw new Error(`Object "${this.makeKeyString(identifier)}" does not support mutation.`);
        }

        return this.get(identifier).then((object) => {
            return this._toMutable(object);
        });
    }

    /**
     * This function is for cleaning up a mutable domain object when you're done with it.
     * You only need to use this if you retrieved the object using `getMutable()`. If the object was provided by the
     * platform (eg. passed into a `view()` function) then the platform is responsible for its lifecycle.
     * @param {MutableDomainObject} domainObject
     */
    destroyMutable(domainObject) {
        if (domainObject.isMutable) {
            return domainObject.$destroy();
        } else {
            throw new Error("Attempted to destroy non-mutable domain object");
        }
    }

    delete() {
        throw new Error('Delete not implemented');
    }

    isPersistable(idOrKeyString) {
        let identifier = utils.parseKeyString(idOrKeyString);
        let provider = this.getProvider(identifier);

        return provider !== undefined
            && provider.create !== undefined
            && provider.update !== undefined;
    }

    isMissing(domainObject) {
        let identifier = utils.makeKeyString(domainObject.identifier);
        let missingName = 'Missing: ' + identifier;

        return domainObject.name === missingName;
    }

    /**
     * Save this domain object in its current state.
     *
     * @memberof module:openmct.ObjectAPI#
     * @param {module:openmct.DomainObject} domainObject the domain object to
     *        save
     * @returns {Promise} a promise which will resolve when the domain object
     *          has been saved, or be rejected if it cannot be saved
     */
    save(domainObject) {
        let provider = this.getProvider(domainObject.identifier);
        let savedResolve;
        let savedReject;
        let result;

        if (!this.isPersistable(domainObject.identifier)) {
            result = Promise.reject('Object provider does not support saving');
        } else if (this.#hasAlreadyBeenPersisted(domainObject)) {
            result = Promise.resolve(true);
        } else {
            const persistedTime = Date.now();
            if (domainObject.persisted === undefined) {
                result = new Promise((resolve, reject) => {
                    savedResolve = resolve;
                    savedReject = reject;
                });
                domainObject.persisted = persistedTime;
                const newObjectPromise = provider.create(domainObject);
                if (newObjectPromise) {
                    newObjectPromise.then(response => {
                        this.mutate(domainObject, 'persisted', persistedTime);
                        savedResolve(response);
                    }).catch((error) => {
                        savedReject(error);
                    });
                } else {
                    result = Promise.reject(`[ObjectAPI][save] Object provider returned ${newObjectPromise} when creating new object.`);
                }
            } else {
                domainObject.persisted = persistedTime;
                this.mutate(domainObject, 'persisted', persistedTime);
                result = provider.update(domainObject);
            }
        }

        return result;
    }

    /**
     * After entering into edit mode, creates a new instance of Transaction to keep track of changes in Objects
     */
    startTransaction() {
        if (this.isTransactionActive()) {
            throw new Error("Unable to start new Transaction: Previous Transaction is active");
        }

        this.transaction = new Transaction(this);
    }

    /**
     * Clear instance of Transaction
     */
    endTransaction() {
        this.transaction = null;
    }

    /**
     * Add a root-level object.
     * @param {module:openmct.ObjectAPI~Identifier|array|function} identifier an identifier or
     *        an array of identifiers for root level objects, or a function that returns a
     *        promise for an identifier or an array of root level objects.
     * @param {module:openmct.PriorityAPI~priority|Number} priority a number representing
     *        this item(s) position in the root object's composition (example: order in object tree).
     *        For arrays, they are treated as blocks.
     * @method addRoot
     * @memberof module:openmct.ObjectAPI#
     */
    addRoot(identifier, priority) {
        this.rootRegistry.addRoot(identifier, priority);
    }

    /**
     * Register an object interceptor that transforms a domain object requested via module:openmct.ObjectAPI.get
     * The domain object will be transformed after it is retrieved from the persistence store
     * The domain object will be transformed only if the interceptor is applicable to that domain object as defined by the InterceptorDef
     *
     * @param {module:openmct.InterceptorDef} interceptorDef the interceptor definition to add
     * @method addGetInterceptor
     * @memberof module:openmct.InterceptorRegistry#
     */
    addGetInterceptor(interceptorDef) {
        this.interceptorRegistry.addInterceptor(interceptorDef);
    }

    /**
     * Retrieve the interceptors for a given domain object.
     * @private
     */
    #listGetInterceptors(identifier, object) {
        return this.interceptorRegistry.getInterceptors(identifier, object);
    }

    /**
     * Inovke interceptors if applicable for a given domain object.
     * @private
     */
    applyGetInterceptors(identifier, domainObject) {
        const interceptors = this.#listGetInterceptors(identifier, domainObject);
        interceptors.forEach(interceptor => {
            domainObject = interceptor.invoke(identifier, domainObject);
        });

        return domainObject;
    }

    /**
     * Return relative url path from a given object path
     * eg: #/browse/mine/cb56f6bf-c900-43b7-b923-2e3b64b412db/6e89e858-77ce-46e4-a1ad-749240286497/....
     * @param {Array} objectPath
     * @returns {string} relative url for object
     */
    getRelativePath(objectPath) {
        return objectPath
            .map(p => this.makeKeyString(p.identifier))
            .reverse()
            .join('/');
    }

    /**
     * Modify a domain object.
     * @param {module:openmct.DomainObject} object the object to mutate
     * @param {string} path the property to modify
     * @param {*} value the new value for this property
     * @method mutate
     * @memberof module:openmct.ObjectAPI#
     */
    mutate(domainObject, path, value) {
        if (!this.supportsMutation(domainObject.identifier)) {
            throw `Error: Attempted to mutate immutable object ${domainObject.name}`;
        }

        if (domainObject.isMutable) {
            domainObject.$set(path, value);
        } else {
            //Creating a temporary mutable domain object allows other mutable instances of the
            //object to be kept in sync.
            let mutableDomainObject = this._toMutable(domainObject);

            //Mutate original object
            MutableDomainObject.mutateObject(domainObject, path, value);

            //Mutate temporary mutable object, in the process informing any other mutable instances
            mutableDomainObject.$set(path, value);

            //Destroy temporary mutable object
            this.destroyMutable(mutableDomainObject);
        }

        if (this.isTransactionActive()) {
            this.transaction.add(domainObject);
        } else {
            this.save(domainObject);
        }
    }

    /**
     * @private
     */
    _toMutable(object) {
        let mutableObject;

        if (object.isMutable) {
            mutableObject = object;
        } else {
            mutableObject = MutableDomainObject.createMutable(object, this.eventEmitter);

            // Check if provider supports realtime updates
            let identifier = utils.parseKeyString(mutableObject.identifier);
            let provider = this.getProvider(identifier);

            if (provider !== undefined
                && provider.observe !== undefined
                && this.SYNCHRONIZED_OBJECT_TYPES.includes(object.type)) {
                let unobserve = provider.observe(identifier, (updatedModel) => {
                    if (updatedModel.persisted > mutableObject.modified) {
                        //Don't replace with a stale model. This can happen on slow connections when multiple mutations happen
                        //in rapid succession and intermediate persistence states are returned by the observe function.
                        updatedModel = this.applyGetInterceptors(identifier, updatedModel);
                        mutableObject.$refresh(updatedModel);
                    }
                });
                mutableObject.$on('$_destroy', () => {
                    unobserve();
                });
            }
        }

        return mutableObject;
    }

    /**
     * Updates a domain object based on its latest persisted state. Note that this will mutate the provided object.
     * @param {module:openmct.DomainObject} domainObject an object to refresh from its persistence store
     * @returns {Promise} the provided object, updated to reflect the latest persisted state of the object.
     */
    async refresh(domainObject) {
        const refreshedObject = await this.get(domainObject.identifier);

        if (domainObject.isMutable) {
            domainObject.$refresh(refreshedObject);
        } else {
            utils.refresh(domainObject, refreshedObject);
        }

        return domainObject;
    }

    /**
     * @param module:openmct.ObjectAPI~Identifier identifier An object identifier
     * @returns {boolean} true if the object can be mutated, otherwise returns false
     */
    supportsMutation(identifier) {
        return this.isPersistable(identifier);
    }

    /**
     * Observe changes to a domain object.
     * @param {module:openmct.DomainObject} object the object to observe
     * @param {string} path the property to observe
     * @param {Function} callback a callback to invoke when new values for
     *        this property are observed
     * @method observe
     * @memberof module:openmct.ObjectAPI#
     */
    observe(domainObject, path, callback) {
        if (domainObject.isMutable) {
            return domainObject.$observe(path, callback);
        } else {
            let mutable = this._toMutable(domainObject);
            mutable.$observe(path, callback);

            return () => mutable.$destroy();
        }
    }

    /**
     * @param {module:openmct.ObjectAPI~Identifier} identifier
     * @returns {string} A string representation of the given identifier, including namespace and key
     */
    makeKeyString(identifier) {
        return utils.makeKeyString(identifier);
    }

    /**
     * @param {string} keyString A string representation of the given identifier, that is, a namespace and key separated by a colon.
     * @returns {module:openmct.ObjectAPI~Identifier} An identifier object
     */
    parseKeyString(keyString) {
        return utils.parseKeyString(keyString);
    }

    /**
     * Given any number of identifiers, will return true if they are all equal, otherwise false.
     * @param {module:openmct.ObjectAPI~Identifier[]} identifiers
     */
    areIdsEqual(...identifiers) {
        return identifiers.map(utils.parseKeyString)
            .every(identifier => {
                return identifier === identifiers[0]
                    || (identifier.namespace === identifiers[0].namespace
                        && identifier.key === identifiers[0].key);
            });
    }

    getOriginalPath(identifier, path = []) {
        return this.get(identifier).then((domainObject) => {
            path.push(domainObject);
            let location = domainObject.location;

            if (location) {
                return this.getOriginalPath(utils.parseKeyString(location), path);
            } else {
                return path;
            }
        });
    }

    isObjectPathToALink(domainObject, objectPath) {
        return objectPath !== undefined
            && objectPath.length > 1
            && domainObject.location !== this.makeKeyString(objectPath[1].identifier);
    }

    isTransactionActive() {
        return Boolean(this.transaction && this.openmct.editor.isEditing());
    }

    #hasAlreadyBeenPersisted(domainObject) {
        const result = domainObject.persisted !== undefined
            && domainObject.persisted >= domainObject.modified;

        return result;
    }
}

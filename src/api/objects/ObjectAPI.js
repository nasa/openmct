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
 * @typedef {object} Identifier
 * @property {string} namespace the namespace to/from which this domain
 *           object should be loaded/stored.
 * @property {string} key a unique identifier for the domain object
 *           within that namespace
 * @memberof module:openmct.ObjectAPI~
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
 * @typedef {object} DomainObject
 * @property {Identifier} identifier a key/namespace pair which
 *           uniquely identifies this domain object
 * @property {string} type the type of domain object
 * @property {string} name the human-readable name for this domain object
 * @property {string} [creator] the user name of the creator of this domain
 *           object
 * @property {number} [modified] the time, in milliseconds since the UNIX
 *           epoch, at which this domain object was last modified
 * @property {Identifier[]} [composition] if
 *           present, this will be used by the default composition provider
 *           to load domain objects
 * @property {Object.<string, any>} [configuration] A key-value map containing configuration
 *           settings for this domain object.
 * @memberof module:openmct.ObjectAPI~
 */

/**
 * @readonly
 * @enum {string} SEARCH_TYPES
 * @property {string} OBJECTS Search for objects
 * @property {string} ANNOTATIONS Search for annotations
 * @property {string} TAGS Search for tags
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
      TAGS: 'TAGS'
    });
    this.eventEmitter = new EventEmitter();
    this.providers = {};
    this.rootRegistry = new RootRegistry(openmct);
    this.inMemorySearchProvider = new InMemorySearchProvider(openmct);

    this.rootProvider = new RootObjectProvider(this.rootRegistry);
    this.cache = {};
    this.interceptorRegistry = new InterceptorRegistry();

    this.SYNCHRONIZED_OBJECT_TYPES = ['notebook', 'restricted-notebook', 'plan', 'annotation'];

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
   * @param {string} key the key for the domain object to load
   * @param {AbortSignal} abortSignal (optional) signal to abort fetch requests
   * @param {boolean} [forceRemote=false] defaults to false. If true, will skip cached and
   *          dirty/in-transaction objects use and the provider.get method
   * @returns {Promise<DomainObject>} a promise which will resolve when the domain object
   *          has been saved, or be rejected if it cannot be saved
   */
  get(identifier, abortSignal, forceRemote = false) {
    let keystring = this.makeKeyString(identifier);

    if (!forceRemote) {
      if (this.cache[keystring] !== undefined) {
        return this.cache[keystring];
      }

      identifier = utils.parseKeyString(identifier);

      if (this.isTransactionActive()) {
        let dirtyObject = this.transaction.getDirtyObject(identifier);

        if (dirtyObject) {
          return Promise.resolve(dirtyObject);
        }
      }
    }

    const provider = this.getProvider(identifier);

    if (!provider) {
      throw new Error(`No Provider Matched for keyString "${this.makeKeyString(identifier)}}"`);
    }

    if (!provider.get) {
      throw new Error('Provider does not support get!');
    }

    let objectPromise = provider
      .get(identifier, abortSignal)
      .then((domainObject) => {
        delete this.cache[keystring];
        domainObject = this.applyGetInterceptors(identifier, domainObject);

        if (this.supportsMutation(identifier)) {
          const mutableDomainObject = this.toMutable(domainObject);
          mutableDomainObject.$refresh(domainObject);
          this.destroyMutable(mutableDomainObject);
        }

        return domainObject;
      })
      .catch((error) => {
        delete this.cache[keystring];

        // suppress abort errors
        if (error.name === 'AbortError') {
          return;
        }

        console.warn(`Failed to retrieve ${keystring}:`, error);

        return this.applyGetInterceptors(identifier);
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
      .filter((provider) => {
        return provider.supportsSearchType !== undefined && provider.supportsSearchType(searchType);
      })
      .map((provider) => provider.search(query, abortSignal, searchType));
    if (!this.inMemorySearchProvider.supportsSearchType(searchType)) {
      throw new Error(`${searchType} not implemented in inMemorySearchProvider`);
    }

    searchPromises.push(
      this.inMemorySearchProvider.search(query, searchType).then((results) =>
        results.hits.map((hit) => {
          return hit;
        })
      )
    );

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
      return this.toMutable(object);
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
      throw new Error('Attempted to destroy non-mutable domain object');
    }
  }

  delete() {
    throw new Error('Delete not implemented');
  }

  isPersistable(idOrKeyString) {
    let identifier = utils.parseKeyString(idOrKeyString);
    let provider = this.getProvider(identifier);

    return provider !== undefined && provider.create !== undefined && provider.update !== undefined;
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
  async save(domainObject) {
    const provider = this.getProvider(domainObject.identifier);
    let result;
    let lastPersistedTime;

    if (!this.isPersistable(domainObject.identifier)) {
      result = Promise.reject('Object provider does not support saving');
    } else if (this.#hasAlreadyBeenPersisted(domainObject)) {
      result = Promise.resolve(true);
    } else {
      const username = await this.#getCurrentUsername();
      const isNewObject = domainObject.persisted === undefined;
      let savedResolve;
      let savedReject;
      let savedObjectPromise;

      result = new Promise((resolve, reject) => {
        savedResolve = resolve;
        savedReject = reject;
      });

      this.#mutate(domainObject, 'modifiedBy', username);

      if (isNewObject) {
        this.#mutate(domainObject, 'createdBy', username);

        const createdTime = Date.now();
        this.#mutate(domainObject, 'created', createdTime);

        const persistedTime = Date.now();
        this.#mutate(domainObject, 'persisted', persistedTime);

        savedObjectPromise = provider.create(domainObject);
      } else {
        lastPersistedTime = domainObject.persisted;
        const persistedTime = Date.now();
        this.#mutate(domainObject, 'persisted', persistedTime);
        savedObjectPromise = provider.update(domainObject);
      }

      if (savedObjectPromise) {
        savedObjectPromise
          .then((response) => {
            savedResolve(response);
          })
          .catch((error) => {
            if (!isNewObject) {
              this.#mutate(domainObject, 'persisted', lastPersistedTime);
            }

            savedReject(error);
          });
      } else {
        result = Promise.reject(
          `[ObjectAPI][save] Object provider returned ${savedObjectPromise} when ${
            isNewObject ? 'creating new' : 'updating'
          } object.`
        );
      }
    }

    return result.catch(async (error) => {
      if (error instanceof this.errors.Conflict) {
        // Synchronized objects will resolve their own conflicts
        if (this.SYNCHRONIZED_OBJECT_TYPES.includes(domainObject.type)) {
          this.openmct.notifications.info(
            `Conflict detected while saving "${this.makeKeyString(
              domainObject.name
            )}", attempting to resolve`
          );
        } else {
          this.openmct.notifications.error(
            `Conflict detected while saving ${this.makeKeyString(domainObject.identifier)}`
          );

          if (this.isTransactionActive()) {
            this.endTransaction();
          }

          await this.refresh(domainObject);
        }
      }

      throw error;
    });
  }

  async #getCurrentUsername() {
    const user = await this.openmct.user.getCurrentUser();
    let username;

    if (user !== undefined) {
      username = user.getName();
    }

    return username;
  }

  /**
   * After entering into edit mode, creates a new instance of Transaction to keep track of changes in Objects
   *
   * @returns {Transaction} a new Transaction that was just created
   */
  startTransaction() {
    if (this.isTransactionActive()) {
      throw new Error('Unable to start new Transaction: Previous Transaction is active');
    }

    this.transaction = new Transaction(this);

    return this.transaction;
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
    interceptors.forEach((interceptor) => {
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
      .map((p) => this.makeKeyString(p.identifier))
      .reverse()
      .join('/');
  }

  /**
   * Return path of telemetry objects in the object composition
   * @param {object} identifier the identifier for the domain object to query for
   * @param {object} [telemetryIdentifier] the specific identifier for the telemetry
   *  to look for in the composition, uses first object in composition otherwise
   * @returns {Array} path of telemetry object in object composition
   */
  async getTelemetryPath(identifier, telemetryIdentifier) {
    const objectDetails = await this.get(identifier);
    const telemetryPath = [];
    if (objectDetails.composition && !['folder'].includes(objectDetails.type)) {
      let sourceTelemetry = objectDetails.composition[0];
      if (telemetryIdentifier) {
        sourceTelemetry = objectDetails.composition.find(
          (telemetrySource) =>
            this.makeKeyString(telemetrySource) === this.makeKeyString(telemetryIdentifier)
        );
      }
      const compositionElement = await this.get(sourceTelemetry);
      if (!['yamcs.telemetry', 'generator'].includes(compositionElement.type)) {
        return telemetryPath;
      }
      const telemetryKey = compositionElement.identifier.key;
      const telemetryPathObjects = await this.getOriginalPath(telemetryKey);
      telemetryPathObjects.forEach((pathObject) => {
        if (pathObject.type === 'root') {
          return;
        }
        telemetryPath.unshift(pathObject.name);
      });
    }
    return telemetryPath;
  }

  /**
   * Modify a domain object. Internal to ObjectAPI, won't call save after.
   * @private
   *
   * @param {module:openmct.DomainObject} object the object to mutate
   * @param {string} path the property to modify
   * @param {*} value the new value for this property
   * @method mutate
   * @memberof module:openmct.ObjectAPI#
   */
  #mutate(domainObject, path, value) {
    if (!this.supportsMutation(domainObject.identifier)) {
      throw `Error: Attempted to mutate immutable object ${domainObject.name}`;
    }

    if (domainObject.isMutable) {
      domainObject.$set(path, value);
    } else {
      //Creating a temporary mutable domain object allows other mutable instances of the
      //object to be kept in sync.
      let mutableDomainObject = this.toMutable(domainObject);

      //Mutate original object
      MutableDomainObject.mutateObject(domainObject, path, value);

      //Mutate temporary mutable object, in the process informing any other mutable instances
      mutableDomainObject.$set(path, value);

      //Destroy temporary mutable object
      this.destroyMutable(mutableDomainObject);
    }
  }

  /**
   * Modify a domain object and save.
   * @param {module:openmct.DomainObject} object the object to mutate
   * @param {string} path the property to modify
   * @param {*} value the new value for this property
   * @method mutate
   * @memberof module:openmct.ObjectAPI#
   */
  mutate(domainObject, path, value) {
    this.#mutate(domainObject, path, value);

    if (this.isTransactionActive()) {
      this.transaction.add(domainObject);
    } else {
      this.save(domainObject);
    }
  }

  /**
   * Create a mutable domain object from an existing domain object
   * @param {module:openmct.DomainObject} domainObject the object to make mutable
   * @returns {MutableDomainObject} a mutable domain object that will automatically sync
   * @method toMutable
   * @memberof module:openmct.ObjectAPI#
   */
  toMutable(domainObject) {
    let mutableObject;

    if (domainObject.isMutable) {
      mutableObject = domainObject;
    } else {
      mutableObject = MutableDomainObject.createMutable(domainObject, this.eventEmitter);

      // Check if provider supports realtime updates
      let identifier = utils.parseKeyString(mutableObject.identifier);
      let provider = this.getProvider(identifier);

      if (
        provider !== undefined &&
        provider.observe !== undefined &&
        this.SYNCHRONIZED_OBJECT_TYPES.includes(domainObject.type)
      ) {
        let unobserve = provider.observe(identifier, (updatedModel) => {
          // modified can sometimes be undefined, so make it 0 in this case
          const mutableObjectModification = mutableObject.modified ?? Number.MIN_SAFE_INTEGER;
          if (updatedModel.persisted > mutableObjectModification) {
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
   *        this property are observed.
   * @method observe
   * @memberof module:openmct.ObjectAPI#
   */
  observe(domainObject, path, callback) {
    if (domainObject.isMutable) {
      return domainObject.$observe(path, callback);
    } else {
      let mutable = this.toMutable(domainObject);
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
    const firstIdentifier = utils.parseKeyString(identifiers[0]);

    return identifiers.map(utils.parseKeyString).every((identifier) => {
      return (
        identifier === firstIdentifier ||
        (identifier.namespace === firstIdentifier.namespace &&
          identifier.key === firstIdentifier.key)
      );
    });
  }

  /**
   * Given an original path check if the path is reachable via root
   * @param {Array<Object>} originalPath an array of path objects to check
   * @returns {boolean} whether the domain object is reachable
   */
  isReachable(originalPath) {
    if (originalPath && originalPath.length) {
      return originalPath[originalPath.length - 1].type === 'root';
    }

    return false;
  }

  #pathContainsDomainObject(keyStringToCheck, path) {
    if (!keyStringToCheck) {
      return false;
    }

    return path.some((pathElement) => {
      const identifierToCheck = utils.parseKeyString(keyStringToCheck);

      return this.areIdsEqual(identifierToCheck, pathElement.identifier);
    });
  }

  /**
   * Given an identifier, constructs the original path by walking up its parents
   * @param {module:openmct.ObjectAPI~Identifier} identifier
   * @param {Array<module:openmct.DomainObject>} path an array of path objects
   * @returns {Promise<Array<module:openmct.DomainObject>>} a promise containing an array of domain objects
   */
  async getOriginalPath(identifier, path = []) {
    const domainObject = await this.get(identifier);
    path.push(domainObject);
    const { location } = domainObject;
    if (location && !this.#pathContainsDomainObject(location, path)) {
      // if we have a location, and we don't already have this in our constructed path,
      // then keep walking up the path
      return this.getOriginalPath(utils.parseKeyString(location), path);
    } else {
      return path;
    }
  }

  /**
   * Parse and construct an `objectPath` from a `navigationPath`.
   *
   * A `navigationPath` is a string of the form `"/browse/<keyString>/<keyString>/..."` that is used
   * by the Open MCT router to navigate to a specific object.
   *
   * Throws an error if the `navigationPath` is malformed.
   *
   * @param {string} navigationPath
   * @returns {DomainObject[]} objectPath
   */
  async getRelativeObjectPath(navigationPath) {
    if (!navigationPath.startsWith('/browse/')) {
      throw new Error(`Malformed navigation path: "${navigationPath}"`);
    }

    navigationPath = navigationPath.replace('/browse/', '');

    if (!navigationPath || navigationPath === '/') {
      return [];
    }

    // Remove any query params and split on '/'
    const keyStrings = navigationPath.split('?')?.[0].split('/');

    if (keyStrings[0] !== 'ROOT') {
      keyStrings.unshift('ROOT');
    }

    const objectPath = (
      await Promise.all(
        keyStrings.map((keyString) =>
          this.supportsMutation(keyString)
            ? this.getMutable(utils.parseKeyString(keyString))
            : this.get(utils.parseKeyString(keyString))
        )
      )
    ).reverse();

    return objectPath;
  }

  isObjectPathToALink(domainObject, objectPath) {
    return (
      objectPath !== undefined &&
      objectPath.length > 1 &&
      domainObject.location !== this.makeKeyString(objectPath[1].identifier)
    );
  }

  isTransactionActive() {
    return this.transaction !== undefined && this.transaction !== null;
  }

  #hasAlreadyBeenPersisted(domainObject) {
    // modified can sometimes be undefined, so make it 0 in this case
    const modified = domainObject.modified ?? Number.MIN_SAFE_INTEGER;
    const result = domainObject.persisted !== undefined && domainObject.persisted >= modified;

    return result;
  }
}

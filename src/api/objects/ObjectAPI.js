/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    './object-utils',
    './MutableObject',
    './RootRegistry',
    './RootObjectProvider',
    'EventEmitter',
    'uuid'
], function (
    _,
    utils,
    MutableObject,
    RootRegistry,
    RootObjectProvider,
    EventEmitter,
    uuid
) {


    /**
     * Utilities for loading, saving, and manipulating domain objects.
     * @interface ObjectAPI
     * @memberof module:openmct
     */

    function ObjectAPI() {
        this.eventEmitter = new EventEmitter();
        this.providers = {};
        this.rootRegistry = new RootRegistry();
        this.rootProvider = new RootObjectProvider(this.rootRegistry);
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
     * Save this domain object in its current state.
     *
     * @method save
     * @memberof module:openmct.ObjectProvider#
     * @param {module:openmct.DomainObject} domainObject the domain object to
     *        save
     * @returns {Promise} a promise which will resolve when the domain object
     *          has been saved, or be rejected if it cannot be saved
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
        identifier = utils.parseKeyString(identifier);
        var provider = this.getProvider(identifier);

        if (!provider) {
            throw new Error('No Provider Matched');
        }

        if (!provider.get) {
            throw new Error('Provider does not support get!');
        }

        return provider.get(identifier)
            .then((object) => {
                if (needsMigration(object)) {
                    migrateObject(object)
                        .then(newObject => {
                            console.log("mutate new object", newObject, "object", object);
                            openmct.objects.mutate(object, '*', newObject);
                            return newObject;
                        });
                }
                return object;
            });
    };

    ObjectAPI.prototype.delete = function () {
        throw new Error('Delete not implemented');
    };

    ObjectAPI.prototype.save = function () {
        throw new Error('Save not implemented');
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
        var mutableObject =
            new MutableObject(this.eventEmitter, domainObject);
        return mutableObject.set(path, value);
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
        var mutableObject =
            new MutableObject(this.eventEmitter, domainObject);
        mutableObject.on(path, callback);
        return mutableObject.stopListening.bind(mutableObject);
    };

    /**
     * @param {module:openmct.ObjectAPI~Identifier} identifier
     * @returns {string} A string representation of the given identifier, including namespace and key
     */
    ObjectAPI.prototype.makeKeyString = function (identifier) {
        return utils.makeKeyString(identifier);
    };

    let migrations = [
        {
            check(domainObject) {
                return domainObject.type === 'layout' && domainObject.configuration.layout;
            },
            migrate(domainObject) {
                console.log("Migrating Display Layout", domainObject);
                let childObjects = {};
                let promises = Object.keys(domainObject.configuration.layout.panels).map(key => {
                    return openmct.objects.get(key)
                        .then(object => {
                            childObjects[key] = object;
                        });
                });

                return Promise.all(promises)
                    .then(function () {
                        return migrateDisplayLayout(domainObject, childObjects);
                    });
            },
        },
        {
            check(domainObject) {
                return domainObject.type === 'telemetry.fixed' && domainObject.configuration['fixed-display'];
            },
            migrate(domainObject) {
                console.log("Migrating Fixed Position", domainObject);
                const DEFAULT_GRID_SIZE = [64, 16];
                let newLayoutObject = {
                    identifier: domainObject.identifier,
                    location: domainObject.location,
                    name: domainObject.name,
                    type: "layout"
                };
                let layoutType = openmct.types.get('layout');
                layoutType.definition.initialize(newLayoutObject);
                newLayoutObject.composition = domainObject.composition;
                newLayoutObject.configuration.layoutGrid = domainObject.layoutGrid || DEFAULT_GRID_SIZE;

                let elements = domainObject.configuration['fixed-display'].elements;
                let telemetryObjects = {};
                let promises = elements.map(element => {
                    if (element.id) {
                        return openmct.objects.get(element.id)
                            .then(object => {
                                telemetryObjects[element.id] = object;
                            });
                    }
                });

                return Promise.all(promises)
                    .then(function () {
                        newLayoutObject.configuration.items =
                            migrateFixedPositionConfigurataion(elements, telemetryObjects);
                        // TODO: delete domainObject
                        // TODO: add newLayoutObject to the path   
                        console.log("Migrated FP", newLayoutObject);
                        return newLayoutObject;
                    });
            }
        }
    ];

    function needsMigration(domainObject) {
        return migrations.some(m => m.check(domainObject));
    }

    function migrateObject(domainObject) {
        return migrations.filter(m => m.check(domainObject))
            .reduce((o, m) => "").migrate(domainObject);
    }

    function isTelemetry(domainObject) {
        if (openmct.telemetry.isTelemetryObject(domainObject) && domainObject.type !== 'summary-widget') {
            return true;
        } else {
            return false;
        }
    }

    function migrateDisplayLayout(domainObject, childObjects) {
        const DEFAULT_GRID_SIZE = [32, 32];
        let migratedObject = {...domainObject};
        let panels = migratedObject.configuration.layout.panels;
        let items = [];

        Object.keys(panels).forEach(key => {
            let panel = panels[key];
            let domainObject = childObjects[key];

            if (isTelemetry(domainObject)) {
                items.push({
                    width: panel.dimensions[0],
                    height: panel.dimensions[1],
                    x: panel.position[0],
                    y: panel.position[1],
                    useGrid: true,
                    identifier: domainObject.identifier,
                    id: uuid(),
                    type: 'telemetry-view',
                    displayMode: 'all',
                    value: openmct.telemetry.getMetadata(domainObject).getDefaultDisplayValue(),
                    stroke: "transparent",
                    fill: "",
                    color: "",
                    size: "13px"
                });
            } else {
                items.push({
                    width: panel.dimensions[0],
                    height: panel.dimensions[1],
                    x: panel.position[0],
                    y: panel.position[1],
                    useGrid: true,
                    identifier: domainObject.identifier,
                    id: uuid(),
                    type: 'subobject-view',
                    hasFrame: panel.hasFrame
                });
            }
            // TODO: check for fixed position and nested layout?
        });

        migratedObject.configuration.items = items;
        migratedObject.configuration.layoutGrid = migratedObject.layoutGrid || DEFAULT_GRID_SIZE;
        delete migratedObject.layoutGrid;
        delete migratedObject.configuration.layout;
        console.log("Migrated layout", migratedObject);
        return migratedObject;
    }

    function migrateFixedPositionConfigurataion(elements, telemetryObjects) {
        let items = [];

        elements.forEach(element => {
            let item = {
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
                useGrid: element.useGrid,
                id: uuid()
            };

            if (element.type === "fixed.telemetry") {
                item.type = "telemetry-view";
                item.stroke = element.stroke || "transparent";
                item.fill = element.fill || "";
                item.color = element.color || "";
                item.size = element.size || "13px";
                item.identifier = telemetryObjects[element.id].identifier;
                item.displayMode = 'all'; // TODO: What about element.titled?
                item.value = openmct.telemetry.getMetadata(telemetryObjects[element.id]).getDefaultDisplayValue();
            } else if (element.type === 'fixed.box') {
                item.type = "box-view";
                item.stroke = element.stroke || "transparent";
                item.fill = element.fill || "";
            } else if (element.type === 'fixed.line') {
                item.type = "line-view";
                item.x2 = element.x2;
                item.y2 = element.y2;
                item.stroke = element.stroke || "transparent";
                delete item.height;
                delete item.width;
            } else if (element.type === 'fixed.text') {
                item.type = "text-view";
                item.text = element.text;
                item.stroke = element.stroke || "transparent";
                item.fill = element.fill || "";
                item.color = element.color || "";
                item.size = element.size || "13px";
            } else if (element.type === 'fixed.image') {
                item.type = "image-view";
                item.url =element.url;
                item.stroke = element.stroke || "transparent";
            }

            items.push(item);
        });

        return items;
    }

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

    return ObjectAPI;
});

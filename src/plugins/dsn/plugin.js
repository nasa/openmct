
'use strict';

define([

], function (

) {
    var canberraObjects,
        dictionary,
        goldstoneObjects,
        madridObjects,
        rootObjects;

    var CANBERRA_NAMESPACE = 'canberra',
        DSN_DICTIONARY_URI = 'src/plugins/dsn/res/dsn-dictionary.json',
        DSN_KEY = 'dsn',
        DSN_NAMESPACE = 'deep.space.network',
        DSN_COLLECTION_TYPE = 'dsn.collection',
        DSN_TELEMETRY_TYPE = 'dsn.telemetry',
        GOLDSTONE_NAMESPACE = 'goldstone',
        MADRID_NAMESPACE = 'madrid',
        ROOT_NAMESPACE = 'root';

    function getDsnDictionary() {
        // TODO: Replace http with library from npm
        return http.get(DSN_DICTIONARY_URI)
            .then(function (result) {
                return result.data;
            });
    }

    var rootObjectProvider = {
        get: function (identifier) {
            if (identifier.key === DSN_KEY) {
                // Return the root "Deep Space Network" object
                return Promise.resolve({
                    identifier: dictionary.identifier,
                    name: dictionary.name,
                    type: dictionary.type,
                    location: dictionary.location
                });
            } else {
                // Return the root objects for Canberra, Goldstone and Madrid
                var domainObject = rootObjects.filter(function (domainObj) {
                    return domainObj.identifier.key === identifier.key;
                }).shift();

                return Promise.resolve(domainObject);
            }
        }
    };

    var canberraObjectProvider = {
        get: function (identifier) {
            // Return the Canberra telemetry objects
            var domainObject = canberraObjects.filter(function (domainObj) {
                return domainObj.identifier.key === identifier.key;
            }).shift();

            return Promise.resolve(domainObject);
        }
    };

    var goldstoneObjectProvider = {
        get: function (identifier) {
            // Return the Goldstone telemetry objects
            var domainObject = goldstoneObjects.filter(function (domainObj) {
                return domainObj.identifier.key === identifier.key;
            }).shift();

            return Promise.resolve(domainObject);
        }
    };

    var madridObjectProvider = {
        get: function (identifier) {
            // Return the Madrid telemetry objects
            var domainObject = madridObjects.filter(function (domainObj) {
                return domainObj.identifier.key === identifier.key;
            }).shift();

            return Promise.resolve(domainObject);
        }
    };

    var compositionProvider = {
        appliesTo: function (domainObject) {
            return domainObject.type === DSN_COLLECTION_TYPE;
        },
        load: function (domainObject) {
            var domainObjects;

            switch (domainObject.identifier.key) {
            case CANBERRA_NAMESPACE:
                domainObjects = canberraObjects.map(function (domainObj) {
                    return {
                        namespace: domainObj.identifier.namespace,
                        key: domainObj.identifier.key
                    };
                });
                break;
            case GOLDSTONE_NAMESPACE:
                domainObjects = goldstoneObjects.map(function (domainObj) {
                    return {
                        namespace: domainObj.identifier.namespace,
                        key: domainObj.identifier.key
                    };
                });
                break;
            case MADRID_NAMESPACE:
                domainObjects = madridObjects.map(function (domainObj) {
                    return {
                        namespace: domainObj.identifier.namespace,
                        key: domainObj.identifier.key
                    };
                });
                break;
            default:
                domainObjects = rootObjects.map(function (domainObj) {
                    return {
                        namespace: DSN_NAMESPACE,
                        key: domainObj.identifier.key
                    };
                });
            }

            return Promise.resolve(domainObjects);
        }
    };

    function DsnPlugin() {
        return function install(openmct) {
            openmct.objects.addRoot({
                namespace: DSN_NAMESPACE,
                key: DSN_KEY
            });

            // Add providers after the dictionary has been fetched
            getDsnDictionary().then(function (dsnDictionary) {
                dictionary = dsnDictionary;

                // Split domain objects for use in object and composition providers
                canberraObjects = dictionary.domainObjects.filter(function (domainObj) {
                    return domainObj.identifier.namespace === CANBERRA_NAMESPACE;
                });

                goldstoneObjects = dictionary.domainObjects.filter(function (domainObj) {
                    return domainObj.identifier.namespace === GOLDSTONE_NAMESPACE;
                });

                madridObjects = dictionary.domainObjects.filter(function (domainObj) {
                    return domainObj.identifier.namespace === MADRID_NAMESPACE;
                });

                rootObjects = dictionary.domainObjects.filter(function (domainObj) {
                    return domainObj.identifier.namespace === CANBERRA_NAMESPACE + '.' + ROOT_NAMESPACE ||
                            domainObj.identifier.namespace === GOLDSTONE_NAMESPACE + '.' + ROOT_NAMESPACE ||
                            domainObj.identifier.namespace === MADRID_NAMESPACE + '.' + ROOT_NAMESPACE;
                });

                openmct.objects.addProvider(DSN_NAMESPACE, rootObjectProvider);
                openmct.objects.addProvider(CANBERRA_NAMESPACE, canberraObjectProvider);
                openmct.objects.addProvider(GOLDSTONE_NAMESPACE, goldstoneObjectProvider);
                openmct.objects.addProvider(MADRID_NAMESPACE, madridObjectProvider);
                openmct.composition.addProvider(compositionProvider);
            });

            // This type represents DSN domain objects that contain other DSN objects
            openmct.types.addType(DSN_COLLECTION_TYPE, {
                name: 'DSNCollection',
                description: 'A DSN domain object that contains DSN objects with telemetry.',
                cssClass: 'icon-folder'
            });

            // This type represents DSN domain objects with telemetry
            openmct.types.addType(DSN_TELEMETRY_TYPE, {
                name: 'DSNTelemetry',
                description: 'A DSN domain object with telemetry.',
                cssClass: 'icon-telemetry'
            });
        };
    }

    return DsnPlugin;
});

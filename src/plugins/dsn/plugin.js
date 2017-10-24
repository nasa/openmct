
define([
    './DsnParser'
], function (
    DsnParser
) {
    'use strict';

    var canberraObjects,
        dictionary,
        goldstoneObjects,
        listeners = {},
        madridObjects,
        rootObjects;

    var CANBERRA_NAMESPACE = 'canberra',
        DSN_DICTIONARY_URI = 'src/plugins/dsn/res/dsn-dictionary.json',
        DSN_KEY = 'dsn',
        DSN_NAMESPACE = 'deep.space.network',
        DSN_COLLECTION_TYPE = 'dsn.collection',
        DSN_TELEMETRY_SOURCE = 'https://eyes.nasa.gov/dsn/data/dsn.xml',
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

    function getDsnData(domainObject) {
        // Add the same query string parameter the DSN site sends with each request
        var url = '/proxyUrl?url=' + encodeURIComponent(DSN_TELEMETRY_SOURCE + '?r=' + Math.floor(new Date().getTime() / 5000));

        return http.get(url)
            .then(function (resp) {
                var dsn,
                    parser = new DsnParser();

                dsn = parser.parseXml(resp.request.responseXML);
                return dsn[domainObject.identifier.key];
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

    var realTimeProvider = {
        supportsSubscribe: function (domainObject) {
            return domainObject.type === DSN_TELEMETRY_TYPE;
        },
        subscribe: function (domainObject, callback, options) {
            // Keep track of the domain objects subscribed
            if (!listeners[domainObject.identifier.key]) {
                listeners[domainObject.identifier.key] = [];
            }

            listeners[domainObject.identifier.key].push(callback);

            // DSN data is updated every 5 seconds
            var interval = setInterval(function () {
                getDsnData(domainObject).then(function (datum) {
                    // Invoke the callback with the updated datum
                    callback(datum);
                });
            }, 5000);

            return function () {
                // Stop polling the DSN site
                clearInterval(interval);

                // Unsubscribe domain object
                listeners[domainObject.identifier.key] =
                        listeners[domainObject.identifier.key].filter(function (c) {
                    return c !== callback;
                });
            };
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
                openmct.telemetry.addProvider(realTimeProvider);
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


define([
    'text!./res/dsn-dictionary.json',
    './DsnUtils',
    './DsnParser'
], function (
    baseDictionary,
    DsnUtils,
    DsnParser
) {
    'use strict';

    var compositionProvider,
        config,
        dictionary,
        listeners = {},
        objectProvider,
        realTimeProvider;

    var DSN_CONFIG_SOURCE = 'https://eyes.nasa.gov/dsn/config.xml',
        DSN_KEY = 'dsn',
        DSN_NAMESPACE = 'deep.space.network',
        DSN_TELEMETRY_SOURCE = 'https://eyes.nasa.gov/dsn/data/dsn.xml',
        DSN_TELEMETRY_TYPE = 'dsn.telemetry';

    function getDsnConfiguration() {
        var url = '/proxyUrl?url=' + encodeURIComponent(DSN_CONFIG_SOURCE);

        return http.get(url)
            .then(function (resp) {
                var dsn,
                    parser = new DsnParser();

                dsn = parser.parseXml(resp.request.responseXML);
                config = dsn.data;
            });
    }

    function getDsnData(domainObject) {
        // Add the same query string parameter the DSN site sends with each request
        var url = '/proxyUrl?url=' + encodeURIComponent(DSN_TELEMETRY_SOURCE + '?r=' + Math.floor(new Date().getTime() / 5000));

        return http.get(url)
            .then(function (resp) {
                var dsn,
                    parser = new DsnParser(config);

                dsn = parser.parseXml(resp.request.responseXML);
                return dsn.data.hasOwnProperty(domainObject.identifier.key)
                    ? dsn.data[domainObject.identifier.key]
                    : '';
            });
    }

    objectProvider = {
        get: function (identifier) {
            if (identifier.key === 'dsn') {
                return Promise.resolve({
                    identifier: {
                        namespace: 'deep.space.network',
                        key: 'dsn'
                    },
                    type: 'folder',
                    location: 'ROOT',
                    name: 'Deep Space Network',
                    composition: []
                });
            } else {
                return Promise.resolve(
                    dictionary.domainObjects[DsnUtils.serializeIdentifier(identifier)]
                );
            }
        }
    };

    compositionProvider = {
        appliesTo: function (domainObject) {
            return domainObject.identifier.namespace === DSN_NAMESPACE
                    && domainObject.composition !== undefined;
        },
        load: function (domainObject) {
            if (domainObject.identifier.key === DSN_KEY) {
                return Promise.resolve(Object.keys(dictionary.domainObjects).filter(function (key) {
                    return dictionary.domainObjects[key].location === DSN_NAMESPACE + ':' + DSN_KEY;
                }).map(function (key) {
                    var childId = DsnUtils.deserializeIdentifier(key);
                    return {
                        namespace: childId.namespace,
                        key: childId.key
                    };
                }));
            } else {
                return Promise.resolve(
                    dictionary.domainObjects[DsnUtils.serializeIdentifier(domainObject.identifier)].composition.map(function (key) {
                        var childId = DsnUtils.deserializeIdentifier(key);
                        return {
                            namespace: childId.namespace,
                            key: childId.key
                        };
                    })
                );
            }
        }
    };

    realTimeProvider = {
        supportsSubscribe: function (domainObject) {
            return domainObject.type === DSN_TELEMETRY_TYPE || domainObject.type === 'table';
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
                    if (Array.isArray(datum)) {
                        datum.forEach(function (value) {
                            callback(value);
                        });
                    } else {
                        callback(datum);
                    }
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

            // Antenna formatters
            openmct.telemetry.addFormat({
                key: 'angle-to-string',
                format: function (angle) {
                    // Assumes angle is in degrees
                    return typeof angle === 'number'
                        ? angle.toFixed(2) + ' deg'
                        : angle;
                },
                parse: function (angle) {
                    return typeof angle === 'string'
                        ? parseFloat(angle.slice(0, -4))
                        : angle;
                },
                validate: function (angle) {
                    return !isNaN(parseFloat(angle.slice(0, -4)));
                }
            });

            openmct.telemetry.addFormat({
                key: 'wind-speed-to-string',
                format: function (windSpeed) {
                    // Assumes wind speed is in km/hr
                    return typeof windSpeed === 'number'
                        ? windSpeed.toFixed(2) + ' km/hr'
                        : windSpeed;
                },
                parse: function (windSpeed) {
                    return typeof windSpeed === 'string'
                        ? parseFloat(windSpeed.slice(0, -6))
                        : windSpeed;
                },
                validate: function (windSpeed) {
                    return !isNaN(parseFloat(windSpeed.slice(0, -6)));
                }
            });

            dictionary = JSON.parse(baseDictionary);

            getDsnConfiguration();

            openmct.objects.addProvider(DSN_NAMESPACE, objectProvider);
            openmct.composition.addProvider(compositionProvider);
            openmct.telemetry.addProvider(realTimeProvider);

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

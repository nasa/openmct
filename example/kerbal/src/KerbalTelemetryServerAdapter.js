/*global define,WebSocket*/

define(
    [],
    function () {
        "use strict";

        function KerbalTelemetryServerAdapter($q, $http, $interval, apiUrl) {
            var listeners = [],
                histories = {},
                params = [],
                dictionary = $q.defer();

            function pollApi () {
                $http({
                    method: 'GET',
                    url: apiUrl,
                    params: params.reduce(function(result, param) {
                        result[param] = param;
                        return result;
                    }, {})
                }).then(function(message) {
                    for (var id in message.data) {
                        // Store telemetry data in the history
                        histories[id] = histories[id] || {
                                id: id,
                                type: 'history',
                                value: []
                            };

                        histories[id]['value'].push({
                            timestamp: message.data['t.universalTime']*1000,
                            value: message.data[id]
                        });

                        // Push telemetry data to listeners
                        listeners.forEach(function (listener) {
                            listener({
                                id: id,
                                value: {
                                    timestamp: message.data['t.universalTime']*1000,
                                    value: message.data[id]
                                }
                            });
                        });
                    }
                });
            }

            // Retrieve dictionary
            $http({
                method: 'GET',
                url: '/example/kerbal/res/dictionary.json'
            }).then(function(result) {
                dictionary.resolve(result.data);

                // Retrieve API parameters from the dictionary
                for (var s in result.data.subsystems) {
                    for (var m in result.data.subsystems[s]['measurements']) {
                        params.push(result.data.subsystems[s]['measurements'][m]['identifier']);
                    }
                }

                $interval(pollApi, 1000);
            });

            return {
                dictionary: function () {
                    return dictionary.promise;
                },
                history: function (id) {
                    var defer = $q.defer();
                    defer.resolve(histories[id] || {});
                    return defer.promise;
                },
                subscribe: function (id) {
                    params[id] = id;
                },
                unsubscribe: function (id) {
                    delete params[id];
                },
                listen: function (callback) {
                    listeners.push(callback);
                }
            };
        }

        return KerbalTelemetryServerAdapter;
    }
);
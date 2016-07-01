define(
    [],
    function () {
        "use strict";

        function ExampleTelemetryServerAdapter($q, wsUrl) {
            var ws = new WebSocket(wsUrl),
                histories = {},
                listeners = [],
                dictionary = $q.defer();

            // Handle an incoming message from the server
            ws.onmessage = function (event) {
                var message = JSON.parse(event.data);

                switch (message.type) {
                case "dictionary":
                    dictionary.resolve(message.value);
                    break;
                case "history":
                    histories[message.id].resolve(message);
                    delete histories[message.id];
                    break;
                case "data":
                    listeners.forEach(function (listener) {
                        listener(message);
                    });
                    break;
                }
            };

            // Request dictionary once connection is established
            ws.onopen = function () {
                ws.send("dictionary");
            };

            return {
                dictionary: function () {
                    return dictionary.promise;
                },
                history: function (id) {
                    histories[id] = histories[id] || $q.defer();
                    ws.send("history " + id);
                    return histories[id].promise;
                },
                subscribe: function (id) {
                    ws.send("subscribe " + id);
                },
                unsubscribe: function (id) {
                    ws.send("unsubscribe " + id);
                },
                listen: function (callback) {
                    listeners.push(callback);
                }
            };
        }

        return ExampleTelemetryServerAdapter;
    }
);

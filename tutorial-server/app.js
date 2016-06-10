/*global require,process,console*/

var CONFIG = {
    port: 8081,
    dictionary: "dictionary.json",
    interval: 1000
};

(function () {
    "use strict";

    var WebSocketServer = require('ws').Server,
        fs = require('fs'),
        wss = new WebSocketServer({ port: CONFIG.port }),
        dictionary = JSON.parse(fs.readFileSync(CONFIG.dictionary, "utf8")),
        spacecraft = {
            "prop.fuel": 77,
            "prop.thrusters": "OFF",
            "comms.recd": 0,
            "comms.sent": 0,
            "pwr.temp": 245,
            "pwr.c": 8.15,
            "pwr.v": 30
        },
        histories = {},
        listeners = [];

    function updateSpacecraft() {
        spacecraft["prop.fuel"] = Math.max(
            0,
            spacecraft["prop.fuel"] -
            (spacecraft["prop.thrusters"] === "ON" ? 0.5 : 0)
        );
        spacecraft["pwr.temp"] = spacecraft["pwr.temp"] * 0.985
        + Math.random() * 0.25 + Math.sin(Date.now());
        spacecraft["pwr.c"] = spacecraft["pwr.c"] * 0.985;
        spacecraft["pwr.v"] = 30 + Math.pow(Math.random(), 3);
    }

    function generateTelemetry() {
        var timestamp = Date.now(), sent = 0;
        Object.keys(spacecraft).forEach(function (id) {
            var state = { timestamp: timestamp, value: spacecraft[id] };
            histories[id] = histories[id] || []; // Initialize
            histories[id].push(state);
            spacecraft["comms.sent"] += JSON.stringify(state).length;
        });
        listeners.forEach(function (listener) {
            listener();
        });
    }

    function update() {
        updateSpacecraft();
        generateTelemetry();
    }

    function handleConnection(ws) {
        var subscriptions = {}, // Active subscriptions for this connection
            handlers = {        // Handlers for specific requests
                dictionary: function () {
                    ws.send(JSON.stringify({
                        type: "dictionary",
                        value: dictionary
                    }));
                },
                subscribe: function (id) {
                    subscriptions[id] = true;
                },
                unsubscribe: function (id) {
                    delete subscriptions[id];
                },
                history: function (id) {
                    ws.send(JSON.stringify({
                        type: "history",
                        id: id,
                        value: histories[id]
                    }));
                }
            };

        function notifySubscribers() {
            Object.keys(subscriptions).forEach(function (id) {
                var history = histories[id];
                if (history) {
                    ws.send(JSON.stringify({
                        type: "data",
                        id: id,
                        value: history[history.length - 1]
                    }));
                }
            });
        }

        // Listen for requests
        ws.on('message', function (message) {
            var parts = message.split(' '),
                handler = handlers[parts[0]];
            if (handler) {
                handler.apply(handlers, parts.slice(1));
            }
        });

        // Stop sending telemetry updates for this connection when closed
        ws.on('close', function () {
            listeners = listeners.filter(function (listener) {
                return listener !== notifySubscribers;
            });
        });

        // Notify subscribers when telemetry is updated
        listeners.push(notifySubscribers);
    }

    update();
    setInterval(update, CONFIG.interval);

    wss.on('connection', handleConnection);

    console.log("Example spacecraft running on port ");
    console.log("Press Enter to toggle thruster state.");
    process.stdin.on('data', function (data) {
        spacecraft['prop.thrusters'] =
            (spacecraft['prop.thrusters'] === "OFF") ? "ON" : "OFF";
        console.log("Thrusters " + spacecraft["prop.thrusters"]);
    });
}());

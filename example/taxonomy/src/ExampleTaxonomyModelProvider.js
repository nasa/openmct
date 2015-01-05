/*global define*/

define(
    [],
    function () {
        "use strict";

        function ExampleTaxonomyModelProvider($q) {
            var models = {},
                packetId,
                telemetryId,
                i,
                j;

            // Add some "subsystems"
            for (i = 0; i < 3; i += 1) {
                packetId = "examplePacket" + i;

                models[packetId] = {
                    name: "Stub Subsystem " + (i + 1),
                    type: "telemetry.panel",
                    composition: []
                };

                // Add some "telemetry points"
                for (j = 0; j < 100 * (i + 1); j += 1) {
                    telemetryId = "exampleTelemetry" + j;
                    models[telemetryId] = {
                        name: "SWG" + i + "." + j,
                        type: "generator",
                        telemetry: {
                            period: 10 + i + j
                        }
                    };
                    models[packetId].composition.push(telemetryId);
                }
            }

            return {
                getModels: function () {
                    return $q.when(models);
                }
            };
        }

        return ExampleTaxonomyModelProvider;
    }
);
/*global define*/

define(
    function () {
        "use strict";

        var PREFIX = "kerbal_tlm:",
            FORMAT_MAPPINGS = {
                float: "number",
                integer: "number",
                string: "string",
                boolean: "string"
            };

        function KerbalTelemetryModelProvider(adapter, $q) {
            var modelPromise, empty = $q.when({});

            // Check if this model is in our dictionary (by prefix)
            function isRelevant(id) {
                return id.indexOf(PREFIX) === 0;
            }

            // Build a domain object identifier by adding a prefix
            function makeId(element) {
                return PREFIX + element.identifier;
            }

            // Create domain object models from this dictionary
            function buildTaxonomy(dictionary) {
                var models = {};

                // Create & store a domain object model for a measurement
                function addMeasurement(measurement) {
                    var format = FORMAT_MAPPINGS[measurement.type];
                    models[makeId(measurement)] = {
                        type: "kerbal.measurement",
                        name: measurement.name,
                        telemetry: {
                            key: measurement.identifier,
                            ranges: [{
                                key: "value",
                                name: "Value",
                                units: measurement.units,
                                format: format
                            }]
                        }
                    };
                }

                // Create & store a domain object model for a subsystem
                function addSubsystem(subsystem) {
                    var measurements =
                        (subsystem.measurements || []);
                    models[makeId(subsystem)] = {
                        type: "kerbal.subsystem",
                        name: subsystem.name,
                        composition: measurements.map(makeId)
                    };
                    measurements.forEach(addMeasurement);
                }

                (dictionary.subsystems || []).forEach(addSubsystem);

                return models;
            }

            // Begin generating models once the dictionary is available
            modelPromise = adapter.dictionary().then(buildTaxonomy);

            return {
                getModels: function (ids) {
                    // Return models for the dictionary only when they
                    // are relevant to the request.
                    return ids.some(isRelevant) ? modelPromise : empty;
                }
            };
        }

        return KerbalTelemetryModelProvider;
    }
);
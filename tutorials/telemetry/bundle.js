define([
    'legacyRegistry',
    './src/ExampleTelemetryServerAdapter',
    './src/ExampleTelemetryInitializer',
    './src/ExampleTelemetryModelProvider'
], function (
    legacyRegistry,
    ExampleTelemetryServerAdapter,
    ExampleTelemetryInitializer,
    ExampleTelemetryModelProvider
) {
    legacyRegistry.register("tutorials/telemetry", {
        "name": "Example Telemetry Adapter",
        "extensions": {
            "types": [
                {
                    "name": "Spacecraft",
                    "key": "example.spacecraft",
                    "glyph": "o"
                },
                {
                    "name": "Subsystem",
                    "key": "example.subsystem",
                    "glyph": "o",
                    "model": { "composition": [] }
                },
                {
                    "name": "Measurement",
                    "key": "example.measurement",
                    "glyph": "T",
                    "model": { "telemetry": {} },
                    "telemetry": {
                        "source": "example.source",
                        "domains": [
                            {
                                "name": "Time",
                                "key": "timestamp"
                            }
                        ]
                    }
                }
            ],
            "roots": [
                {
                    "id": "example:sc",
                    "priority": "preferred",
                    "model": {
                        "type": "example.spacecraft",
                        "name": "My Spacecraft",
                        "composition": []
                    }
                }
            ],
            "services": [
                {
                    "key": "example.adapter",
                    "implementation": "ExampleTelemetryServerAdapter.js",
                    "depends": [ "$q", "EXAMPLE_WS_URL" ]
                }
            ],
            "constants": [
                {
                    "key": "EXAMPLE_WS_URL",
                    "priority": "fallback",
                    "value": "ws://localhost:8081"
                }
            ],
            "runs": [
                {
                    "implementation": "ExampleTelemetryInitializer.js",
                    "depends": [ "example.adapter", "objectService" ]
                }
            ],
            "components": [
                {
                    "provides": "modelService",
                    "type": "provider",
                    "implementation": "ExampleTelemetryModelProvider.js",
                    "depends": [ "example.adapter", "$q" ]
                },
                {
                    "provides": "telemetryService",
                    "type": "provider",
                    "implementation": "ExampleTelemetryProvider.js",
                    "depends": [ "example.adapter", "$q" ]
                }
            ]
        }
    });
});

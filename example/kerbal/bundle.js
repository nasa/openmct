define([
    'legacyRegistry'
], function (legacyRegistry) {
    legacyRegistry.register("example/kerbal", {
        "name": "Kerbal Telemetry Adapter",
        "extensions": {
            "types": [
                {
                    "name": "Spacecraft",
                    "key": "kerbal.spacecraft",
                    "glyph": "o"
                },
                {
                    "name": "Subsystem",
                    "key": "kerbal.subsystem",
                    "glyph": "o",
                    "model": {"composition": []}
                },
                {
                    "name": "Measurement",
                    "key": "kerbal.measurement",
                    "glyph": "T",
                    "model": {"telemetry": {}},
                    "telemetry": {
                        "source": "kerbal.source",
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
                    "id": "kerbal:sc",
                    "priority": "preferred",
                    "model": {
                        "type": "kerbal.spacecraft",
                        "name": "My Spacecraft",
                        "composition": []
                    }
                }
            ],
            "services": [
                {
                    "key": "kerbal.adapter",
                    "implementation": "KerbalTelemetryServerAdapter.js",
                    "depends": ["$q", "$http", "$interval", "KERBAL_HTTP_API_URL"]
                }
            ],
            "constants": [
                {
                    "key": "KERBAL_HTTP_API_URL",
                    "priority": "fallback",
                    "value": "http://localhost:8085/telemachus/datalink"
                }
            ],
            "runs": [
                {
                    "implementation": "KerbalTelemetryInitializer.js",
                    "depends": ["kerbal.adapter", "objectService"]
                }
            ],
            "components": [
                {
                    "provides": "modelService",
                    "type": "provider",
                    "implementation": "KerbalTelemetryModelProvider.js",
                    "depends": ["kerbal.adapter", "$q"]
                },
                {
                    "provides": "telemetryService",
                    "type": "provider",
                    "implementation": "KerbalTelemetryProvider.js",
                    "depends": ["kerbal.adapter", "$q"]
                }
            ]
        }
    });
});
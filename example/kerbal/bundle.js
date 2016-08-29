define([
    "../../../platform/commonUI/formats/src/FormatProvider",
    "./src/KerbalTimeFormat",
    './src/KerbalTelemetryServerAdapter.js',
    './src/KerbalTelemetryInitializer.js',
    './src/KerbalTelemetryModelProvider.js',
    './src/KerbalTelemetryProvider.js',
    'legacyRegistry'
], function (
    FormatProvider,
    KerbalTimeFormat,
    KerbalTelemetryServerAdapter,
    KerbalTelemetryInitializer,
    KerbalTelemetryModelProvider,
    KerbalTelemetryProvider,
    legacyRegistry) {
    legacyRegistry.register("example/kerbal", {
        "name": "Kerbal Telemetry Adapter",
        "extensions": {
            "types": [
                {
                    "name": "Kerbal Spacecraft",
                    "key": "kerbal.spacecraft",
                    "cssclass": "icon-object"
                },
                {
                    "name": "Subsystem",
                    "key": "kerbal.subsystem",
                    "cssclass": "icon-object",
                    "model": {"composition": []}
                },
                {
                    "name": "Measurement",
                    "key": "kerbal.measurement",
                    "cssclass": "icon-telemetry-panel",
                    "model": {"telemetry": {}},
                    "telemetry": {
                        "source": "kerbal.source",
                        "domains": [
                            {
                                "name": "Kerbal Time",
                                "key": "timestamp",
                                "format": "kerbal"
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
                        "name": "Kerbal Spacecraft",
                        "composition": []
                    }
                }
            ],
            "services": [
                {
                    "key": "kerbal.adapter",
                    "implementation": KerbalTelemetryServerAdapter,
                    "depends": ["$q", "$http", "$interval", "KERBAL_HTTP_API_URL"]
                }
            ],
            "constants": [
                {
                    "key": "KERBAL_HTTP_API_URL",
                    "priority": "fallback",
                    "value": "/proxyUrl?url=http://localhost:8085/telemachus/datalink"
                },
                {
                    "key": "DEFAULT_TIME_FORMAT",
                    "value": "kerbal"
                }
            ],
            "runs": [
                {
                    "implementation": KerbalTelemetryInitializer,
                    "depends": ["kerbal.adapter", "objectService"]
                }
            ],
            "components": [
                {
                    "provides": "modelService",
                    "type": "provider",
                    "implementation": KerbalTelemetryModelProvider,
                    "depends": ["kerbal.adapter", "$q"]
                },
                {
                    "provides": "telemetryService",
                    "type": "provider",
                    "implementation": KerbalTelemetryProvider,
                    "depends": ["kerbal.adapter", "$q"]
                },
                {
                    "provides": "formatService",
                    "type": "provider",
                    "implementation": FormatProvider,
                    "depends": [
                        "formats[]"
                    ]
                }
            ],
            "formats": [
                {
                    "key": "kerbal",
                    "implementation": KerbalTimeFormat
                }
            ]
        }
    });
});
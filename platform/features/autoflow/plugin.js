define([
    'text!./res/templates/autoflow-tabular.html',
    './src/AutoflowTabularController',
    './src/MCTAutoflowTable'
], function (
    autoflowTabularTemplate,
    AutoflowTabularController,
    MCTAutoflowTable
) {
    return function (options) {
        return function (openmct) {
            openmct.legacyRegistry.register("platform/features/autoflow", {
                "name": "WARP Telemetry Adapter",
                "description": "Retrieves telemetry from the WARP Server and provides related types and views.",
                "resources": "res",
                "extensions": {
                    "views": [
                        {
                            "key": "autoflow",
                            "name": "Autoflow Tabular",
                            "cssClass": "icon-packet",
                            "description": "A tabular view of packet contents.",
                            "template": autoflowTabularTemplate,
                            "type": options && options.type,
                            "needs": [
                                "telemetry"
                            ],
                            "delegation": true
                        }
                    ],
                    "controllers": [
                        {
                            "key": "AutoflowTabularController",
                            "implementation": AutoflowTabularController,
                            "depends": [
                                "$scope",
                                "$timeout",
                                "telemetrySubscriber"
                            ]
                        }
                    ],
                    "directives": [
                        {
                            "key": "mctAutoflowTable",
                            "implementation": MCTAutoflowTable
                        }
                    ]
                }
            });
            openmct.legacyRegistry.enable("platform/features/autoflow");
        };
    };
});


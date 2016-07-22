define([
    'legacyRegistry',
    './src/controllers/BarGraphController'
], function (
    legacyRegistry,
    BarGraphController
    ) {
    legacyRegistry.register("tutorials/bargraph", {
        "name": "Bar Graph",
        "description": "Provides the Bar Graph view of telemetry elements.",
        "extensions": {
            "views": [
                {
                    "name": "Bar Graph",
                    "key": "example.bargraph",
                    "glyph": "H",
                    "templateUrl": "templates/bargraph.html",
                    "needs": [ "telemetry" ],
                    "delegation": true,
                    "editable": true,
                    "toolbar": {
                        "sections": [
                            {
                                "items": [
                                    {
                                        "name": "Low",
                                        "property": "low",
                                        "required": true,
                                        "control": "textfield",
                                        "size": 4
                                    },
                                    {
                                        "name": "Middle",
                                        "property": "middle",
                                        "required": true,
                                        "control": "textfield",
                                        "size": 4
                                    },
                                    {
                                        "name": "High",
                                        "property": "high",
                                        "required": true,
                                        "control": "textfield",
                                        "size": 4
                                    }
                                ]
                            }
                        ]
                    }
                }
            ],
            "stylesheets": [
                {
                    "stylesheetUrl": "css/bargraph.css"
                }
            ],
            "controllers": [
                {
                    "key": "BarGraphController",
                    "implementation": BarGraphController,
                    "depends": [ "$scope", "telemetryHandler" ]
                }
            ]
        }
    });
});

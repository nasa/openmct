define(['./src/actions/activityModesImportAction'], function(ActivityModes) {
    function plugin() {

        return function install(openmct) {

            openmct.legacyRegistry.register("src/plugins/activityModes", {
                "name": "Activity Modes",
                "description": "Defines a root named My Items",
                "extensions": {
                    "roots": [
                        {
                            "id": "activity-modes"
                        }
                    ],
                    "models": [
                        {
                            "id": "activity-modes",
                            "model": {
                                "name": "Activity Modes",
                                "type": "folder",
                                "composition": [],
                                "location": "ROOT"
                            }
                        }
                    ]
                }
            });

            openmct.legacyRegistry.enable("src/plugins/activityModes");

            openmct.legacyExtension('actions', {
                key: "import-csv",
                category: ["contextual"],
                implementation: ActivityModes,
                cssClass: "major icon-import",
                name: "Import from CSV",
                description: "Import activities from a CSV file",
                depends: [
                    "dialogService",
                    "openmct"
                ]
            });
        };
    }
    
    return plugin;
});

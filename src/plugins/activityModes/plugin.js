define(['./src/actions/activityModesImportAction'], function(ActivityModes) {
    function plugin() {
        function initProvider(openmct) {
            return {
                get: function (identifier) {
                    return Promise.resolve().then(function () {
                        if (identifier.key === 'activity-modes') {
                            return {
                                identifier: identifier,
                                name: 'Activity-Modes',
                                type: 'folder',
                                location: 'ROOT'
                            };
                        }
                    });
                } 
            };
        }
        
        return function install(openmct) {
            openmct.objects.addRoot({
                namespace: 'Activity Modes',
                key: 'activity-modes'
            });
            openmct.objects.addProvider('Activity Modes', initProvider());
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
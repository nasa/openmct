define([
    './src/actions/activityModesImportAction',
    './src/policies/ActionPolicy'
],
function (ActivityModes, ActionPolicy) {
    function plugin() {

        return function install(openmct) {

            openmct.legacyExtension('actions', {
                key: "import-csv",
                category: ["contextual"],
                implementation: ActivityModes,
                cssClass: "major icon-import",
                name: "Import Activity Definitions from CSV",
                description: "Import activities from a CSV file",
                depends: [
                    "dialogService",
                    "openmct"
                ]
            });

            openmct.legacyExtension('policies', {
                category: 'action',
                implementation: ActionPolicy
            });
        };
    }

    return plugin;
});

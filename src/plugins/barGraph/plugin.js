define([
    "vue",
    "./src/BarGraphController",
    "./src/BarGraphCompositionPolicy"
], function (
    Vue,
    BarGraphController,
    CompositionPolicy
) {
    var installed = false;

    function BarGraphPlugin() {
        return function install(openmct) {
            if (installed) {
                return;
            }

            installed = true;

           openmct.legacyRegistry.register('example/bargraph', {
            name: 'Example Telemetry view using Vue',
            extensions: {
                types: [
                    {
                        key: "example/bargraph",
                        name: "Example Bargraph",
                        cssClass: "icon-autoflow-tabular",
                        description: "combine multiple telemetry producing objects in bargraph form",
                        features: "creation",
                        contains: [
                            {
                                has: "telemetry"
                            }
                        ],
                        model: {
                            composition: []
                        }
                    }
                ]
            }
           });

           openmct.legacyRegistry.enable('example/bargraph');

            openmct.objectViews.addProvider({
                key: 'bargraph-view',
                name: 'Bar Graph View',
                cssClass: 'icon-autoflow-tabular',
                needs: ['telemetry'],
                editable: true,
                canView: function (domainObject) {
                    return domainObject.type === "example/bargraph";
                },
                view: function (domainObject) {
                    var controller = new BarGraphController(openmct, domainObject);

                    return {
                        show: controller.show,
                        destroy: controller.destroy
                    };
                }
            });
            
            openmct.legacyExtension('policies', {
                category: 'composition',
                implementation: CompositionPolicy,
                depends: ['openmct']
            });
        };
    }

    return BarGraphPlugin;
});
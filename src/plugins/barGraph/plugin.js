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

           openmct.legacyRegistry.register('example/worldwind', {
            name: 'Example WorldWind View for OpenMCT',
            extensions: {
                types: [
                    {
                        key: "example/worldwind",
                        name: "Example WorldWind",
                        cssClass: "icon-session",
                        description: "example plugin",
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

           openmct.legacyRegistry.enable('example/worldwind');

            openmct.objectViews.addProvider({
                key: 'bargraph-view',
                name: 'Bar Graph View',
                cssClass: 'icon-autoflow-tabular',
                needs: ['telemetry'],
                editable: true,
                canView: function (domainObject) {
                    return domainObject.type === "example/worldwind";
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
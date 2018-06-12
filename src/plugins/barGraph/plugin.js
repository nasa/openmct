define([
    "vue",
    "./src/BarGraphController"
], function (
    Vue,
    BarGraphController,
) {
    var installed = false;

    function BarGraphPlugin() {
        return function install(openmct) {
            if (installed) {
                return;
            }

            installed = true;

            openmct.objectViews.addProvider({
                key: 'bar-graph-view',
                name: 'Bar Graph View',
                cssClass: 'icon-autoflow-tabular',
                needs: ['telemetry'],
                canView: function (domainObject) {
                    return domainObject.telemetry;
                },
                view: function (domainObject) {
                    var controller = new BarGraphController(openmct, domainObject);

                    return {
                        show: controller.show,
                        destroy: controller.destroy
                    }
                }
            });
        }
    }

    return BarGraphPlugin;
});
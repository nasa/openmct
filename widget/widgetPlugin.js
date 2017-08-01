define(
    [
      './src/WidgetView'
    ],
    function (
      WidgetView
    ) {

    function widgetPlugin() {
        var self = this;

        this.plugin = function () {
            return function install (openmct) {
                self.openmct = openmct;
                openmct.types.addType('widget', self.widgetType);
                openmct.objectViews.addProvider(self.viewProvider);
            }
        }

        this.viewProvider = {
            name: 'Widget View',
            view: function (domainObject) {
                var wv = new WidgetView(domainObject, self.openmct);
                return {
                    show: wv.show,
                    destroy: wv.destroy
                }
            },
            canView: function (domainObject) {
                return (domainObject.type === 'widget');
            }
        }

        this.widgetType = {
            name: 'Summary Widget',
            description: 'A compact status update for collections of telemetry-producing items',
            creatable: true,
            cssClass: 'icon-summary-widget',
            initialize: function (domainObject) {
                domainObject.composition = [];
                domainObject.configuration = {};
            }
        }
    }

    return widgetPlugin;
});

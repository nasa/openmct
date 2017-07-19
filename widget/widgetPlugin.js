define(
    [
      './WidgetView',
      './RuleEvaluator'
    ],
    function (
      WidgetView,
      RuleEvaluator
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
                var eval = new RuleEvaluator();
                var wv = new WidgetView(domainObject, self.openmct, eval);
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
            description: 'A compact status display for collections of telemetry-producing items',
            cssClass: 'icon-summary-widget',
            creatable: true,
            initialize: function (domainObject) {
                domainObject.composition = [];
                domainObject.configuration = {};
            }
        }
    }

    return widgetPlugin;
});

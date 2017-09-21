define(['./src/SummaryWidget', './SummaryWidgetsCompositionPolicy'], function (SummaryWidget, SummaryWidgetsCompositionPolicy) {

    function plugin() {

        var widgetType = {
            name: 'Summary Widget',
            description: 'A compact status update for collections of telemetry-producing items',
            creatable: true,
            cssClass: 'icon-summary-widget',
            initialize: function (domainObject) {
                domainObject.composition = [];
                domainObject.configuration = {};
            }
        };

        function initViewProvider(openmct) {
            return {
                name: 'Widget View',
                view: function (domainObject) {
                    var summaryWidget = new SummaryWidget(domainObject, openmct);
                    return {
                        show: summaryWidget.show,
                        destroy: summaryWidget.destroy
                    };
                },
                canView: function (domainObject) {
                    return (domainObject.type === 'summary-widget');
                },
                editable: true
            };
        }

        return function install(openmct) {
            openmct.types.addType('summary-widget', widgetType);
            openmct.objectViews.addProvider(initViewProvider(openmct));
            openmct.legacyExtension('policies', {category: 'composition',
                implementation: SummaryWidgetsCompositionPolicy, depends: ['openmct']});
        };
    }

    return plugin;
});

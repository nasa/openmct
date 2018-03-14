define([
    './SummaryWidgetsCompositionPolicy',
    './src/telemetry/SummaryWidgetMetadataProvider',
    './src/telemetry/SummaryWidgetTelemetryProvider',
    './src/views/SummaryWidgetViewProvider'
], function (
    SummaryWidgetsCompositionPolicy,
    SummaryWidgetMetadataProvider,
    SummaryWidgetTelemetryProvider,
    SummaryWidgetViewProvider
) {

    function plugin() {

        var widgetType = {
            name: 'Summary Widget',
            description: 'A compact status update for collections of telemetry-producing items',
            creatable: true,
            cssClass: 'icon-summary-widget',
            initialize: function (domainObject) {
                domainObject.composition = [];
                domainObject.configuration = {};
                domainObject.openNewTab = 'thisTab';
            },
            form: [
                {
                    "key": "url",
                    "name": "URL",
                    "control": "textfield",
                    "pattern": "^(ftp|https?)\\:\\/\\/",
                    "required": false,
                    "cssClass": "l-input-lg"
                },
                {
                    "key": "openNewTab",
                    "name": "Tab to Open Hyperlink",
                    "control": "select",
                    "options": [
                            {
                                "value": "thisTab",
                                "name": "Open in this tab"
                            },
                            {
                                "value": "newTab",
                                "name": "Open in a new tab"
                            }
                        ],
                    "cssClass": "l-inline"
                }
            ]
        };

        return function install(openmct) {
            openmct.types.addType('summary-widget', widgetType);
            openmct.legacyExtension('policies', {category: 'composition',
                implementation: SummaryWidgetsCompositionPolicy, depends: ['openmct']
            });
            openmct.telemetry.addMetadataProvider(new SummaryWidgetMetadataProvider(openmct));
            openmct.telemetry.addProvider(new SummaryWidgetTelemetryProvider(openmct));
            openmct.objectViews.addProvider(new SummaryWidgetViewProvider(openmct));
        };
    }

    return plugin;
});

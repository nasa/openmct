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

        function initViewProvider(openmct) {
            return {
                name: 'Widget View',
                view: function (domainObject) {
                    return new SummaryWidget(domainObject, openmct);
                },
                canView: function (domainObject) {
                    return (domainObject.type === 'summary-widget');
                },
                editable: true,
                key: 'summaryWidgets'
            };
        }

        return function install(openmct) {
            openmct.types.addType('summary-widget', widgetType);
            openmct.objectViews.addProvider(initViewProvider(openmct));
            openmct.legacyExtension('policies', {category: 'composition',
                implementation: SummaryWidgetsCompositionPolicy, depends: ['openmct']
            });
        };
    }

    return plugin;
});

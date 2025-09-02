import SummaryWidgetMetadataProvider from './src/telemetry/SummaryWidgetMetadataProvider.js';
import SummaryWidgetTelemetryProvider from './src/telemetry/SummaryWidgetTelemetryProvider.js';
import SummaryWidgetViewProvider from './src/views/SummaryWidgetViewProvider.js';
import SummaryWidgetsCompositionPolicy from './SummaryWidgetsCompositionPolicy.js';

export default function plugin() {
  const widgetType = {
    name: 'Summary Widget',
    description: 'A compact status update for collections of telemetry-producing items',
    cssClass: 'icon-summary-widget',
    initialize: function (domainObject) {
      domainObject.composition = [];
      domainObject.configuration = {
        ruleOrder: ['default'],
        ruleConfigById: {
          default: {
            name: 'Default',
            label: 'Unnamed Rule',
            message: '',
            id: 'default',
            icon: ' ',
            style: {
              color: '#ffffff',
              'background-color': '#38761d',
              'border-color': 'rgba(0,0,0,0)'
            },
            description: 'Default appearance for the widget',
            conditions: [
              {
                object: '',
                key: '',
                operation: '',
                values: []
              }
            ],
            jsCondition: '',
            trigger: 'any',
            expanded: 'true'
          }
        },
        testDataConfig: [
          {
            object: '',
            key: '',
            value: ''
          }
        ]
      };
      domainObject.openNewTab = 'thisTab';
      domainObject.telemetry = {};
    },
    form: [
      {
        key: 'url',
        name: 'URL',
        control: 'textfield',
        required: false,
        cssClass: 'l-input-lg'
      },
      {
        key: 'openNewTab',
        name: 'Tab to Open Hyperlink',
        control: 'select',
        options: [
          {
            value: 'thisTab',
            name: 'Open in this tab'
          },
          {
            value: 'newTab',
            name: 'Open in a new tab'
          }
        ],
        cssClass: 'l-inline'
      }
    ]
  };

  return function install(openmct) {
    openmct.types.addType('summary-widget', widgetType);
    let compositionPolicy = new SummaryWidgetsCompositionPolicy(openmct);
    openmct.composition.addPolicy(compositionPolicy.allow.bind(compositionPolicy));
    openmct.telemetry.addProvider(new SummaryWidgetMetadataProvider(openmct));
    openmct.telemetry.addProvider(new SummaryWidgetTelemetryProvider(openmct));
    openmct.objectViews.addProvider(new SummaryWidgetViewProvider(openmct));
  };
}

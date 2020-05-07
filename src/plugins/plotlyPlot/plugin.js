import PlotlyViewProvider from './PlotlyViewProvider.js';
import PlotlyTelemetryProvider from './PlotlyTelemetryProvider.js';

export default function () {
    return function install(openmct) {
        openmct.objectViews.addProvider(new PlotlyViewProvider(openmct));
        openmct.telemetry.addProvider(new PlotlyTelemetryProvider(openmct));

        openmct.types.addType('plotlyPlot', {
            name: "Plotly Plot",
            description: "Simple plot rendered by plotly.js",
            creatable: true,
            cssClass: 'icon-plot-overlay',
            initialize: function (domainObject) {
                domainObject.composition = [];
                domainObject.telemetry = {};
            }
        });
    };
}

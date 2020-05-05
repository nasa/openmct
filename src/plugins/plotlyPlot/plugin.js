// import PlotlyTelemetryProvider from './PlotlyTelemetryProvider.js';
import PlotlyPlotViewProvider from './PlotlyPlotViewProvider.js';

export default function plugin() {
    return function install(openmct) {
//        openmct.telemetry.addProvider(new PlotlyTelemetryProvider(openmct, config));
        openmct.objectViews.addProvider(new PlotlyPlotViewProvider(openmct));

        openmct.types.addType('plotlyPlot', {
            name: "Plotly Plot",
            description: "Simple plot rendered by plotly.js",
            creatable: true,
            cssClass: 'icon-plot-overlay',
            initialize(domainObject) {
                domainObject.composition = [];
            }
        });
    };
}

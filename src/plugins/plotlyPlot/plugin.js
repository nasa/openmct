import PlotlyViewProvider from './PlotlyViewProvider';

export default function plugin() {
    return function install(openmct) {
        openmct.objectViews.addProvider(new PlotlyViewProvider(openmct));

        openmct.types.addType('plotlyPlot', {
            name: "Plotly Plot",
            description: "Simple plot rendered by plotly.js",
            creatable: true,
            cssClass: 'icon-plot-overlay',
            initialize: function (domainObject) {
                domainObject.composition = [];
            }
        });
    };
}

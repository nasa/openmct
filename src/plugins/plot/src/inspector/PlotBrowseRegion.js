/*global define*/
define([
    './Region'
], function (
    Region
) {

    var PlotBrowseRegion = new Region({
        name: "plot-options",
        title: "Plot Options",
        modes: ['browse'],
        content: {
            key: "plot-options-browse"
        }
    });

    return PlotBrowseRegion;

});

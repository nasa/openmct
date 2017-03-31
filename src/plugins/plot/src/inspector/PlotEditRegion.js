/*global define*/
define([
    './Region'
], function (
    Region
) {

    var PlotEditRegion = new Region({
        name: "plot-options",
        title: "Plot Options",
        modes: ['edit'],
        content: {
            key: "plot-options-edit"
        }
    });

    return PlotEditRegion;
});

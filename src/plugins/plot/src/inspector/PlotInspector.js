/*global define*/
define([
    './InspectorRegion',
    './PlotBrowseRegion',
    './PlotEditRegion'
], function (
    InspectorRegion,
    PlotBrowseRegion,
    PlotEditRegion
) {

    var plotInspector = new InspectorRegion();

    plotInspector.addRegion(PlotBrowseRegion);
    plotInspector.addRegion(PlotEditRegion);

    return plotInspector;
});

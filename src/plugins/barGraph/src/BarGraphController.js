define([
    'vue',
    'text!../res/templates/barGraph.html',
    'worldwind'
], function (
    Vue,
    BarGraphView,
    WorldWind
) {
    function BarGraphController(openmct, domainObject) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.telemetryObjects = [];

        this.show = this.show.bind(this);
        this.destroy = this.destroy.bind(this);

        var barGraphVue = Vue.extend({
            template: BarGraphView,
            data: function () {
                return {
                };
            } 
        });

        this.barGraphVue = new barGraphVue();
    }

    BarGraphController.prototype.show = function (container) {
        this.barGraphVue.$mount(container);
        this.startWorldWind();
    };

    BarGraphController.prototype.startWorldWind = function () {
        // Create a WorldWindow for the canvas.
        var wwd = new WorldWind.WorldWindow("canvasOne");

        // Add some image layers to the WorldWindow's globe.
        wwd.addLayer(new WorldWind.BMNGOneImageLayer());
        wwd.addLayer(new WorldWind.BMNGLandsatLayer());

        // Add a compass, a coordinates display and some view controls to the WorldWindow.
        wwd.addLayer(new WorldWind.CompassLayer());
        wwd.addLayer(new WorldWind.CoordinatesDisplayLayer(wwd));
        wwd.addLayer(new WorldWind.ViewControlsLayer(wwd));  
    };

    BarGraphController.prototype.destroy = function (container) {
        this.barGraphVue.$destroy(true);
    };

    /*
    private
    */

    return BarGraphController;
});
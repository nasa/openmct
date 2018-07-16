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

        var layers = [
            // Imagery layers.
            {layer: new WorldWind.BMNGLayer(), enabled: true},
            {layer: new WorldWind.BMNGLandsatLayer(), enabled: false},
            {layer: new WorldWind.BingAerialLayer(null), enabled: false},
            {layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: true},
            {layer: new WorldWind.BingRoadsLayer(null), enabled: false},
            {layer: new WorldWind.OpenStreetMapImageLayer(null), enabled: false},
            // Add atmosphere layer on top of all base layers.
            {layer: new WorldWind.AtmosphereLayer(), enabled: true},
            // WorldWindow UI layers.
            {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true},
            {layer: new WorldWind.ViewControlsLayer(wwd), enabled: true}
        ];

        for (var l = 0; l < layers.length; l++) {
            layers[l].layer.enabled = layers[l].enabled;
            wwd.addLayer(layers[l].layer);
        }

         // Create renderable layer to hold the Collada model.
        var modelLayer = new WorldWind.RenderableLayer("Duck");
        wwd.addLayer(modelLayer);

        // Define a position for locating the model.
        var position = new WorldWind.Position(37.419682, -122.063738, 1000e3);
        // Create a Collada loader and direct it to the desired directory and .dae file.
        var colladaLoader = new WorldWind.ColladaLoader(position);
        colladaLoader.init({dirPath: '../../../collada_models/duck/'});
        colladaLoader.load('duck.dae', function (scene) {
            scene.scale = 1000;
            modelLayer.addRenderable(scene); // Add the Collada model to the renderable layer within a callback.
        });

        var long = 0;
        var lat = 0;

        function generateLongLat() {
            long += 0.25;
            lat += 0.25;

            return {long: long, lat: lat};
        }



        // Create the path's positions.
        var pathPositions = [];
        pathPositions.push(new WorldWind.Position(0, 0, 1000e3));


        // // Create the path.
        // var path = new WorldWind.Path(pathPositions, null);
        // path.altitudeMode = WorldWind.ABSOLUTE; // The path's altitude stays relative to the terrain's altitude.
        // path.followTerrain = true;
        // path.extrude = true; // Make it a curtain.
        // path.useSurfaceShapeFor2D = true; // Use a surface shape in 2D mode.

        // // Create and assign the path's attributes.
        // var pathAttributes = new WorldWind.ShapeAttributes(null);
        // pathAttributes.outlineColor = WorldWind.Color.YELLOW;
        // pathAttributes.interiorColor = new WorldWind.Color(0, 1, 1, 0.5);
        // pathAttributes.drawVerticals = path.extrude; //Draw verticals only when extruding.
        // path.attributes = pathAttributes;

        // // Create and assign the path's highlight attributes.
        // var highlightAttributes = new WorldWind.ShapeAttributes(pathAttributes);
        // highlightAttributes.outlineColor = WorldWind.Color.RED;
        // highlightAttributes.interiorColor = new WorldWind.Color(1, 1, 1, 0.5);
        // path.highlightAttributes = highlightAttributes;

        // // Add the path to a layer and the layer to the WorldWindow's layer list.
        // var pathsLayer = new WorldWind.RenderableLayer();
        // pathsLayer.displayName = "Paths";
        // pathsLayer.addRenderable(path);
        // wwd.addLayer(pathsLayer);

        window.setInterval(function () {
            var pos = generateLongLat();

            pathPositions.push(new WorldWind.Position(pos.long, (-1 * pos.lat), 1000e3));

            // Create the path.
            var path = new WorldWind.Path(pathPositions, null);
            path.altitudeMode = WorldWind.ABSOLUTE; // The path's altitude stays relative to the terrain's altitude.
            path.followTerrain = true;
            path.extrude = true; // Make it a curtain.
            path.useSurfaceShapeFor2D = true; // Use a surface shape in 2D mode.

            // Create and assign the path's attributes.
            var pathAttributes = new WorldWind.ShapeAttributes(null);
            pathAttributes.outlineColor = WorldWind.Color.GREEN;
            pathAttributes.interiorColor = new WorldWind.Color(192, 192, 192, 0.5);
            pathAttributes.drawVerticals = path.extrude; //Draw verticals only when extruding.
            path.attributes = pathAttributes;

            // Create and assign the path's highlight attributes.
            var highlightAttributes = new WorldWind.ShapeAttributes(pathAttributes);
            highlightAttributes.outlineColor = WorldWind.Color.RED;
            highlightAttributes.interiorColor = new WorldWind.Color(1, 1, 1, 0.5);
            path.highlightAttributes = highlightAttributes;

            // Add the path to a layer and the layer to the WorldWindow's layer list.
            var pathsLayer = new WorldWind.RenderableLayer();
            pathsLayer.displayName = "Paths";
            pathsLayer.addRenderable(path);
            wwd.addLayer(pathsLayer);
            
            wwd.redraw();
        }, 1000);

        // Now set up to handle highlighting.
        // var highlightController = new WorldWind.HighlightController(wwd);
    };

    BarGraphController.prototype.destroy = function (container) {
        this.barGraphVue.$destroy(true);
    };

    /*
    private
    */

    return BarGraphController;
});
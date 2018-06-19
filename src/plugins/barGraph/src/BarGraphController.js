define([
    'vue',
    'text!../res/templates/barGraph.html'
], function (
    Vue,
    BarGraphView
) {
    function BarGraphController(openmct, domainObject) {
        this.openmct = openmct;
        this.domainObject = domainObject;
        this.telemetryObjects = [];

        this.show = this.show.bind(this);
        this.destroy = this.destroy.bind(this);
        
        var barWidth = 100 / (Math.max(domainObject.composition.length, 1));

        var barGraphVue = Vue.extend({
            template: BarGraphView,
            data: function () {
                return {
                    low: -1,
                    middle: 0,
                    high: 1,
                    barWidth: barWidth,
                    telemetryObjects: [],
                    toPercent: toPercent
                };
            } 
        });

        this.barGraphVue = new barGraphVue();

        this.getDomainObjectsFromIdentifiers();
    }

    BarGraphController.prototype.getDomainObjectsFromIdentifiers = function () {
        var telemetryObjects = [];

        this.domainObject.composition.forEach(function (identifier) {
            this.openmct.objects.get(identifier).then(function (object){
                this.barGraphVue.telemetryObjects.push(object);
            }.bind(this));
        }.bind(this));

        return telemetryObjects;
    };

    BarGraphController.prototype.updateValues = function () {
        
    };

    BarGraphController.prototype.show = function (container) {
        this.barGraphVue.$mount(container);
    };

    BarGraphController.prototype.destroy = function (container) {
        this.barGraphVue.$destroy(true);
    };

    /*
    private
    */

    function toPercent(value, low, high) {
        var pct = 100 * (value - low) / (high - low);
        
        return Math.min(100, Math.max(0, pct));
    }

    return BarGraphController;
});
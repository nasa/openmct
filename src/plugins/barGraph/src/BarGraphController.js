define([
    'vue',
    'text!../res/templates/barGraph.html'
], function (
    Vue,
    BarGraphView
) {
    function BarGraphController(openmct, domainObject) {
        this.show = this.show.bind(this);
        this.destroy = this.destroy.bind(this);

        var barGraphVue = this.vue = Vue.extend({
            template: BarGraphView,
            data: function () {
                return {
                    low: -1,
                    middle: 0,
                    high: 1
                };
            } 
        });

        this.barGraphVue = new barGraphVue();
    }

    BarGraphController.prototype.updateValues = function () {
        
    }

    BarGraphController.prototype.show = function (container) {
        this.barGraphVue.$mount(container);
    }

    BarGraphController.prototype.destroy = function (container) {
        this.barGraphVue.$destroy(true);
    }

    return BarGraphController;
});
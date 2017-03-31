/*global define,requestAnimationFrame,Float32Array*/

/**
 * Module defining MCTChart. Created by vwoeltje on 11/12/14.
 */
define([
    './MCTChartController'
], function (
    MCTChartController
) {
    'use strict';

    var TEMPLATE = "<canvas style='position: absolute; background: none; width: 100%; height: 100%;'></canvas>";

    /**
     * MCTChart draws charts utilizing a drawAPI.
     *
     * @constructor
     */
    function MCTChart() {
        return {
            restrict: "E",
            template: TEMPLATE,
            link: function ($scope, $element, attrs, ctrl) {
                var canvas = $element.find("canvas")[0];

                if (ctrl.initializeCanvas(canvas)) {
                    ctrl.draw();
                }
            },
            controller: MCTChartController,
            scope: {
                config: "=",
                draw: "=" ,
                rectangles: "=",
                series: "=",
                xAxis: "=theXAxis",
                yAxis: "=theYAxis",
                highlights: "=?"
            }
        };
    }

    return MCTChart;
});

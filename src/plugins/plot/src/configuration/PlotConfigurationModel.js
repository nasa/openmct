/*global define, Promise*/

define([
    './Collection',
    './Model',
    './SeriesCollection',
    './XAxisModel',
    './YAxisModel',
    './LegendModel'
], function (
    Collection,
    Model,
    SeriesCollection,
    XAxisModel,
    YAxisModel,
    LegendModel
) {
    'use strict';

    var PlotConfigurationModel = Model.extend({

        initialize: function (options) {
            this.openmct = options.openmct;

            this.xAxis = new XAxisModel({
                model: options.model.xAxis,
                plot: this,
                openmct: options.openmct
            });
            this.yAxis = new YAxisModel({
                model: options.model.yAxis,
                plot: this,
                openmct: options.openmct
            });
            this.legend = new LegendModel({
                model: options.model.legend,
                plot: this,
                openmct: options.openmct
            });
            this.series = new SeriesCollection({
                models: options.model.series,
                plot: this,
                openmct: options.openmct
            });

            this.removeMutationListener = this.openmct.objects.observe(this.get('domainObject'), '*', function (domainObject) {
                this.set('domainObject', domainObject);
            }.bind(this));

            this.yAxis.listenToSeriesCollection(this.series);
            this.legend.listenToSeriesCollection(this.series);

            this.listenTo(this, 'destroy', this.onDestroy, this);

        },
        onDestroy: function () {
            this.xAxis.destroy();
            this.yAxis.destroy();
            this.series.destroy();
            this.legend.destroy();
            this.removeMutationListener();
        },
        defaults: function (options) {
            return {
                series: [],
                xAxis: {
                },
                yAxis: {
                },
                legend: {
                }
            };
        }
    });

    return PlotConfigurationModel;
});

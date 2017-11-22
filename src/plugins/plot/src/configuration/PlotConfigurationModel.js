/*global define, Promise*/

define([
    './Collection',
    './Model',
    './SeriesCollection',
    './XAxisModel',
    './YAxisModel',
    './LegendModel',
    '../lib/color'
], function (
    Collection,
    Model,
    SeriesCollection,
    XAxisModel,
    YAxisModel,
    LegendModel,
    color
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

            this.palette = new color.ColorPalette();

            this.listenTo(this.series, 'add', this.setLegendHeight, this);
            this.listenTo(this.series, 'remove', this.setLegendHeight, this);

            this.listenTo(this.legend, 'change:expanded', this.setLegendHeight, this);
            this.legend.set('expanded', this.legend.get('expandByDefault'));

            this.listenTo(this, 'destroy', this.onDestroy, this);

        },
        setLegendHeight: function () {
            var expanded = this.legend.get('expanded');
            if (this.legend.get('position') !== 'top') {
                this.legend.set('height', '0px');
            } else {
                this.legend.set('height', expanded ? (20 * (this.series.size() + 1) + 40) + 'px' : '21px');
            }
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

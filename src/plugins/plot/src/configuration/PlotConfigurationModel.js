/*global define, Promise*/

define([
    './Collection',
    './Model',
    '../lib/color'
], function (
    Collection,
    Model,
    color
) {
    'use strict';

    var PlotConfigurationModel = Model.extend({
        initialize: function (model) {
            model = model || {};
            this.series = new Collection(model.series);
            this.xAxis = new Model(model.xAxis);
            this.yAxis = new Model(model.yAxis);

            this.palette = new color.ColorPalette();

            this.xAxis.on('change:range', function (newValue, oldValue, model) {
                model.set('displayRange', newValue);
            });
            this.yAxis.on('change:range', function (newValue, oldValue, model) {
                if (!newValue) {
                    this.unset('displayRange');
                    return
                }
                if (model.get('autoscale')) {
                    var padding = Math.abs(newValue.max - newValue.min) * model.get('autoscalePadding');
                    if (padding === 0) {
                        padding = 1;
                    }
                    model.set('displayRange', {
                        min: newValue.min - padding,
                        max: newValue.max + padding,
                    });
                } else {
                    model.set('displayRange', newValue);
                }
            });

            this.listenTo(this.series, 'add', this.onSeriesAdd, this);
            this.listenTo(this.series, 'remove', this.onSeriesRemove, this);

            this.yAxis.on('change:autoscale', function (autoscale, oldValue, model) {
                if (autoscale) {
                    model.set('range', model.get('range'));
                }
            });
            this.yAxis.on('change:autoscalePadding', function (padding, old, model) {
                if (model.get('autoscale')) {
                    model.set('range', model.get('range'));
                }
            });

            if (this.xAxis.get('range')) {
                this.xAxis.set('range', this.xAxis.get('range'));
            }
            if (this.yAxis.get('range')) {
                this.yAxis.set('range', this.yAxis.get('range'));
            }
            this.listenTo(this, 'destroy', this.onDestroy, this);
        },
        onDestroy: function () {
            this.xAxis.destroy();
            this.yAxis.destroy();
            this.series.destroy();
        },
        defaults: function () {
            return {
                state: 'unloaded',
                series: [],
                xAxis: {
                },
                yAxis: {
                    autoscalePadding: 0.1
                }
            };
        },
        onSeriesAdd: function (series) {
            var seriesColor = series.get('color');
            if (seriesColor) {
                if (!(seriesColor instanceof color.Color)) {
                    seriesColor = color.Color.fromHexString(seriesColor);
                    series.set('color', seriesColor);
                }
                this.palette.remove(seriesColor);
            } else {
                series.set('color', this.palette.getNextColor());
            }
            this.listenTo(series, 'change:color', this.updateColorPalette, this);
        },
        onSeriesRemove: function (series) {
            this.palette.return(series.get('color'));
            this.stopListening(series);
        },
        updateColorPalette: function (newColor, oldColor) {
            this.palette.remove(newColor);
            var seriesWithColor = this.series.filter(function (series) {
                return series.get('color') === newColor;
            })[0];
            if (!seriesWithColor) {
                this.palette.return(oldColor);
            }
        }
    });

    return PlotConfigurationModel;
});

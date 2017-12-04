/*global define, Promise*/

define([
    './Collection',
    './Model',
    './SeriesCollection',
    './XAxisModel',
    './YAxisModel',
    './LegendModel',
    'lodash'
], function (
    Collection,
    Model,
    SeriesCollection,
    XAxisModel,
    YAxisModel,
    LegendModel,
    _
) {
    'use strict';

    /**
     * PlotConfiguration model stores the configuration of a plot and some
     * limited state.  The indiidual parts of the plot configuration model
     * handle setting defaults and updating in response to various changes.
     *
     */
    var PlotConfigurationModel = Model.extend({

        /**
         * Initializes all sub models and then passes references to submodels
         * to those that need it.
         */
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

            this.removeMutationListener = this.openmct.objects.observe(
                this.get('domainObject'),
                '*',
                this.updateDomainObject.bind(this)
            );
            this.yAxis.listenToSeriesCollection(this.series);
            this.legend.listenToSeriesCollection(this.series);

            this.listenTo(this, 'destroy', this.onDestroy, this);
        },
        /**
         * Update the domain object with the given value.
         */
        updateDomainObject: function (domainObject) {
            this.set('domainObject', domainObject);
        },
        /**
         * Clean up all objects and remove all listeners.
         */
        onDestroy: function () {
            this.xAxis.destroy();
            this.yAxis.destroy();
            this.series.destroy();
            this.legend.destroy();
            this.removeMutationListener();
        },
        /**
         * Return defaults, which are extracted from the passed in domain
         * object.
         */
        defaults: function (options) {
            return {
                series: [],
                domainObject: options.domainObject,
                xAxis: {
                },
                yAxis: _.cloneDeep(_.get(options.domainObject, 'configuration.yAxis', {})),
                legend: _.cloneDeep(_.get(options.domainObject, 'configuration.legend', {}))
            };
        }
    });

    return PlotConfigurationModel;
});

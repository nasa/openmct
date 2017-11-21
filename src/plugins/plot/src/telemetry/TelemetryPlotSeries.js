/*global define*/

define([
    '../plot/PlotSeries',
    'lodash'
], function (
    PlotSeries,
    _
) {
    'use strict';

    var TelemetryPlotSeries = PlotSeries.extend({
        initialize: function (options) {
            this.openmct = options.openmct;
            this.limitEvaluator = openmct.telemetry.limitEvaluator(this.model.domainObject);
            this.on('destroy', this.onDestroy, this);
        },

        defaults: function (options) {
            return {
                markers: true,
                name: options.model.domainObject.name,
            }
        },

        onDestroy: function (model) {
            if (this.unsubscribe) {
                this.unsubscribe();
            }
        },

       /**
        * Fetch historical data and establish a realtime subscription.  Returns
        * a promise that is resolved when all connections have been successfully
        * established.
        *
        * @returns {Promise}
        */
        fetch: function (options) {
            options = _.extend({}, {size: 1000, strategy: 'minmax'}, options || {});
            if (!this.unsubscribe) {
                this.unsubscribe = this.openmct
                    .telemetry
                    .subscribe(
                        this.get('domainObject'),
                        this.add.bind(this)
                    );
            }

            return this.openmct
                .telemetry
                .request(this.get('domainObject'), options)
                .then(function (points) {
                    this.reset();
                    this.addPoints(points);
                }.bind(this));
        },
        /**
         *
         *
         */
        addPoints: function (points) {
            points.forEach(function (point) {
                this.add(point);
            }, this);
        }

    });






    return TelemetryPlotSeries;
});

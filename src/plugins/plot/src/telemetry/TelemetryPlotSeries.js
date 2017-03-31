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
        initialize: function (model, publicAPI) {
            this.publicAPI = publicAPI;
            this.on('destroy', this.onDestroy, this);
        },

        defaults: function (model) {
            return {
                markers: true,
                name: model.domainObject.name,
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
                this.unsubscribe = this.publicAPI
                    .telemetry
                    .subscribe(
                        this.get('domainObject'),
                        this.add.bind(this)
                    );
            }

            return this.publicAPI
                .telemetry
                .request(this.get('domainObject'), options)
                .then(this.addPoints.bind(this));
        },
        /**
         *
         *
         */
        addPoints: function (points) {
            points.forEach(this.add, this);
        }

    });






    return TelemetryPlotSeries;
});

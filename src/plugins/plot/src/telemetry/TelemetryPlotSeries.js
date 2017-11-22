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
            this.domainObject = options.domainObject;
            this.limitEvaluator = this.openmct.telemetry.limitEvaluator(options.domainObject);
            this.on('destroy', this.onDestroy, this);
        },

        defaults: function (options) {
            var metadata = options.openmct.telemetry.getMetadata(options.domainObject);
            var range = metadata.valuesForHints(['range'])[0];
            return {
                markers: true,
                name: options.domainObject.name,
                xKey: options.collection.plot.xAxis.get('key'),
                yKey: range.key,
                metadata: metadata,
                formats: options.openmct.telemetry.getFormatMap(metadata),
                markers: true,
                markerSize: 2.0,
                alarmMarkers: true
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
                        this.domainObject,
                        this.add.bind(this)
                    );
            }

            return this.openmct
                .telemetry
                .request(this.domainObject, options)
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

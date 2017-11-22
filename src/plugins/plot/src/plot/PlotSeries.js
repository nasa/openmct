/*global define*/

define([
    'lodash',
    '../configuration/Model',
    '../lib/extend',
    'EventEmitter'
], function (
    _,
    Model,
    extend,
    EventEmitter
) {
    'use strict';

    /**
     * Plot series handles loading data from a domain object into a series
     * object.  Listeners can be attached to a plot series and will be called
     * every time a data point is added.

     * @prop {Array} data an array of data points.
     * @prop {String} name the display name of the object.
     * @prop {Color} color the color of the line.
     * @prop {String} interpolate interpolate method, either `undefined` (no
     *     interpolate), `linear`, or `stepAfter`.
     * @prop {Boolean} markers if true, display plot markers.
     * @prop {Function} xFormat a function that formats x values.
     * @prop {Function} yFormat a function that formats y values.
     *
     * @constructor
     * @param {Object} options
     * @param {String} options.interpolate an interpolate option, either
     *     `undefined` (no interpolate), `linear`, or `stepAfter`.
     * @param {Boolean} options.markers whether or not to show markers on line.
     * @param {Color} options.color The color to use when drawing the line.
     * @param {String} options.name The name of the object
     * @param {Function} options.xFormat a function that formats x values.
     * @param {Function} options.yFormat a function that formats y values.
     *
     */
    var PlotSeries = Model.extend({
        constructor: function (model) {
            this.data = [];
            this.listenTo(this, 'change:xKey', this.onXKeyChange, this);
            this.listenTo(this, 'change:yKey', this.onYKeyChange, this);

            Model.apply(this, arguments);
            this.onXKeyChange(this.get('xKey'));
            this.onYKeyChange(this.get('yKey'));
        },
        /**
         * Override this to implement default properties.
         */
        defaults: function () {
            return {
            };
        },

        initialize: function () {

        },
        /**
         * Override this to implement data fetching.  Should return a promise
         * for an array of points.
         *
         * @returns {Promise}
         */
        fetch: function (options) {
            return Promise.resolve([]);
        },

        onXKeyChange: function (xKey) {
            var format = this.get('formats')[xKey];
            this.getXVal = format.parse.bind(format);
        },
        onYKeyChange: function (newKey, oldKey) {
            if (newKey === oldKey) {
                return;
            }
            var valueMetadata = this.get('metadata').value(newKey);
            if (valueMetadata.format === 'enum') {
                this.set('interpolate', 'stepAfter');
            } else {
                this.set('interpolate', 'linear');
            }
            this.evaluate = function (datum) {
                return this.limitEvaluator.evaluate(datum, valueMetadata);
            }.bind(this);
            var format = this.get('formats')[newKey];
            this.getYVal = format.parse.bind(format);
        },

        /**
         * Retrieve and format a value from a given point.
         */
        format: function (point, key) {
            return this.get('formats')[key].format(point);
        },
        /**
         * Retrieve a numeric value from a given point.
         */
        value: function (point, key) {
            return this.get('formats')[key].parse(point);
        },

        /**
         * Reset plot series.
         */
        reset: function (data) {
            this.data = [];
            this.resetStats();
            this.emit('reset');
        },
        resetStats: function () {
            this.unset('stats');
            this.data.forEach(this.updateStats, this);
        },
        /**
         * Return the point closest to a given point, based on the sort
         * key of this collection.
         */
        nearestPoint: function (point) {
            var insertIndex = this.sortedIndex(point),
                lowPoint = this.data[insertIndex - 1],
                highPoint = this.data[insertIndex],
                indexVal = this.getXVal(point),
                lowDistance = lowPoint ?
                    indexVal - this.getXVal(lowPoint) :
                    Number.POSITIVE_INFINITY,
                highDistance = highPoint ?
                    this.getXVal(highPoint) - indexVal :
                    Number.POSITIVE_INFINITY,
                nearestPoint = highDistance < lowDistance ? highPoint : lowPoint;

            return nearestPoint;
        },
        /**
         * Override this to implement plot series loading functionality.  Must return
         * a promise that is resolved when loading is completed.
         *
         * @private
         * @returns {Promise}
         */
        load: function (options) {
            this.resetOnAppend = true;

            return this.fetch(options)
                .then(function (res) {
                    this.emit('load');
                    return res;
                }.bind(this));
        },

        /**
         * Find the insert index for a given point to maintain sort order.
         * @private
         */
        sortedIndex: function (point) {
            return _.sortedIndex(this.data, point, this.getXVal);
        },
        /**
         * Update min/max stats for the series.
         * @private
         */
        updateStats: function (point) {
            var value = this.getYVal(point);
            var stats = this.get('stats');
            var changed = false;
            if (!stats) {
                stats = {
                    minValue: value,
                    minPoint: point,
                    maxValue: value,
                    maxPoint: point
                };
                changed = true;
            } else {
                if (stats.maxValue < value) {
                    stats.maxValue = value;
                    stats.maxPoint = point;
                    changed = true;
                }
                if (stats.minValue > value) {
                    stats.minValue = value;
                    stats.minPoint = point;
                    changed = true;
                }
            }
            if (changed) {
                this.set('stats', {
                    minValue: stats.minValue,
                    minPoint: stats.minPoint,
                    maxValue: stats.maxValue,
                    maxPoint: stats.maxPoint
                });
            }
        },
        /**
         * Append a point to the data array and notify listeners.
         *
         * @private
         * @param {Object} point
         * @property point.x
         * @property point.y
         */
        add: function (point) {
            // if (this.resetOnAppend) {
            //     this.resetOnAppend = false;
            //     this.reset();
            // }
            var insertIndex = this.sortedIndex(point);
            if (_.isEqual(this.data[insertIndex], point)) {
                // TODO: Maybe log for this.
                return;
            }
            if (_.isEqual(this.data[insertIndex + 1], point)) {
                // TODO: Maybe log for this.
                return;
            }
            this.updateStats(point);
            point._limit = this.evaluate(point);
            this.data.splice(insertIndex, 0, point);
            this.emit('add', point, insertIndex, this);
        },
        /**
         * Remove a point from the data array.
         */
        remove: function (point) {
            var index = this.data.indexOf(point);
            this.data.splice(index, 1);
            this.emit('remove', point, index, this);
        },
        purgeRecordsOutsideRange: function (range) {
            var xKey = this.get('xKey');
            var format = this.get('formats')[xKey];
            var startPoint = {};
            var endPoint = {};
            startPoint[xKey] = format.format(range.min);
            endPoint[xKey] = format.format(range.max);

            var startIndex = this.sortedIndex(startPoint);
            var endIndex = this.sortedIndex(endPoint) + 1;
            this.data.slice(0, startIndex).forEach(this.remove, this);
            this.data.slice(endIndex, this.data.length).forEach(this.remove, this);
            this.resetStats();
        }
    });

    return PlotSeries;

});

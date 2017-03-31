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
            this.tracking = {};
            this.stats = new Model();
            this.updateStat = this.updateStat.bind(this);
            this.updateStats = this.updateStats.bind(this);
            this.onSortKeyChange = this.onSortKeyChange.bind(this);
            this.on('change:sortKey', this.onSortKeyChange);

            Model.apply(this, arguments);
            this.onSortKeyChange(this.get('sortKey'));
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

        onSortKeyChange: function (sortKey) {
            var format = this.get('formats')[sortKey];
            this.getSortVal = format.parse.bind(format);
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
            Object.keys(this.stats.model).forEach(this.stats.unset, this.stats);
        },
        /**
         * Return the point closest to a given point, based on the sort
         * key of this collection.
         */
        nearestPoint: function (point) {
            var insertIndex = this.sortedIndex(point),
                lowPoint = this.data[insertIndex - 1],
                highPoint = this.data[insertIndex],
                indexVal = this.getSortVal(point),
                lowDistance = lowPoint ?
                    indexVal - this.getSortVal(lowPoint) :
                    Number.POSITIVE_INFINITY,
                highDistance = highPoint ?
                    this.getSortVal(highPoint) - indexVal :
                    Number.POSITIVE_INFINITY,
                nearestPoint = highDistance < lowDistance ? highPoint : lowPoint;

            return nearestPoint;
        },
        /**
         * Track stats (min max, etc) for a given key.
         *
         */
        trackStats: function (key) {
            if (this.tracking[key]) {
                return;
            }

            this.tracking[key] = function (point) {
                this.updateStat(key, point);
            }.bind(this);

            this.data.forEach(this.tracking[key]);
        },
        /**
         * Untrack stats for a given key.
         *
         */
        untrackStats: function (key) {
            delete this.tracking[key];
            this.stats.unset(key);
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
            return _.sortedIndex(this.data, point, this.getSortVal);
        },
        /**
         * Update min/max stats for a key to include a given value.
         * @private
         */
        updateStat: function (key, point) {
            var value = this.value(point, key);
            var stat = this.stats.get(key),
                changed = false;
            if (!stat) {
                stat = {
                    max: value,
                    min: value
                };
                changed = true;

            } else {
                if (stat.max < value) {
                    stat.max = value;
                    changed = true;
                }
                if (stat.min > value) {
                    stat.min = value;
                    changed = true;
                }
            }

            if (changed) {
                this.stats.set(key, {
                    min: stat.min,
                    max: stat.max
                });
            }
        },
        /**
         *
         */
        /**
         * Update min/max stats for a given point.
         * @private
         */
        updateStats: function (point) {
            // TODO: make this faster.
            for (var trackKey in this.tracking) {
                if (this.tracking.hasOwnProperty(trackKey)) {
                    this.tracking[trackKey](point);
                }
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
            this.data.splice(insertIndex, 0, point);
            this.emit('add', point, insertIndex, this);
        },
        /**
         * Remove a point from the data array and remove listeners.
         */
        remove: function (point) {
            var index = this.data.indexOf(point);
            this.data.splice(index, 1);
            this.emit('remove', point, index, this);
        },
        purgeRecordsOutsideRange: function (range) {
            var sortKey = this.get('sortKey');
            var format = this.get('formats')[sortKey];
            var startPoint = {};
            var endPoint = {};
            startPoint[sortKey] = format.format(range.min);
            endPoint[sortKey] = format.format(range.max);

            var startIndex = this.sortedIndex(startPoint);
            var endIndex = this.sortedIndex(endPoint) + 1;
            this.data.slice(0, startIndex).forEach(this.remove, this);
            this.data.slice(endIndex, this.data.length).forEach(this.remove, this);
            this.resetStats();
            this.data.forEach(this.updateStats, this);
        }
    });

    return PlotSeries;

});

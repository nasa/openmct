/*global define,Promise*/

define([
    'lodash',
    '../configuration/PlotConfigurationModel',
    '../configuration/configStore',
    '../lib/eventHelpers'
], function (
    _,
    PlotConfigurationModel,
    configStore,
    eventHelpers
) {
    'use strict';

    /**
    TODO: Need to separate off plot configuration and specifying of defaults,
    is part of onDomainObjectChange as it can be triggered by mutation.
     */

    /**
     * Controller for a plot.
     *
     * @constructor.
     */
    function PlotController(
        $scope,
        $element,
        formatService,
        openmct,
        objectService,
        exportImageService
    ) {

        this.$scope = $scope;
        this.$element = $element;
        this.formatService = formatService;
        this.openmct = openmct;
        this.objectService = objectService;
        this.exportImageService = exportImageService;

        $scope.pending = 0;

        this.listenTo($scope, 'user:viewport:change:end', this.onUserViewportChangeEnd, this);
        this.listenTo($scope, '$destroy', this.destroy, this);

        this.config = this.getConfig(this.$scope.domainObject);
        this.listenTo(this.config.series, 'add', this.addSeries, this);
        this.listenTo(this.config.series, 'remove', this.removeSeries, this);
        this.config.series.forEach(this.addSeries, this);

        this.followTimeConductor();
        window.plot = this;
    }

    eventHelpers.extend(PlotController.prototype);

    PlotController.prototype.followTimeConductor = function () {
        this.listenTo(this.openmct.time, 'bounds', this.updateDisplayBounds, this);
        this.listenTo(this.openmct.time, 'timeSystem', this.onTimeSystemChange, this);
        this.synchronized(true);
    };

    PlotController.prototype.loadSeriesData = function (series) {
        this.startLoading();
        var options = {
            size: this.$element[0].offsetWidth,
            domain: this.config.xAxis.get('key')
        };

        series.load(options)
            .then(this.stopLoading.bind(this));
    };

    PlotController.prototype.addSeries = function (series) {
        this.listenTo(series, 'change:yKey', function () {
            this.loadSeriesData(series);
        }, this)
        this.loadSeriesData(series);
    };

    PlotController.prototype.removeSeries = function (plotSeries) {
        this.stopListening(plotSeries);
    };

    PlotController.prototype.getConfig = function (domainObject) {
        var configId = domainObject.getId();
        var config = configStore.get(configId);
        if (!config) {
            var newDomainObject = domainObject.useCapability('adapter');
            config = new PlotConfigurationModel({
                id: configId,
                domainObject: newDomainObject,
                openmct: this.openmct
            });
            configStore.add(configId, config);
        }
        configStore.track(configId);
        return config;
    };

    PlotController.prototype.onTimeSystemChange = function (timeSystem) {
        this.config.xAxis.set('key', timeSystem.key);
    };

    PlotController.prototype.destroy = function () {
        configStore.untrack(this.config.id);
        this.stopListening();
    };

    PlotController.prototype.loadMoreData = function (range, purge) {
        this.config.series.map(function (plotSeries) {
            this.startLoading();
            plotSeries.load({
                    size: this.$element[0].offsetWidth,
                    start: range.min,
                    end: range.max
                })
                .then(this.stopLoading.bind(this));
            if (purge) {
                plotSeries.purgeRecordsOutsideRange(range);
            }
        }, this);
    };

    /**
     * Track latest display bounds.  Forces update when not receiving ticks.
     */
    PlotController.prototype.updateDisplayBounds = function (bounds, isTick) {
        var newRange = {
            min: bounds.start,
            max: bounds.end
        };
        this.config.xAxis.set('range', newRange);
        if (!isTick) {
            this.$scope.$broadcast('plot:clearHistory');
            this.loadMoreData(newRange, true);
        } else {
            // Drop any data that is more than 1x (max-min) before min.
            // Limit these purges to once a second.
            if (!this.nextPurge || this.nextPurge < Date.now()) {
                var keepRange = {
                    min: newRange.min - (newRange.max - newRange.min),
                    max: newRange.max
                };
                this.config.series.forEach(function (series) {
                    series.purgeRecordsOutsideRange(keepRange);
                });
                this.nextPurge = Date.now() + 1000;
            }
        }
    };

    PlotController.prototype.startLoading = function () {
        this.$scope.pending += 1;
    };

    PlotController.prototype.stopLoading = function () {
        this.$scope.pending -= 1;
    };

    /**
     * Getter/setter for "synchronized" value.  If not synchronized and
     * time conductor is in clock mode, will mark objects as unsynced so that
     * displays can update accordingly.
     * @private
     */
    PlotController.prototype.synchronized = function (value) {
        if (typeof value !== 'undefined') {
            this._synchronized = value;
            var isUnsynced = !value && this.openmct.time.clock();
            if (this.$scope.domainObject.getCapability('status')) {
                this.$scope.domainObject.getCapability('status')
                    .set('timeconductor-unsynced', isUnsynced);
            }
        }
        return this._synchronized;
    };

    /**
     * Handle end of user viewport change: load more data for current display
     * bounds, and mark view as synchronized if bounds match configured bounds.
     * @private
     */
    PlotController.prototype.onUserViewportChangeEnd = function () {
        var xDisplayRange = this.config.xAxis.get('displayRange');
        var xRange = this.config.xAxis.get('range');

        this.loadMoreData(xDisplayRange);

        this.synchronized(xRange.min === xDisplayRange.min &&
                          xRange.max === xDisplayRange.max);
    };

    /**
     * Export view as JPG.
     */
    PlotController.prototype.exportJPG = function () {
        this.hideExportButtons = true;
        this.exportImageService.exportJPG(this.$element[0], 'plot.jpg')
            .finally(function () {
                this.hideExportButtons = false;
            }.bind(this));
    };

    /**
     * Export view as PNG.
     */
    PlotController.prototype.exportPNG = function () {
        this.hideExportButtons = true;
        this.exportImageService.exportPNG(this.$element[0], 'plot.png')
            .finally(function () {
                this.hideExportButtons = false;
            }.bind(this));
    };

    return PlotController;

});

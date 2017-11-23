/*global define,Promise*/

define([
    'lodash',
    './TelemetryPlotSeries',
    '../configuration/PlotConfigurationModel',
    '../configuration/configStore',
    '../lib/eventHelpers'
], function (
    _,
    PlotSeries,
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

        this.initialize($scope.domainObject);
        this.followTimeConductor();
        window.plot = this;
    }

    eventHelpers.extend(PlotController.prototype);

    PlotController.prototype.initialize = function () {
        this.getConfig(this.$scope.domainObject);
        this.listenTo(this.config.series, 'add', this.addSeries, this);
        this.listenTo(this.config.series, 'remove', this.removeSeries, this);

        this.config.series.forEach(this.addSeries, this);
    };

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

        _.extend(options, this.openmct.time.bounds());

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
        this.configId = domainObject.getId();
        this.config = configStore.get(this.configId);
        if (!this.config) {
            var newDomainObject = domainObject.useCapability('adapter');
            this.config = new PlotConfigurationModel({
                domainObject: newDomainObject,
                openmct: this.openmct
            });
            configStore.add(this.configId, this.config);
        }

        return this.config;
    };

    PlotController.prototype.onTimeSystemChange = function (timeSystem) {
        this.config.xAxis.set('key', timeSystem.key);
    };

    PlotController.prototype.destroy = function () {
        configStore.remove(this.configId);
        this.config.destroy();
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
     * Update display bounds when receiving events from time conductor.
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
            // TODO: drop any data that is more than 2x (max-min) before min.
        }
    };

    PlotController.prototype.startLoading = function () {
        this.$scope.pending += 1;
    };

    PlotController.prototype.stopLoading = function () {
        this.$scope.pending -= 1;
    };

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

    PlotController.prototype.onUserViewportChangeEnd = function () {
        var xDisplayRange = this.config.xAxis.get('displayRange');
        var xRange = this.config.xAxis.get('range');

        this.loadMoreData(xDisplayRange);

        this.synchronized(xRange.min === xDisplayRange.min &&
                          xRange.max === xDisplayRange.max);
    };

    PlotController.prototype.exportJPG = function () {
        this.hideExportButtons = true;
        this.exportImageService.exportJPG(this.$element[0], 'plot.jpg')
            .finally(function () {
                this.hideExportButtons = false;
            }.bind(this));
    };

    PlotController.prototype.exportPNG = function () {
        this.hideExportButtons = true;
        this.exportImageService.exportPNG(this.$element[0], 'plot.png')
            .finally(function () {
                this.hideExportButtons = false;
            }.bind(this));
    };

    return PlotController;

});

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

        this.timeConductor = openmct.conductor;

        this.listenTo($scope, 'user:viewport:change:end', this.onUserViewportChangeEnd, this);
        this.listenTo($scope, 'user:viewport:change:start', this.onUserViewportChangeStart, this);
        this.listenTo($scope, '$destroy', this.destroy, this);
        this.listenTo(this.timeConductor, 'bounds', this.updateDisplayBounds, this);
        this.listenTo(this.timeConductor, 'timeSystem', this.onTimeSystemChange, this);
        this.synchronized(true);

        this.initialize($scope.domainObject);
        this.followTimeConductor(openmct.conductor);
        window.plot = this;
    }

    eventHelpers.extend(PlotController.prototype);

    PlotController.prototype.addSeries = function (series) {
        this.listenTo(series.stats, 'change', this.onSeriesStatChange, this);
        var metadata = series.get('metadata');

        var yKey = this.config.yAxis.get('key');
        if (!metadata.value(yKey)) {
            // Find new option!
            var metadatas = this.config.series.map(function (series) {
                return series.get('metadata');
            });

            var options = this.openmct.telemetry.commonValuesForHints(metadatas, ['y']);
            if (!options.length) {
                // TODO: gracefully handle case where we can't plot two things
                // together?
                throw new Error('Invalid pairing, sorry.');
            }
            yKey = options[0].key;
            this.config.yAxis.set('key', yKey);
        } else {
            this.updateYAxis();
        }

        this.startLoading();
        var options = {
            size: this.$element[0].offsetWidth,
            domain: this.config.xAxis.get('key')
        };

        _.extend(options, this.timeConductor.bounds());

        series.load(options)
            .then(this.stopLoading.bind(this));
    };

    PlotController.prototype.removeSeries = function (plotSeries) {
        plotSeries.destroy();
        this.stopListening(plotSeries.stats);
    };

    PlotController.prototype.onSeriesStatChange = function (key, stats) {
        if (!this.config.yAxis.get('autoscale')) {
            return;
        }
        if (this.config.yAxis.get('key') !== key) {
            return;
        }
        if (this.config.yAxis.get('values')) {
            return;
        }
        if (!this.config.yAxis.get('range')) {
            return;
        }
        if (!stats) {
            // TODO: likely a removal or full requery, need to set
            return;
        }
        var range = this.config.yAxis.get('range');
        var changed = false;
        if (!range.min || stats.min < range.min) {
            range.min = stats.min;
            changed = true;
        }
        if (!range.max || stats.max > range.max) {
            range.max = stats.max;
            changed = true;
        }
        if (changed) {
            this.config.yAxis.set('range', {
                min: range.min,
                max: range.max
            });
        }
    };

    PlotController.prototype.getConfig = function (domainObject) {
        this.configId = domainObject.getId();
        this.config = configStore.get(this.configId);
        if (!this.config) {
            var bounds = this.timeConductor.bounds();
            var timeSystem = this.timeConductor.timeSystem();
            var format = this.formatService.getFormat(timeSystem.formats()[0]);
            var model = domainObject.getModel();

            this.config = new PlotConfigurationModel({
                xAxis: {
                    key: timeSystem.metadata.key,
                    range: {
                        min: bounds.start,
                        max: bounds.end,
                    },
                    format: format.format.bind(format),
                    label: timeSystem.metadata.key
                },
                yAxis: _.get(model, 'configuration.yAxis', {}),
                domainObject: model
            });
            configStore.add(this.configId, this.config);
        }
        return this.config;
    };

    PlotController.prototype.loadConfig = function () {
        this.config.set('state', 'loading');
        this.startLoading();
        this.openmct.objects.get(this.$scope.domainObject.getId())
            .then(function (newDomainObject) {
                this.config.set('state', 'loaded');
                this.stopLoading();
                if (newDomainObject.telemetry) {
                    this.addTelemetryObject(newDomainObject);
                } else {
                    this.watchTelemetryContainer(newDomainObject);
                }
            }.bind(this));
    };

    /* Updates YAxis in response to a change */
    PlotController.prototype.updateYAxis = function () {
        if (!this.config.series.size()) {

            [
                'format',
                'values',
                'range',
                'autoscale',
                'label',
                'key'
            ].forEach(function (k) {
                if (this.config.yAxis.has(k)) {
                    this.config.yAxis.unset(k);
                }
            }, this);
            return;
        }
        var yKey = this.config.yAxis.get('key');
        var sampleSeries = this.config.series.first();
        var yMetadata = sampleSeries.get('metadata').value(yKey);
        var yFormat = sampleSeries.get('formats')[yKey];
        var range = this.config.yAxis.get('range');
        if (_.isUndefined(range) ||
            _.isUndefined(range.min) ||
            _.isUndefined(range.max)) {

            range = {
                min: yMetadata.min,
                max: yMetadata.max
            };
        }

        var autoscale = this.config.yAxis.get('autoscale');
        if (_.isUndefined(autoscale)) {
            autoscale = !range.min && !range.max;
        }

        if (autoscale && this.config.series.size()) {
            var newScale = this.config.series.map(function (series) {
                return series.stats.get(this.config.yAxis.get('key'));
            }, this).reduce(function (a, b) {
                if (!b) {
                    return a;
                }
                return {
                    min: a.min < b.min ? a.min : b.min,
                    max: a.max > b.max ? a.max : b.max
                };
            });
            this.config.yAxis.set('range', newScale);
        }

        var label = this.config.yAxis.get('label');
        if (_.isUndefined(label)) {
            if (this.config.series.size() > 1) {
                label = yKey;
            } else {
                label = yMetadata.units;
            }
        }

        this.config.yAxis.set('format', yFormat.format.bind(yFormat));
        this.config.yAxis.set('values', yMetadata.values);
        this.config.yAxis.set('range', range);
        this.config.yAxis.set('autoscale', autoscale);
        this.config.yAxis.set('label', label);
    };

    PlotController.prototype.changeYAxis = function (newKey, oldKey) {
        if (newKey === oldKey) {
            return;
        }

        this.updateYAxis();

        this.config.series.forEach(function (series) {
            series.set('yKey', newKey);
        });

    };

    PlotController.prototype.changeXAxis = function (newKey, oldKey) {
        if (newKey === oldKey) {
            return;
        }
        if (this.config.series.models.length) {
            var xMetadata = this.config.series.first()
                .get('metadata')
                .value(newKey);
            var xFormat = this.openmct.telemetry.getValueFormatter(xMetadata);
            this.config.xAxis.set('label', xMetadata.name);
            this.config.xAxis.set('format', xFormat.format.bind(xFormat));
        } else {
            this.config.xAxis.set('format', function (x) { return x;});
            this.config.xAxis.set('label', newKey);
        }
        this.config.xAxis.unset('range');
        this.config.series.forEach(function (series) {
            series.set('sortKey', newKey);
            series.reset();
        });
    };

    PlotController.prototype.initialize = function () {
        this.getConfig(this.$scope.domainObject);
        this.listenTo(this.config.series, 'add', this.addSeries, this);
        this.listenTo(this.config.series, 'remove', this.removeSeries, this);
        this.listenTo(this.config.yAxis, 'change:key', this.changeYAxis, this);
        this.listenTo(this.config.xAxis, 'change:key', this.changeXAxis, this);

        this.config.series.forEach(this.addSeries, this);

        if (this.config.get('state') === 'unloaded') {
            this.loadConfig();
        }
    };

    PlotController.prototype.watchTelemetryContainer = function (domainObject) {
        // _.each(domainObject.configuration.yAxis, function (v, k) {
        //     this.config.yAxis.set(k, v);
        // }, this);
        this.config.set('domainObject', domainObject);
        this.domainObject = domainObject;
        this.removeMutationListener = this.openmct.objects.observe(domainObject, '*', function (domainObject) {
            this.domainObject = domainObject;
        }.bind(this));
        var composition = this.openmct.composition.get(domainObject);
        this.listenTo(composition, 'add', this.addTelemetryObject, this);
        this.listenTo(composition, 'remove', this.removeTelemetryObject, this);
        composition.load();
    };

    PlotController.prototype.getSeriesConfig = function (identifier, index) {
        if (!this.domainObject) {
            return {};
        }

        var seriesConfig = this.domainObject.configuration.series[index];
        if (!seriesConfig) {
            seriesConfig = {
                identifier: identifier
            };
            this.openmct.objects.mutate(
                this.domainObject,
                'configuration.series[' + index + ']',
                seriesConfig
            );
        }
        return seriesConfig;
    };

    PlotController.prototype.addTelemetryObject = function (domainObject) {
        var index = this.config.series.size();
        var seriesConfig = this.getSeriesConfig(domainObject.identifier, index);
        var metadata = this.openmct.telemetry.getMetadata(domainObject);

        var seriesModel = {
            domainObject: domainObject,
            sortKey: this.config.xAxis.get('key'),
            yKey: this.config.yAxis.get('key'),
            metadata: metadata,
            formats: this.openmct.telemetry.getFormatMap(metadata),
            markers: true,
            markerSize: 2.0
        };

        _.extend(seriesModel, seriesConfig);

        var series = new PlotSeries(seriesModel, this.openmct);

        this.config.series.add(series);
    };

    PlotController.prototype.removeTelemetryObject = function (id) {
        var index = _.findIndex(this.domainObject.configuration.series, function (s) {
            return _.isEqual(id, s.identifier);
        });
        this.config.series.remove(this.config.series.at(index));
        var cSeries = this.domainObject.configuration.series.slice();
        cSeries.splice(index, 1);
        this.openmct.objects.mutate(this.domainObject, 'configuration.series', cSeries);
        this.updateYAxis();
    };

    PlotController.prototype.followTimeConductor = function (timeConductor) {
        this.timeConductor = timeConductor;
        this.listenTo(this.timeConductor, 'bounds', this.updateDisplayBounds, this);
        this.listenTo(this.timeConductor, 'timeSystem', this.onTimeSystemChange, this);
        this.synchronized(true);
    };

    PlotController.prototype.onTimeSystemChange = function (timeSystem) {
        // TODO: reset all series, reload.
        this.config.xAxis.set('key', timeSystem.metadata.key);
    };

    PlotController.prototype.destroy = function () {
        configStore.remove(this.configId);
        this.config.destroy();
        this.stopListening();
        if (this.removeMutationListener) {
            this.removeMutationListener();
        }
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
    PlotController.prototype.updateDisplayBounds = function (bounds) {
        var newRange = {
            min: bounds.start,
            max: bounds.end
        };
        var oldRange = this.config.xAxis.get('range');
        if (_.isEqual(newRange, oldRange)) {
            return;
        }
        if (this.timeConductor.follow() && !this.synchronized()) {
            return;
        }
        if (!this.synchronized()) {
            this.config.yAxis.set('displayRange', this.config.yAxis.get('range'));
        }
        this.config.xAxis.set('range', newRange);
        if (!this.timeConductor.follow()) {
            this.loadMoreData(newRange, true);
            return;
        }
        if ((oldRange.max === newRange.max && oldRange.min > newRange.min) ||
            (oldRange.min === newRange.min && oldRange.max < newRange.max)) {
            // Time range expanded, load more data.
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
            var isUnsynced = !value && this.timeConductor.follow();
            if (this.$scope.domainObject.getCapability('status')) {
                this.$scope.domainObject.getCapability('status')
                    .set('timeconductor-unsynced', isUnsynced);
            }
        }
        return this._synchronized;
    };

    PlotController.prototype.onUserViewportChangeStart = function () {
        this.yAutoscale = this.config.yAxis.get('autoscale');
        this.config.yAxis.set('autoscale', false);
        this.synchronized(false);
    };

    PlotController.prototype.onUserViewportChangeEnd = function () {
        var xDisplayRange = this.config.xAxis.get('displayRange');
        var xRange = this.config.xAxis.get('range');

        this.loadMoreData(xDisplayRange);

        this.synchronized(xRange.min === xDisplayRange.min &&
                          xRange.max === xDisplayRange.max);

        if (this.synchronized()) {
            this.config.yAxis.set('autoscale', this.yAutoscale);
        }
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

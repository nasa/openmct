/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
define([
    './PlotSeries',
    './Collection',
    './Model',
    '../lib/color',
    'lodash'
], function (
    PlotSeries,
    Collection,
    Model,
    color,
    _
) {

    var SeriesCollection = Collection.extend({
        modelClass: PlotSeries,
        initialize: function (options) {
            this.plot = options.plot;
            this.openmct = options.openmct;
            this.palette = new color.ColorPalette();
            this.listenTo(this, 'add', this.onSeriesAdd, this);
            this.listenTo(this, 'remove', this.onSeriesRemove, this);
            this.listenTo(this.plot, 'change:domainObject', this.trackPersistedConfig, this);

            var domainObject = this.plot.get('domainObject');
            if (domainObject.telemetry) {
                this.addTelemetryObject(domainObject);
            } else {
                this.watchTelemetryContainer(domainObject);
            }
        },
        trackPersistedConfig: function (domainObject) {
            domainObject.configuration.series.forEach(function (seriesConfig) {
                var series = this.byIdentifier(seriesConfig.identifier);
                if (series) {
                    series.set('persistedConfiguration', seriesConfig);
                }
            }, this);
        },
        watchTelemetryContainer: function (domainObject) {
            var composition = this.openmct.composition.get(domainObject);
            this.listenTo(composition, 'add', this.addTelemetryObject, this);
            this.listenTo(composition, 'remove', this.removeTelemetryObject, this);
            composition.load();
        },
        addTelemetryObject: function (domainObject) {
            var seriesConfig = {
                identifier: domainObject.identifier
            };

            var plotObject = this.plot.get('domainObject');
            if (plotObject.type === 'telemetry.plot.overlay') {
                var index = this.size();
                if (!plotObject.configuration.series[index]) {
                    this.openmct.objects.mutate(
                        plotObject,
                        'configuration.series[' + index + ']',
                        seriesConfig
                    );
                }
                seriesConfig = this.plot.get('domainObject').configuration.series[index];
                // Clone to prevent accidental mutation by ref.
                seriesConfig = JSON.parse(JSON.stringify(seriesConfig));
            }

            seriesConfig.persistedConfiguration =
                this.plot.getPersistedSeriesConfig(domainObject.identifier);

            this.add(new PlotSeries({
                model: seriesConfig,
                domainObject: domainObject,
                collection: this,
                openmct: this.openmct
            }));
        },
        removeTelemetryObject: function (identifier) {
            // TODO: properly locate in self (and parent configuration)
            // Instead of binding via index, which is not guaranteed because
            // edits could occur when plotcontroller is not instantiated.
            // This bug also extends to the plotOptions form which currently
            // relies on indexes that match.
            var plotObject = this.plot.get('domainObject');
            if (plotObject.type === 'telemetry.plot.overlay') {
                var index = _.findIndex(plotObject.configuration.series, function (s) {
                    return _.isEqual(identifier, s.identifier);
                });
                this.remove(this.at(index));
                // Because this is triggered by a composition change, we have
                // to defer mutation of our plot object, otherwise we might
                // mutate an outdated version of the plotObject.
                setTimeout(function () {
                    var newPlotObject = this.plot.get('domainObject');
                    var cSeries = newPlotObject.configuration.series.slice();
                    cSeries.splice(index, 1);
                    this.openmct.objects.mutate(newPlotObject, 'configuration.series', cSeries);
                }.bind(this));
            }
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
            series.destroy();
        },
        updateColorPalette: function (newColor, oldColor) {
            this.palette.remove(newColor);
            var seriesWithColor = this.filter(function (series) {
                return series.get('color') === newColor;
            })[0];
            if (!seriesWithColor) {
                this.palette.return(oldColor);
            }
        },
        byIdentifier: function (identifier) {
            return this.filter(function (series) {
                var seriesIdentifier = series.get('identifier');
                return seriesIdentifier.namespace === identifier.namespace &&
                    seriesIdentifier.key === identifier.key;
            })[0];
        }
    });

    return SeriesCollection;

});

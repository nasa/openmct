/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
import Model from "./Model";
import _ from "lodash";
/**
     * TODO: doc strings.
     */
export default class XAxisModel extends Model {
    initialize(options) {
        this.plot = options.plot;
        this.set('label', options.model.name || '');
        this.listenTo(this, 'change:xStats', this.calculateAutoscaleExtents, this);
        this.listenTo(this, 'change:range', (newValue, oldValue, model) => {
            if (!model.get('frozen')) {
                this.updateDisplayRange(newValue);
            }
        }, this);

        this.listenTo(this, 'change:frozen', (frozen, oldValue, model) => {
            if (!frozen) {
                model.set('range', this.get('range'));
            }
        }, this);

        if (this.get('range')) {
            this.set('range', this.get('range'));
        }

        this.listenTo(this, 'change:key', this.changeKey, this);
    }
    listenToSeriesCollection(seriesCollection) {
        this.seriesCollection = seriesCollection;
        this.listenTo(this.seriesCollection, 'add', (series => {
            this.trackSeries(series);
            this.updateFromSeries(this.seriesCollection);
        }), this);
        this.listenTo(this.seriesCollection, 'remove', (series => {
            this.untrackSeries(series);
            this.updateFromSeries(this.seriesCollection);
        }), this);
        this.seriesCollection.forEach(this.trackSeries, this);
        this.updateFromSeries(this.seriesCollection);
    }
    updateDisplayRange(range) {
        if (!this.get('autoscale')) {
            this.set('displayRange', range);
        }
    }
    toggleAutoscale(autoscale) {
        if (autoscale && this.has('stats')) {
            this.set('displayRange', this.applyPadding(this.get('stats')));
        } else {
            this.set('displayRange', this.get('range'));
        }
    }
    trackSeries(series) {
        this.listenTo(series, 'change:xStats', seriesStats => {
            if (!seriesStats) {
                this.resetStats();
            } else {
                this.updateStats(seriesStats);
            }
        });
        this.listenTo(series, 'change:xKey', () => {
            this.updateFromSeries(this.seriesCollection);
        });
    }
    untrackSeries(series) {
        this.stopListening(series);
        this.resetStats();
        this.updateFromSeries(this.seriesCollection);
    }
    updateFromSeries(series) {
        const plotModel = this.plot.get('domainObject');
        const label = _.get(plotModel, 'configuration.xAxis.label');
        const sampleSeries = series.first();
        if (!sampleSeries) {
            if (!label) {
                this.unset('label');
            }

            return;
        }

        const xKey = sampleSeries.get('xKey');
        const xMetadata = sampleSeries.metadata.value(xKey);
        const xFormat = sampleSeries.formats[xKey];
        this.set('format', xFormat.format.bind(xFormat));
        this.set('values', xMetadata.values);
        if (!label) {
            const labelName = series.map(function (s) {
                return s.metadata.value(s.get('xKey')).name;
            }).reduce(function (a, b) {
                if (a === undefined) {
                    return b;
                }

                if (a === b) {
                    return a;
                }

                return '';
            }, undefined);

            if (labelName) {
                this.set('label', labelName);

                return;
            }

            const labelUnits = series.map(function (s) {
                return s.metadata.value(s.get('xKey')).units;
            }).reduce(function (a, b) {
                if (a === undefined) {
                    return b;
                }

                if (a === b) {
                    return a;
                }

                return '';
            }, undefined);

            if (labelUnits) {
                this.set('label', labelUnits);

                return;
            }
        }
    }
    updateStats(seriesStats) {
        if (!this.get('autoscale')) {
            return;
        }

        if (!this.has('xStats')) {
            this.set('xStats', {
                min: seriesStats.minValue,
                max: seriesStats.maxValue
            });

            return;
        }

        const stats = this.get('xStats');
        let changed = false;
        if (stats.min > seriesStats.minValue) {
            changed = true;
            stats.min = seriesStats.minValue;
        }

        if (stats.max < seriesStats.maxValue) {
            changed = true;
            stats.max = seriesStats.maxValue;
        }

        if (changed) {
            this.set('xStats', {
                min: stats.min,
                max: stats.max
            });
        }
    }
    resetStats() {
        if (!this.get('autoscale')) {
            return;
        }

        this.unset('xStats');
        this.seriesCollection.forEach(function (series) {
            if (series.has('xStats')) {
                this.updateStats(series.get('xStats'));
            }
        }, this);
    }
    calculateAutoscaleExtents(newStats) {
        if (this.get('autoscale') && !this.get('frozen')) {
            if (!newStats) {
                this.unset('displayRange');
            } else {
                this.set('displayRange', this.applyPadding(newStats));
            }
        }
    }
    applyPadding(range) {
        let padding = Math.abs(range.max - range.min) * this.get('autoscalePadding');
        if (padding === 0) {
            padding = 1;
        }

        return {
            min: range.min - padding,
            max: range.max + padding
        };
    }
    changeKey(newKey) {
        this.set('autoscale', this.plot.openmct.time.timeSystem().key !== newKey);

        const series = this.plot.series.first();
        if (series) {
            const xMetadata = series.metadata.value(newKey);
            const xFormat = series.formats[newKey];
            this.set('label', xMetadata.name);
            this.set('format', xFormat.format.bind(xFormat));
        } else {
            this.set('format', function (x) {
                return x;
            });
            this.set('label', newKey);
        }

        this.plot.series.forEach(function (plotSeries) {
            plotSeries.set('xKey', newKey);
        });
    }
    resetSeries() {
        this.plot.series.forEach(function (plotSeries) {
            plotSeries.reset();
        });
    }
    resetSeriesStats() {
        this.plot.series.forEach(function (plotSeries) {
            plotSeries.resetStats();
        });
    }
    defaults(options) {
        const bounds = options.openmct.time.bounds();
        const timeSystem = options.openmct.time.timeSystem();
        const format = options.openmct.$injector.get('formatService')
            .getFormat(timeSystem.timeFormat);

        return {
            name: timeSystem.name,
            key: timeSystem.key,
            format: format.format.bind(format),
            range: {
                min: bounds.start,
                max: bounds.end
            },
            frozen: false,
            autoscale: false,
            autoscalePadding: 0.1
        };
    }
}

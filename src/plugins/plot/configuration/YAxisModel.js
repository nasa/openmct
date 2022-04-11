/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
import Model from './Model';

/**
 * YAxis model
 *
 * TODO: docstrings.
 *
 * has the following Model properties:
 *
 * `autoscale`: boolean, whether or not to autoscale.
 * `autoscalePadding`: float, percent of padding to display in plots.
 * `displayRange`: the current display range for the x Axis.
 * `format`: the formatter for the axis.
 * `frozen`: boolean, if true, displayRange will not be updated automatically.
 *           Used to temporarily disable automatic updates during user interaction.
 * `label`: label to display on axis.
 * `stats`: Min and Max Values of data, automatically updated by observing
 *          plot series.
 * `values`: for enumerated types, an array of possible display values.
 * `range`: the user-configured range to use for display, when autoscale is
 *         disabled.
 *
 * @extends {Model<YAxisModelType, YAxisModelOptions>}
 */
export default class YAxisModel extends Model {
    /**
     * @override
     * @param {import('./Model').ModelOptions<YAxisModelType, YAxisModelOptions>} options
     */
    initialize(options) {
        this.plot = options.plot;
        this.listenTo(this, 'change:stats', this.calculateAutoscaleExtents, this);
        this.listenTo(this, 'change:autoscale', this.toggleAutoscale, this);
        this.listenTo(this, 'change:autoscalePadding', this.updatePadding, this);
        this.listenTo(this, 'change:frozen', this.toggleFreeze, this);
        this.listenTo(this, 'change:range', this.updateDisplayRange, this);
        this.updateDisplayRange(this.get('range'));
    }
    /**
     * @param {import('./SeriesCollection').default} seriesCollection
     */
    listenToSeriesCollection(seriesCollection) {
        this.seriesCollection = seriesCollection;
        this.listenTo(this.seriesCollection, 'add', series => {
            this.trackSeries(series);
            this.updateFromSeries(this.seriesCollection);
        }, this);
        this.listenTo(this.seriesCollection, 'remove', series => {
            this.untrackSeries(series);
            this.updateFromSeries(this.seriesCollection);
        }, this);
        this.seriesCollection.forEach(this.trackSeries, this);
        this.updateFromSeries(this.seriesCollection);
    }
    updateDisplayRange(range) {
        if (!this.get('autoscale')) {
            this.set('displayRange', range);
        }
    }
    toggleFreeze(frozen) {
        if (!frozen) {
            this.toggleAutoscale(this.get('autoscale'));
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
    updatePadding(newPadding) {
        if (this.get('autoscale') && !this.get('frozen') && this.has('stats')) {
            this.set('displayRange', this.applyPadding(this.get('stats')));
        }
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
    updateStats(seriesStats) {
        if (!this.has('stats')) {
            this.set('stats', {
                min: seriesStats.minValue,
                max: seriesStats.maxValue
            });

            return;
        }

        const stats = this.get('stats');
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
            this.set('stats', {
                min: stats.min,
                max: stats.max
            });
        }
    }
    resetStats() {
        this.unset('stats');
        this.seriesCollection.forEach(series => {
            if (series.has('stats')) {
                this.updateStats(series.get('stats'));
            }
        });
    }
    /**
     * @param {import('./PlotSeries').default} series
     */
    trackSeries(series) {
        this.listenTo(series, 'change:stats', seriesStats => {
            if (!seriesStats) {
                this.resetStats();
            } else {
                this.updateStats(seriesStats);
            }
        });
        this.listenTo(series, 'change:yKey', () => {
            this.updateFromSeries(this.seriesCollection);
        });
    }
    untrackSeries(series) {
        this.stopListening(series);
        this.resetStats();
        this.updateFromSeries(this.seriesCollection);
    }
    toggleAutoscale(autoscale) {
        if (autoscale && this.has('stats')) {
            this.set('displayRange', this.applyPadding(this.get('stats')));
        } else {
            const range = this.get('range');

            if (range) {
                // If we already have a user-defined range, make sure it maps to the
                // range we'll actually use for the ticks.
                this.set('displayRange', range);
            } else {
                // Otherwise use the last known displayRange as the initial
                // values for the user-defined range, so that we don't end up
                // with any error from an undefined user range.
                this.set('range', this.get('displayRange'));
            }
        }
    }
    /**
     * Update yAxis format, values, and label from known series.
     * @param {import('./SeriesCollection').default} seriesCollection
     */
    updateFromSeries(seriesCollection) {
        const plotModel = this.plot.get('domainObject');
        const label = plotModel?.configuration?.yAxis?.label;
        const sampleSeries = seriesCollection.first();
        if (!sampleSeries) {
            if (!label) {
                this.unset('label');
            }

            return;
        }

        const yKey = sampleSeries.get('yKey');
        const yMetadata = sampleSeries.metadata.value(yKey);
        const yFormat = sampleSeries.formats[yKey];
        this.set('format', yFormat.format.bind(yFormat));
        this.set('values', yMetadata.values);
        if (!label) {
            const labelName = seriesCollection
                .map(s => (s.metadata ? s.metadata.value(s.get('yKey')).name : ''))
                .reduce((a, b) => {
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

            const labelUnits = seriesCollection
                .map(s => (s.metadata ? s.metadata.value(s.get('yKey')).units : ''))
                .reduce((a, b) => {
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
    /**
     * @override
     * @param {import('./Model').ModelOptions<YAxisModelType, YAxisModelOptions>} options
     * @returns {Partial<YAxisModelType>}
     */
    defaultModel(options) {
        return {
            frozen: false,
            autoscale: true,
            autoscalePadding: 0.1

            // 'range' is not specified here, it is undefined at first. When the
            // user turns off autoscale, the current 'displayRange' is used for
            // the initial value of 'range'.
        };
    }
}

/** @typedef {any} TODO */

/**
@typedef {import('./XAxisModel').AxisModelType & {
    autoscale: boolean
    autoscalePadding: number
    stats?: import('./XAxisModel').NumberRange
    values: Array<TODO>
}} YAxisModelType
*/

/**
@typedef {{
    plot: import('./PlotConfigurationModel').default
}} YAxisModelOptions
*/

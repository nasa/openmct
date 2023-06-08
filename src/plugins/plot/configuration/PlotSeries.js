/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
import _ from 'lodash';
import Model from './Model';
import { MARKER_SHAPES } from '../draw/MarkerShapes';
import configStore from '../configuration/ConfigStore';
import { symlog } from '../mathUtils';

/**
 * Plot series handle interpreting telemetry metadata for a single telemetry
 * object, querying for that data, and formatting it for display purposes.
 *
 * Plot series emit both collection events and model events:
 * `change` when any property changes
 * `change:<prop_name>` when a specific property changes.
 * `destroy`: when series is destroyed
 * `add`: whenever a data point is added to a series
 * `remove`: whenever a data point is removed from a series.
 * `reset`: whenever the collection is emptied.
 *
 * Plot series have the following Model properties:
 *
 * `name`: name of series.
 * `identifier`: the Open MCT identifier for the telemetry source for this
 *               series.
 * `xKey`: the telemetry value key for x values fetched from this series.
 * `yKey`: the telemetry value key for y values fetched from this series.
 * `interpolate`: interpolate method, either `undefined` (no interpolation),
 *                `linear` (points are connected via straight lines), or
 *                `stepAfter` (points are connected by steps).
 * `markers`: boolean, whether or not this series should render with markers.
 * `markerShape`: string, shape of markers.
 * `markerSize`: number, size in pixels of markers for this series.
 * `alarmMarkers`: whether or not to display alarm markers for this series.
 * `stats`: An object that tracks the min and max y values observed in this
 *          series.  This property is checked and updated whenever data is
 *          added.
 *
 * Plot series have the following instance properties:
 *
 * `metadata`: the Open MCT Telemetry Metadata Manager for the associated
 *             telemetry point.
 * `formats`: the Open MCT format map for this telemetry point.
 *
 * @extends {Model<PlotSeriesModelType, PlotSeriesModelOptions>}
 */
export default class PlotSeries extends Model {
  logMode = false;

  /**
     @param {import('./Model').ModelOptions<PlotSeriesModelType, PlotSeriesModelOptions>} options
     */
  constructor(options) {
    super(options);

    this.logMode = this.getLogMode(options);

    this.listenTo(this, 'change:xKey', this.onXKeyChange, this);
    this.listenTo(this, 'change:yKey', this.onYKeyChange, this);
    this.persistedConfig = options.persistedConfig;
    this.filters = options.filters;

    // Model.apply(this, arguments);
    this.onXKeyChange(this.get('xKey'));
    this.onYKeyChange(this.get('yKey'));

    this.unPlottableValues = [undefined, Infinity, -Infinity];
  }

  getLogMode(options) {
    const yAxisId = this.get('yAxisId');
    if (yAxisId === 1) {
      return options.collection.plot.model.yAxis.logMode;
    } else {
      const foundYAxis = options.collection.plot.model.additionalYAxes.find(
        (yAxis) => yAxis.id === yAxisId
      );

      return foundYAxis ? foundYAxis.logMode : false;
    }
  }

  /**
   * Set defaults for telemetry series.
   * @param {import('./Model').ModelOptions<PlotSeriesModelType, PlotSeriesModelOptions>} options
   * @override
   */
  defaultModel(options) {
    this.metadata = options.openmct.telemetry.getMetadata(options.domainObject);

    this.formats = options.openmct.telemetry.getFormatMap(this.metadata);

    //if the object is missing or doesn't have metadata for some reason
    let range = {};
    if (this.metadata) {
      range = this.metadata.valuesForHints(['range'])[0];
    }

    return {
      name: options.domainObject.name,
      unit: range.unit,
      xKey: options.collection.plot.xAxis.get('key'),
      yKey: range.key,
      markers: true,
      markerShape: 'point',
      markerSize: 2.0,
      alarmMarkers: true,
      limitLines: false,
      yAxisId: options.model.yAxisId || 1
    };
  }

  /**
   * Remove real-time subscription when destroyed.
   * @override
   */
  destroy() {
    super.destroy();
    this.openmct.time.off('bounds', this.updateLimits);

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    if (this.removeMutationListener) {
      this.removeMutationListener();
    }
  }

  /**
   * Set defaults for telemetry series.
   * @override
   * @param {import('./Model').ModelOptions<PlotSeriesModelType, PlotSeriesModelOptions>} options
   */
  initialize(options) {
    this.openmct = options.openmct;
    this.domainObject = options.domainObject;
    this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
    this.dataStoreId = `data-${options.collection.plot.id}-${this.keyString}`;
    this.updateSeriesData([]);
    this.limitEvaluator = this.openmct.telemetry.limitEvaluator(options.domainObject);
    this.limitDefinition = this.openmct.telemetry.limitDefinition(options.domainObject);
    this.limits = [];
    this.openmct.time.on('bounds', this.updateLimits);
    this.removeMutationListener = this.openmct.objects.observe(
      this.domainObject,
      'name',
      this.updateName.bind(this)
    );
  }

  /**
   * @param {Bounds} bounds
   */
  updateLimits(bounds) {
    this.emit('limitBounds', bounds);
  }

  /**
   * Fetch historical data and establish a realtime subscription.  Returns
   * a promise that is resolved when all connections have been successfully
   * established.
   *
   * @returns {Promise}
   */
  async fetch(options) {
    let strategy;

    if (this.model.interpolate !== 'none') {
      strategy = 'minmax';
    }

    options = Object.assign(
      {},
      {
        size: 1000,
        strategy,
        filters: this.filters
      },
      options || {}
    );

    if (!this.unsubscribe) {
      this.unsubscribe = this.openmct.telemetry.subscribe(this.domainObject, this.add.bind(this), {
        filters: this.filters
      });
    }

    try {
      const points = await this.openmct.telemetry.request(this.domainObject, options);
      const data = this.getSeriesData();
      // eslint-disable-next-line you-dont-need-lodash-underscore/concat
      const newPoints = _(data)
        .concat(points)
        .sortBy(this.getXVal)
        .uniq(true, (point) => [this.getXVal(point), this.getYVal(point)].join())
        .value();
      this.reset(newPoints);
    } catch (error) {
      console.warn('Error fetching data', error);
    }
  }

  updateName(name) {
    if (name !== this.get('name')) {
      this.set('name', name);
    }
  }
  /**
   * Update x formatter on x change.
   */
  onXKeyChange(xKey) {
    const format = this.formats[xKey];
    if (format) {
      this.getXVal = format.parse.bind(format);
    }
  }

  /**
   * Update y formatter on change, default to stepAfter interpolation if
   * y range is an enumeration.
   */
  onYKeyChange(newKey, oldKey) {
    if (newKey === oldKey) {
      return;
    }

    const valueMetadata = this.metadata.value(newKey);
    //TODO: Should we do this even if there is a persisted config?
    if (!this.persistedConfig || !this.persistedConfig.interpolate) {
      if (valueMetadata.format === 'enum') {
        this.set('interpolate', 'stepAfter');
      } else {
        this.set('interpolate', 'linear');
      }
    }

    this.evaluate = function (datum) {
      return this.limitEvaluator.evaluate(datum, valueMetadata);
    }.bind(this);
    this.set('unit', valueMetadata.unit);
    const format = this.formats[newKey];
    this.getYVal = (value) => {
      const y = format.parse(value);

      return this.logMode ? symlog(y, 10) : y;
    };
  }

  formatX(point) {
    return this.formats[this.get('xKey')].format(point);
  }

  formatY(point) {
    return this.formats[this.get('yKey')].format(point);
  }

  /**
   * Clear stats and recalculate from existing data.
   */
  resetStats() {
    this.unset('stats');
    this.getSeriesData().forEach(this.updateStats, this);
  }

  /**
   * Reset plot series.  If new data is provided, will add that
   * data to series after reset.
   */
  reset(newData) {
    this.updateSeriesData([]);
    this.resetStats();
    this.emit('reset');
    if (newData) {
      newData.forEach(function (point) {
        this.add(point, true);
      }, this);
    }
  }
  /**
   * Return the point closest to a given x value.
   */
  nearestPoint(xValue) {
    const insertIndex = this.sortedIndex(xValue);
    const data = this.getSeriesData();
    const lowPoint = data[insertIndex - 1];
    const highPoint = data[insertIndex];
    const indexVal = this.getXVal(xValue);
    const lowDistance = lowPoint ? indexVal - this.getXVal(lowPoint) : Number.POSITIVE_INFINITY;
    const highDistance = highPoint ? this.getXVal(highPoint) - indexVal : Number.POSITIVE_INFINITY;
    const nearestPoint = highDistance < lowDistance ? highPoint : lowPoint;

    return nearestPoint;
  }
  /**
   * Override this to implement plot series loading functionality.  Must return
   * a promise that is resolved when loading is completed.
   *
   * @returns {Promise}
   */
  async load(options) {
    await this.fetch(options);
    this.emit('load');
    const limitsResponse = await this.limitDefinition.limits();
    this.limits = [];
    if (limitsResponse) {
      this.limits = limitsResponse;
    }

    this.emit('limits', this);
    this.emit('change:limitLines', this);
  }

  /**
   * Find the insert index for a given point to maintain sort order.
   * @private
   */
  sortedIndex(point) {
    return _.sortedIndexBy(this.getSeriesData(), point, this.getXVal);
  }
  /**
   * Update min/max stats for the series.
   * @private
   */
  updateStats(point) {
    const value = this.getYVal(point);
    let stats = this.get('stats');
    let changed = false;
    if (!stats) {
      if ([Infinity, -Infinity].includes(value)) {
        return;
      }

      stats = {
        minValue: value,
        minPoint: point,
        maxValue: value,
        maxPoint: point
      };
      changed = true;
    } else {
      if (stats.maxValue < value && value !== Infinity) {
        stats.maxValue = value;
        stats.maxPoint = point;
        changed = true;
      }

      if (stats.minValue > value && value !== -Infinity) {
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
  }

  /**
   * Add a point to the data array while maintaining the sort order of
   * the array and preventing insertion of points with a duplicate x
   * value. Can provide an optional argument to append a point without
   * maintaining sort order and dupe checks, which improves performance
   * when adding an array of points that are already properly sorted.
   *
   * @private
   * @param {Object} point a telemetry datum.
   * @param {Boolean} [appendOnly] default false, if true will append
   *                  a point to the end without dupe checking.
   */
  add(point, appendOnly) {
    let data = this.getSeriesData();
    let insertIndex = data.length;
    const currentYVal = this.getYVal(point);
    const lastYVal = this.getYVal(data[insertIndex - 1]);

    if (this.isValueInvalid(currentYVal) && this.isValueInvalid(lastYVal)) {
      console.warn('[Plot] Invalid Y Values detected');

      return;
    }

    if (!appendOnly) {
      insertIndex = this.sortedIndex(point);
      if (this.getXVal(data[insertIndex]) === this.getXVal(point)) {
        return;
      }

      if (this.getXVal(data[insertIndex - 1]) === this.getXVal(point)) {
        return;
      }
    }

    this.updateStats(point);
    point.mctLimitState = this.evaluate(point);
    data.splice(insertIndex, 0, point);
    this.updateSeriesData(data);
    this.emit('add', point, insertIndex, this);
  }

  /**
   *
   * @private
   */
  isValueInvalid(val) {
    return Number.isNaN(val) || this.unPlottableValues.includes(val);
  }

  /**
   * Remove a point from the data array and notify listeners.
   * @private
   */
  remove(point) {
    let data = this.getSeriesData();
    const index = data.indexOf(point);
    data.splice(index, 1);
    this.updateSeriesData(data);
    this.emit('remove', point, index, this);
  }
  /**
   * Purges records outside a given x range.  Changes removal method based
   * on number of records to remove: for large purge, reset data and
   * rebuild array.  for small purge, removes points and emits updates.
   *
   * @public
   * @param {Object} range
   * @param {number} range.min minimum x value to keep
   * @param {number} range.max maximum x value to keep.
   */
  purgeRecordsOutsideRange(range) {
    const startIndex = this.sortedIndex(range.min);
    const endIndex = this.sortedIndex(range.max) + 1;
    let data = this.getSeriesData();
    const pointsToRemove = startIndex + (data.length - endIndex + 1);
    if (pointsToRemove > 0) {
      if (pointsToRemove < 1000) {
        data.slice(0, startIndex).forEach(this.remove, this);
        data.slice(endIndex, data.length).forEach(this.remove, this);
        this.updateSeriesData(data);
        this.resetStats();
      } else {
        const newData = this.getSeriesData().slice(startIndex, endIndex);
        this.reset(newData);
      }
    }
  }
  /**
   * Updates filters, clears the plot series, unsubscribes and resubscribes
   * @public
   */
  updateFiltersAndRefresh(updatedFilters) {
    if (updatedFilters === undefined) {
      return;
    }

    let deepCopiedFilters = JSON.parse(JSON.stringify(updatedFilters));

    if (this.filters && !_.isEqual(this.filters, deepCopiedFilters)) {
      this.filters = deepCopiedFilters;
      this.reset();
      if (this.unsubscribe) {
        this.unsubscribe();
        delete this.unsubscribe;
      }

      this.fetch();
    } else {
      this.filters = deepCopiedFilters;
    }
  }
  getDisplayRange(xKey) {
    const unsortedData = this.getSeriesData();
    this.updateSeriesData([]);
    unsortedData.forEach((point) => this.add(point, false));

    let data = this.getSeriesData();
    const minValue = this.getXVal(data[0]);
    const maxValue = this.getXVal(data[data.length - 1]);

    return {
      min: minValue,
      max: maxValue
    };
  }
  markerOptionsDisplayText() {
    const showMarkers = this.get('markers');
    if (!showMarkers) {
      return 'Disabled';
    }

    const markerShapeKey = this.get('markerShape');
    const markerShape = MARKER_SHAPES[markerShapeKey].label;
    const markerSize = this.get('markerSize');

    return `${markerShape}: ${markerSize}px`;
  }
  nameWithUnit() {
    let unit = this.get('unit');

    return this.get('name') + (unit ? ' ' + unit : '');
  }

  /**
   * Update the series data with the given value.
   */
  updateSeriesData(data) {
    configStore.add(this.dataStoreId, data);
  }

  /**
     * Update the series data with the given value.
     * This return type definition is totally wrong, only covers sinwave generator. It needs to be generic.
     * @return-example {Array<{
            cos: number
            sin: number
            mctLimitState: {
                cssClass: string
                high: number
                low: {sin: number, cos: number}
                name: string
            }
            utc: number
            wavelength: number
            yesterday: number
        }>}
     */
  getSeriesData() {
    return configStore.get(this.dataStoreId) || [];
  }
}

/** @typedef {any} TODO */

/** @typedef {{key: string, namespace: string}} Identifier */

/**
@typedef {{
    identifier: Identifier
    name: string
    unit: string
    xKey: string
    yKey: string
    markers: boolean
    markerShape: keyof typeof MARKER_SHAPES
    markerSize: number
    alarmMarkers: boolean
    limitLines: boolean
    interpolate: boolean
    stats: TODO
}} PlotSeriesModelType
*/

/**
@typedef {{
    model: PlotSeriesModelType
    collection: import('./SeriesCollection').default
    persistedConfig: PlotSeriesModelType
    filters: TODO
}} PlotSeriesModelOptions
*/

/**
@typedef {import('@/api/time/TimeContext').Bounds} Bounds
*/

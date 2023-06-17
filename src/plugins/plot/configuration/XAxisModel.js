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
import Model from './Model';

/**
 * @extends {Model<XAxisModelType, XAxisModelOptions>}
 */
export default class XAxisModel extends Model {
  // Despite providing template types to the Model class, we still need to
  // re-define the type of the following initialize() method's options arg. Tracking
  // issue for this: https://github.com/microsoft/TypeScript/issues/32082
  // When they fix it, we can remove the `@param` we have here.
  /**
   * @override
   * @param {import('./Model').ModelOptions<XAxisModelType, XAxisModelOptions>} options
   */
  initialize(options) {
    this.plot = options.plot;

    // This is a type assertion for TypeScript, this error is not thrown in practice.
    if (!options.model) {
      throw new Error('Not a collection model.');
    }

    this.set('label', options.model.name || '');

    this.on('change:range', (newValue) => {
      if (!this.get('frozen')) {
        this.set('displayRange', newValue);
      }
    });

    this.on('change:frozen', (frozen) => {
      if (!frozen) {
        this.set('range', this.get('range'));
      }
    });

    if (this.get('range')) {
      this.set('range', this.get('range'));
    }

    this.listenTo(this, 'change:key', this.changeKey, this);
  }

  /**
   * @param {string} newKey
   */
  changeKey(newKey) {
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
  /**
   * @param {import('./Model').ModelOptions<XAxisModelType, XAxisModelOptions>} options
   * @override
   */
  defaultModel(options) {
    const bounds = options.openmct.time.bounds();
    const timeSystem = options.openmct.time.timeSystem();
    const format = options.openmct.telemetry.getFormatter(timeSystem.timeFormat);

    /** @type {XAxisModelType} */
    const defaultModel = {
      name: timeSystem.name,
      key: timeSystem.key,
      format: format.format.bind(format),
      range: {
        min: bounds.start,
        max: bounds.end
      },
      frozen: false
    };

    return defaultModel;
  }
}

/** @typedef {any} TODO */

/** @typedef {TODO} OpenMCT */

/**
@typedef {{
    min: number
    max: number
}} NumberRange
*/

/**
@typedef {import("./Model").ModelType<{
    range?: NumberRange
    displayRange: NumberRange
    frozen: boolean
    label: string
    format: (n: number) => string
    values: Array<TODO>
}>} AxisModelType
*/

/**
@typedef {AxisModelType & {
    name: string
    key: string
}} XAxisModelType
*/

/**
@typedef {{
    plot: import('./PlotConfigurationModel').default
}} XAxisModelOptions
*/

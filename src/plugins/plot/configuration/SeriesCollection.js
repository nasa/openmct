/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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

import Color from '@/ui/color/Color';
import ColorPalette from '@/ui/color/ColorPalette';

import Collection from './Collection.js';
import PlotSeries from './PlotSeries.js';

/**
 * @extends {Collection<SeriesCollectionModelType, SeriesCollectionOptions>}
 */
export default class SeriesCollection extends Collection {
  /**
    @override
    @param {import('./Model').ModelOptions<SeriesCollectionModelType, SeriesCollectionOptions>} options
    */
  initialize(options) {
    super.initialize(options);
    this.modelClass = PlotSeries;
    this.plot = options.plot;
    this.openmct = options.openmct;
    this.palette = options.palette || new ColorPalette();
    this.listenTo(this, 'add', this.onSeriesAdd, this);
    this.listenTo(this, 'remove', this.onSeriesRemove, this);
    this.listenTo(this.plot, 'change:domainObject', this.trackPersistedConfig, this);

    const domainObject = this.plot.get('domainObject');

    if (this.openmct.objects.isMissing(domainObject)) {
      return;
    }

    if (domainObject.telemetry) {
      this.addTelemetryObject(domainObject);
    } else {
      this.watchTelemetryContainer(domainObject);
    }
  }
  trackPersistedConfig(domainObject) {
    domainObject.configuration.series.forEach(function (seriesConfig) {
      const series = this.byIdentifier(seriesConfig.identifier);
      if (series) {
        series.persistedConfig = seriesConfig;
        if (!series.persistedConfig.yAxisId) {
          return;
        }

        if (series.get('yAxisId') !== series.persistedConfig.yAxisId) {
          series.set('yAxisId', series.persistedConfig.yAxisId);
        }
      }
    }, this);
  }
  watchTelemetryContainer(domainObject) {
    if (domainObject.type === 'telemetry.plot.stacked') {
      return;
    }

    const composition = this.openmct.composition.get(domainObject);
    this.listenTo(composition, 'add', this.addTelemetryObject, this);
    this.listenTo(composition, 'remove', this.removeTelemetryObject, this);
    composition.load();
  }
  addTelemetryObject(domainObject, index) {
    let seriesConfig = this.plot.getPersistedSeriesConfig(domainObject.identifier);
    const filters = this.plot.getPersistedFilters(domainObject.identifier);
    const plotObject = this.plot.get('domainObject');

    if (!seriesConfig) {
      seriesConfig = {
        identifier: domainObject.identifier
      };

      if (plotObject.type === 'telemetry.plot.overlay') {
        this.openmct.objects.mutate(
          plotObject,
          'configuration.series[' + this.size() + ']',
          seriesConfig
        );
        seriesConfig = this.plot.getPersistedSeriesConfig(domainObject.identifier);
      }
    }

    // Clone to prevent accidental mutation by ref.
    seriesConfig = JSON.parse(JSON.stringify(seriesConfig));

    if (!seriesConfig) {
      throw 'not possible';
    }

    this.add(
      new PlotSeries({
        model: seriesConfig,
        domainObject: domainObject,
        openmct: this.openmct,
        collection: this,
        persistedConfig: this.plot.getPersistedSeriesConfig(domainObject.identifier),
        filters: filters
      })
    );
  }
  removeTelemetryObject(identifier) {
    const plotObject = this.plot.get('domainObject');
    if (plotObject.type === 'telemetry.plot.overlay') {
      const persistedIndex = plotObject.configuration.series.findIndex((s) => {
        return _.isEqual(identifier, s.identifier);
      });

      const configIndex = this.models.findIndex((m) => {
        return _.isEqual(m.domainObject.identifier, identifier);
      });

      /*
      when cancelling out of edit mode, the config store and domain object are out of sync
      thus it is necessary to check both and remove the models that are no longer in composition
      */
      if (persistedIndex === -1) {
        this.remove(this.at(configIndex));
      } else {
        this.remove(this.at(persistedIndex));
        // Because this is triggered by a composition change, we have
        // to defer mutation of our plot object, otherwise we might
        // mutate an outdated version of the plotObject.
        setTimeout(
          function () {
            const newPlotObject = this.plot.get('domainObject');
            const cSeries = newPlotObject.configuration.series.slice();
            cSeries.splice(persistedIndex, 1);
            this.openmct.objects.mutate(newPlotObject, 'configuration.series', cSeries);
          }.bind(this)
        );
      }
    }
  }
  onSeriesAdd(series) {
    let seriesColor = series.get('color');
    if (seriesColor) {
      if (!(seriesColor instanceof Color)) {
        seriesColor = Color.fromHexString(seriesColor);
        series.set('color', seriesColor);
      }

      this.palette.remove(seriesColor);
    } else {
      series.set('color', this.palette.getNextColor());
    }

    this.listenTo(series, 'change:color', this.updateColorPalette, this);
  }
  onSeriesRemove(series) {
    this.palette.return(series.get('color'));
    this.stopListening(series);
    series.destroy();
  }
  updateColorPalette(newColor, oldColor) {
    this.palette.remove(newColor);
    const seriesWithColor = this.filter(function (series) {
      return series.get('color') === newColor;
    })[0];
    if (!seriesWithColor) {
      this.palette.return(oldColor);
    }
  }
  byIdentifier(identifier) {
    return this.filter(function (series) {
      const seriesIdentifier = series.get('identifier');

      return (
        seriesIdentifier.namespace === identifier.namespace &&
        seriesIdentifier.key === identifier.key
      );
    })[0];
  }

  destroy() {
    super.destroy();
    this.plot = undefined;
    this.stopListening();
  }
}

/**
@typedef {PlotSeries} SeriesCollectionModelType
*/

/**
@typedef {{
    plot: import('./PlotConfigurationModel').default
}} SeriesCollectionOptions
*/

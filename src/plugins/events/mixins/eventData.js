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

const DEFAULT_DURATION_FORMATTER = 'duration';
import { TIME_CONTEXT_EVENTS } from '../../../api/time/constants.js';

export default {
  inject: ['openmct', 'domainObject', 'objectPath'],
  mounted() {
    // listen
    this.boundsChanged = this.boundsChanged.bind(this);
    this.timeSystemChanged = this.timeSystemChanged.bind(this);
    this.setDataTimeContext = this.setDataTimeContext.bind(this);
    this.openmct.objectViews.on('clearData', this.dataCleared);

    // Get metadata and formatters
    this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
    this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);

    this.durationFormatter = this.getFormatter(
      this.timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER
    );

    // initialize
    this.timeKey = this.timeSystem.key;
    this.timeFormatter = this.getFormatter(this.timeKey);
    this.setDataTimeContext();
    this.loadTelemetry();
  },
  beforeUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
      delete this.unsubscribe;
    }

    this.stopFollowingDataTimeContext();
    this.openmct.objectViews.off('clearData', this.dataCleared);

    this.telemetryCollection.off('add', this.dataAdded);
    this.telemetryCollection.off('remove', this.dataRemoved);
    this.telemetryCollection.off('clear', this.dataCleared);

    this.telemetryCollection.destroy();
  },
  methods: {
    dataAdded(addedItems, addedItemIndices) {
      const normalizedDataToAdd = addedItems.map((datum) => this.normalizeDatum(datum));
      let newEventHistory = this.eventHistory.slice();
      normalizedDataToAdd.forEach((datum, index) => {
        newEventHistory.splice(addedItemIndices[index] ?? -1, 0, datum);
      });
      //Assign just once so eventHistory watchers don't get called too often
      this.eventHistory = newEventHistory;
    },
    dataCleared() {
      this.eventHistory = [];
    },
    dataRemoved(removed) {
      const removedTimestamps = {};
      removed.forEach((_removed) => {
        const removedTimestamp = this.parseTime(_removed);
        removedTimestamps[removedTimestamp] = true;
      });

      this.eventHistory = this.eventHistory.filter((event) => {
        const eventTimestamp = this.parseTime(event);

        return !removedTimestamps[eventTimestamp];
      });
    },
    setDataTimeContext() {
      this.stopFollowingDataTimeContext();
      this.timeContext = this.openmct.time.getContextForView(this.objectPath);
      this.timeContext.on(TIME_CONTEXT_EVENTS.boundsChanged, this.boundsChanged);
      this.timeContext.on(TIME_CONTEXT_EVENTS.timeSystemChanged, this.timeSystemChanged);
    },
    stopFollowingDataTimeContext() {
      if (this.timeContext) {
        this.timeContext.off(TIME_CONTEXT_EVENTS.boundsChanged, this.boundsChanged);
        this.timeContext.off(TIME_CONTEXT_EVENTS.timeSystemChanged, this.timeSystemChanged);
      }
    },
    formatEventUrl(datum) {
      if (!datum) {
        return;
      }

      return this.eventFormatter.format(datum);
    },
    formatEventThumbnailUrl(datum) {
      if (!datum || !this.eventThumbnailFormatter) {
        return;
      }

      return this.eventThumbnailFormatter.format(datum);
    },
    formatTime(datum) {
      if (!datum) {
        return;
      }

      const dateTimeStr = this.timeFormatter.format(datum);

      // Replace ISO "T" with a space to allow wrapping
      return dateTimeStr.replace('T', ' ');
    },
    getEventDownloadName(datum) {
      let eventDownloadName = '';
      if (datum) {
        const key = this.eventDownloadNameMetadataValue.key;
        eventDownloadName = datum[key];
      }

      return eventDownloadName;
    },
    parseTime(datum) {
      if (!datum) {
        return;
      }

      return this.timeFormatter.parse(datum);
    },
    loadTelemetry() {
      this.telemetryCollection = this.openmct.telemetry.requestCollection(this.domainObject, {
        timeContext: this.timeContext
      });
      this.telemetryCollection.on('add', this.dataAdded);
      this.telemetryCollection.on('remove', this.dataRemoved);
      this.telemetryCollection.on('clear', this.dataCleared);
      this.telemetryCollection.load();
    },
    boundsChanged(bounds, isTick) {
      if (isTick) {
        return;
      }

      this.bounds = bounds;
    },
    timeSystemChanged() {
      this.timeSystem = this.timeContext.getTimeSystem();
      this.timeKey = this.timeSystem.key;
      this.timeFormatter = this.getFormatter(this.timeKey);
      this.durationFormatter = this.getFormatter(
        this.timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER
      );
    },
    normalizeDatum(datum) {
      const formattedTime = this.formatTime(datum);
      const time = this.parseTime(formattedTime);

      return {
        ...datum,
        formattedTime,
        time
      };
    },
    getFormatter(key) {
      const metadataValue = this.metadata.value(key) || { format: key };
      const valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

      return valueFormatter;
    }
  }
};

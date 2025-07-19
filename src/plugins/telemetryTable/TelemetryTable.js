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

import { EventEmitter } from 'eventemitter3';
import _ from 'lodash';

import StalenessUtils from '../../utils/staleness.js';
import TableRowCollection from './collections/TableRowCollection.js';
import { MODE } from './constants.js';
import TelemetryTableColumn from './TelemetryTableColumn.js';
import TelemetryTableConfiguration from './TelemetryTableConfiguration.js';
import TelemetryTableNameColumn from './TelemetryTableNameColumn.js';
import TelemetryTableRow from './TelemetryTableRow.js';
import TelemetryTableUnitColumn from './TelemetryTableUnitColumn.js';

export default class TelemetryTable extends EventEmitter {
  constructor(domainObject, openmct, options) {
    super();

    this.domainObject = domainObject;
    this.openmct = openmct;
    this.tableComposition = undefined;
    this.datumCache = [];
    this.configuration = new TelemetryTableConfiguration(domainObject, openmct, options);
    this.telemetryMode = this.configuration.getTelemetryMode();
    this.rowLimit = this.configuration.getRowLimit();
    this.paused = false;
    this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);

    this.telemetryObjects = {};
    this.subscribedStaleObjects = new Map();
    this.telemetryCollections = {};
    this.delayedActions = [];
    this.outstandingRequests = 0;
    this.stalenessSubscription = {};

    this.addTelemetryObject = this.addTelemetryObject.bind(this);
    this.removeTelemetryObject = this.removeTelemetryObject.bind(this);
    this.removeTelemetryCollection = this.removeTelemetryCollection.bind(this);
    this.incrementOutstandingRequests = this.incrementOutstandingRequests.bind(this);
    this.decrementOutstandingRequests = this.decrementOutstandingRequests.bind(this);
    this.resetRowsFromAllData = this.resetRowsFromAllData.bind(this);
    this.isTelemetryObject = this.isTelemetryObject.bind(this);
    this.updateFilters = this.updateFilters.bind(this);
    this.clearData = this.clearData.bind(this);
    this.buildOptionsFromConfiguration = this.buildOptionsFromConfiguration.bind(this);

    this.filterObserver = undefined;

    this.createTableRowCollections();
    this.resubscribeToStaleness = this.resubscribeAllObjectsToStaleness.bind(this);
    this.openmct.time.on('clockChanged', this.resubscribeToStaleness);
  }

  /**
   * @private
   */
  addNameColumn(telemetryObject, metadataValues) {
    let metadatum = metadataValues.find((m) => m.key === 'name');
    if (!metadatum) {
      metadatum = {
        format: 'string',
        key: 'name',
        name: 'Name'
      };
    }

    const column = new TelemetryTableNameColumn(this.openmct, telemetryObject, metadatum);

    this.configuration.addSingleColumnForObject(telemetryObject, column);
  }

  initialize() {
    if (this.domainObject.type === 'table') {
      this.filterObserver = this.openmct.objects.observe(
        this.domainObject,
        'configuration.filters',
        this.updateFilters
      );
      this.filters = this.domainObject.configuration.filters;
      this.loadComposition();
    } else {
      this.addTelemetryObject(this.domainObject);
    }
  }

  updateTelemetryMode(mode) {
    if (this.telemetryMode === mode) {
      return;
    }

    this.telemetryMode = mode;

    this.updateRowLimit();

    this.clearAndResubscribe();
  }

  updateRowLimit(rowLimit) {
    if (rowLimit) {
      this.rowLimit = rowLimit;
    }

    if (this.telemetryMode === MODE.PERFORMANCE) {
      this.tableRows.setLimit(this.rowLimit);
    } else {
      this.tableRows.removeLimit();
    }
  }

  createTableRowCollections() {
    this.tableRows = new TableRowCollection();

    const sortOptions = this.configuration.getSortOptions();

    this.updateRowLimit();

    this.tableRows.sortBy(sortOptions);
    this.tableRows.on('resetRowsFromAllData', this.resetRowsFromAllData);
  }

  loadComposition() {
    this.tableComposition = this.openmct.composition.get(this.domainObject);

    if (this.tableComposition !== undefined) {
      this.tableComposition.load().then((composition) => {
        composition = composition.filter(this.isTelemetryObject);
        composition.forEach(this.addTelemetryObject);

        this.tableComposition.on('add', this.addTelemetryObject);
        this.tableComposition.on('remove', this.removeTelemetryObject);
      });
    }
  }

  addTelemetryObject(telemetryObject) {
    this.addColumnsForObject(telemetryObject, true);

    const keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
    let requestOptions = this.buildOptionsFromConfiguration(telemetryObject);
    let columnMap = this.getColumnMapForObject(keyString);
    let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);

    const telemetryProcessor = this.getTelemetryProcessor(keyString, columnMap, limitEvaluator);
    const telemetryRemover = this.getTelemetryRemover();

    this.removeTelemetryCollection(keyString);

    let sortOptions = this.configuration.getSortOptions();
    requestOptions.order = sortOptions.direction;

    if (this.telemetryMode === MODE.PERFORMANCE) {
      requestOptions.size = this.rowLimit;
      requestOptions.enforceSize = true;
    }

    this.telemetryCollections[keyString] = this.openmct.telemetry.requestCollection(
      telemetryObject,
      requestOptions
    );

    this.telemetryCollections[keyString].on('requestStarted', this.incrementOutstandingRequests);
    this.telemetryCollections[keyString].on('requestEnded', this.decrementOutstandingRequests);
    this.telemetryCollections[keyString].on('remove', telemetryRemover);
    this.telemetryCollections[keyString].on('add', telemetryProcessor);
    this.telemetryCollections[keyString].on('clear', this.clearData);
    this.telemetryCollections[keyString].load();

    this.subscribeToStaleness(telemetryObject);

    this.telemetryObjects[keyString] = {
      telemetryObject,
      keyString,
      requestOptions,
      columnMap,
      limitEvaluator
    };

    this.emit('object-added', telemetryObject);
  }

  resubscribeAllObjectsToStaleness() {
    if (!this.subscribedStaleObjects || this.subscribedStaleObjects.size < 1) {
      return;
    }
    for (const [, telemetryObject] of this.subscribedStaleObjects) {
      this.subscribeToStaleness(telemetryObject);
    }
  }

  subscribeToStaleness(domainObject) {
    const keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
    if (this.stalenessSubscription?.[keyString]) {
      this.unsubscribeFromStaleness(domainObject.identifier);
    }

    this.stalenessSubscription[keyString] = {};
    this.stalenessSubscription[keyString].stalenessUtils = new StalenessUtils(
      this.openmct,
      domainObject
    );
    this.openmct.telemetry.isStale(domainObject).then((stalenessResponse) => {
      if (stalenessResponse !== undefined) {
        this.handleStaleness(keyString, stalenessResponse);
      }
    });
    const stalenessSubscription = this.openmct.telemetry.subscribeToStaleness(
      domainObject,
      (stalenessResponse) => {
        this.handleStaleness(keyString, stalenessResponse);
      }
    );
    this.subscribedStaleObjects.set(keyString, domainObject);

    this.stalenessSubscription[keyString].unsubscribe = stalenessSubscription;
  }

  handleStaleness(keyString, stalenessResponse, skipCheck = false) {
    if (
      skipCheck ||
      this.stalenessSubscription[keyString].stalenessUtils.shouldUpdateStaleness(
        stalenessResponse,
        keyString
      )
    ) {
      this.emit('telemetry-staleness', {
        keyString,
        stalenessResponse: stalenessResponse
      });
    }
  }

  getTelemetryProcessor(keyString, columnMap, limitEvaluator) {
    return (telemetry) => {
      //Check that telemetry object has not been removed since telemetry was requested.
      if (!this.telemetryObjects[keyString]) {
        return;
      }

      const metadataValue = this.openmct.telemetry
        .getMetadata(this.telemetryObjects[keyString].telemetryObject)
        .getUseToUpdateInPlaceValue();

      let telemetryRows = telemetry.map(
        (datum) =>
          new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator, metadataValue?.key)
      );

      if (this.paused) {
        this.delayedActions.push(this.tableRows.addRows.bind(this, telemetryRows, 'add'));
      } else {
        this.tableRows.addRows(telemetryRows);
      }
    };
  }

  getTelemetryRemover() {
    return (telemetry) => {
      if (this.paused) {
        this.delayedActions.push(this.tableRows.removeRowsByData.bind(this, telemetry));
      } else {
        this.tableRows.removeRowsByData(telemetry);
      }
    };
  }

  /**
   * @private
   */
  incrementOutstandingRequests() {
    if (this.outstandingRequests === 0) {
      this.emit('outstanding-requests', true);
    }

    this.outstandingRequests++;
  }

  /**
   * @private
   */
  decrementOutstandingRequests() {
    this.outstandingRequests--;

    if (this.outstandingRequests === 0) {
      this.emit('outstanding-requests', false);
    }
  }

  // will pull all necessary information for all existing bounded telemetry
  // and pass to table row collection to reset without making any new requests
  // triggered by filtering
  resetRowsFromAllData() {
    let allRows = [];

    Object.keys(this.telemetryCollections).forEach((keyString) => {
      let { columnMap, limitEvaluator } = this.telemetryObjects[keyString];

      const metadataValue = this.openmct.telemetry
        .getMetadata(this.telemetryObjects[keyString].telemetryObject)
        .getUseToUpdateInPlaceValue();

      this.telemetryCollections[keyString].getAll().forEach((datum) => {
        allRows.push(
          new TelemetryTableRow(datum, columnMap, keyString, limitEvaluator, metadataValue?.key)
        );
      });
    });

    this.tableRows.clearRowsFromTableAndFilter(allRows);
  }

  updateFilters(updatedFilters) {
    let deepCopiedFilters = JSON.parse(JSON.stringify(updatedFilters));

    if (this.filters && !_.isEqual(this.filters, deepCopiedFilters)) {
      this.filters = deepCopiedFilters;
      this.tableRows.clear();
      this.clearAndResubscribe();
    } else {
      this.filters = deepCopiedFilters;
    }
  }

  clearAndResubscribe() {
    let objectKeys = Object.keys(this.telemetryObjects);

    this.tableRows.clear();
    objectKeys.forEach((keyString) => {
      this.addTelemetryObject(this.telemetryObjects[keyString].telemetryObject);
    });
  }

  removeTelemetryObject(objectIdentifier) {
    const keyString = this.openmct.objects.makeKeyString(objectIdentifier);

    this.configuration.removeColumnsForObject(objectIdentifier, true);
    this.tableRows.removeRowsByObject(keyString);

    this.removeTelemetryCollection(keyString);
    delete this.telemetryObjects[keyString];

    this.emit('object-removed', objectIdentifier);

    this.unsubscribeFromStaleness(objectIdentifier);
  }

  unsubscribeFromStaleness(objectIdentifier) {
    const keyString = this.openmct.objects.makeKeyString(objectIdentifier);
    const SKIP_CHECK = true;

    this.stalenessSubscription[keyString].unsubscribe();
    this.stalenessSubscription[keyString].stalenessUtils.destroy();
    this.handleStaleness(keyString, { isStale: false }, SKIP_CHECK);
    delete this.stalenessSubscription[keyString];
  }

  clearData() {
    this.tableRows.clear();
    this.emit('refresh');
  }

  addColumnsForObject(telemetryObject) {
    const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
    let metadataValues = metadata.values();

    this.addNameColumn(telemetryObject, metadataValues);
    metadataValues.forEach((metadatum) => {
      if (metadatum.key === 'name' || metadata.isInPlaceUpdateValue(metadatum)) {
        return;
      }

      let column = this.createColumn(metadatum);
      this.configuration.addSingleColumnForObject(telemetryObject, column);
      // add units column if available
      if (metadatum.unit !== undefined) {
        let unitColumn = this.createUnitColumn(metadatum);
        this.configuration.addSingleColumnForObject(telemetryObject, unitColumn);
      }
    });
  }

  getColumnMapForObject(objectKeyString) {
    let columns = this.configuration.getColumns();

    if (columns[objectKeyString]) {
      return columns[objectKeyString].reduce((map, column) => {
        map[column.getKey()] = column;

        return map;
      }, {});
    }

    return {};
  }

  buildOptionsFromConfiguration(telemetryObject) {
    let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
    let filters =
      this.domainObject.configuration &&
      this.domainObject.configuration.filters &&
      this.domainObject.configuration.filters[keyString];

    return { filters } || {};
  }

  createColumn(metadatum) {
    return new TelemetryTableColumn(this.openmct, metadatum);
  }

  createUnitColumn(metadatum) {
    return new TelemetryTableUnitColumn(this.openmct, metadatum);
  }

  isTelemetryObject(domainObject) {
    return Object.prototype.hasOwnProperty.call(domainObject, 'telemetry');
  }

  sortBy(sortOptions) {
    this.configuration.setSortOptions(sortOptions);

    if (this.telemetryMode === MODE.PERFORMANCE) {
      this.tableRows.setSortOptions(sortOptions);
      this.clearAndResubscribe();
    } else {
      this.tableRows.sortBy(sortOptions);
    }
  }

  runDelayedActions() {
    this.delayedActions.forEach((action) => action());
    this.delayedActions = [];
  }

  removeTelemetryCollection(keyString) {
    if (this.telemetryCollections[keyString]) {
      this.telemetryCollections[keyString].destroy();
      this.telemetryCollections[keyString] = undefined;
      delete this.telemetryCollections[keyString];
    }
  }

  pause() {
    this.paused = true;
  }

  unpause() {
    this.paused = false;
    this.runDelayedActions();
  }

  destroy() {
    this.tableRows.destroy();

    this.tableRows.off('resetRowsFromAllData', this.resetRowsFromAllData);
    this.openmct.time.off('clockChanged', this.resubscribeToStaleness);

    let keystrings = Object.keys(this.telemetryCollections);
    keystrings.forEach(this.removeTelemetryCollection);

    if (this.filterObserver) {
      this.filterObserver();
    }

    Object.values(this.stalenessSubscription).forEach((stalenessSubscription) => {
      stalenessSubscription.unsubscribe();
      stalenessSubscription.stalenessUtils.destroy();
    });

    if (this.tableComposition !== undefined) {
      this.tableComposition.off('add', this.addTelemetryObject);
      this.tableComposition.off('remove', this.removeTelemetryObject);
    }
  }
}

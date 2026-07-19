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
import { isEqual } from 'lodash';
import { v4 as uuid } from 'uuid';

import Condition from './Condition.js';
import HistoricalTelemetryProvider from './HistoricalTelemetryProvider.js';
import { TELEMETRY_VALUE } from './utils/constants.js';
import { getLatestTimestamp } from './utils/time.js';

export default class ConditionManager extends EventEmitter {
  #latestDataTable = new Map();

  /**
   * @param {import('openmct.js').DomainObject} conditionSetDomainObject
   * @param {import('openmct.js').OpenMCT} openmct
   */
  constructor(conditionSetDomainObject, openmct) {
    super();
    this.openmct = openmct;
    this.conditionSetDomainObject = conditionSetDomainObject;
    this.timeSystems = this.openmct.time.getAllTimeSystems();
    this.composition = this.openmct.composition.get(conditionSetDomainObject);
    this.composition.on('add', this.subscribeToTelemetry, this);
    this.composition.on('remove', this.unsubscribeFromTelemetry, this);

    this.shouldEvaluateNewTelemetry = this.shouldEvaluateNewTelemetry.bind(this);

    this.compositionLoad = this.composition.load();
    this.telemetryCollections = {};
    this.telemetryObjects = {};
    this.testData = {
      conditionTestInputs: this.conditionSetDomainObject.configuration.conditionTestData,
      applied: false
    };
    this.initialize();
    this.telemetryBuffer = [];
    this.isProcessing = false;
  }

  subscribeToTelemetry(telemetryObject) {
    const keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);

    if (this.telemetryCollections[keyString]) {
      return;
    }

    const requestOptions = {
      size: 1,
      strategy: 'latest'
    };

    this.telemetryCollections[keyString] = this.openmct.telemetry.requestCollection(
      telemetryObject,
      requestOptions
    );

    const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
    const telemetryMetaData = metadata ? metadata.valueMetadatas : [];

    this.telemetryObjects[keyString] = { ...telemetryObject, telemetryMetaData };

    this.telemetryCollections[keyString].on(
      'add',
      this.telemetryReceived.bind(this, telemetryObject)
    );
    this.telemetryCollections[keyString].load();

    this.updateConditionTelemetryObjects();
  }

  unsubscribeFromTelemetry(endpointIdentifier) {
    const keyString = this.openmct.objects.makeKeyString(endpointIdentifier);
    if (!this.telemetryCollections[keyString]) {
      return;
    }

    this.telemetryCollections[keyString].destroy();
    delete this.telemetryCollections[keyString];
    delete this.telemetryObjects[keyString];
    this.removeConditionTelemetryObjects();

    //force re-computation of condition set result as we might be in a state where
    // there is no telemetry datum coming in for a while or at all.
    const latestTimestamp = getLatestTimestamp(
      {},
      {},
      this.timeSystems,
      this.openmct.time.getTimeSystem()
    );
    this.updateConditionResults(keyString);
    this.updateCurrentCondition(latestTimestamp);

    if (Object.keys(this.telemetryObjects).length === 0) {
      // no telemetry objects
      this.emit('noTelemetryObjects');
    }
  }

  initialize() {
    this.conditions = [];
    if (this.conditionSetDomainObject.configuration.conditionCollection.length) {
      this.conditionSetDomainObject.configuration.conditionCollection.forEach(
        (conditionConfiguration, index) => {
          this.initCondition(conditionConfiguration, index);
        }
      );
    }

    if (Object.keys(this.telemetryObjects).length === 0) {
      // no telemetry objects
      this.emit('noTelemetryObjects');
    }
  }

  updateConditionTelemetryObjects() {
    this.conditions.forEach((condition) => {
      condition.updateTelemetryObjects();
      let index = this.conditionSetDomainObject.configuration.conditionCollection.findIndex(
        (item) => item.id === condition.id
      );
      if (index > -1) {
        //Only assign the summary, don't mutate the domain object
        this.conditionSetDomainObject.configuration.conditionCollection[index].summary =
          this.updateConditionDescription(condition);
      }
    });
  }

  removeConditionTelemetryObjects() {
    let conditionsChanged = false;
    this.conditionSetDomainObject.configuration.conditionCollection.forEach(
      (conditionConfiguration, conditionIndex) => {
        let conditionChanged = false;
        const config = conditionConfiguration.configuration;

        if (this.#clearInvalidOutputTelemetryConfiguration(config)) {
          conditionChanged = true;
        }

        conditionConfiguration.configuration.criteria.forEach((criterion) => {
          if (this.#isAnyOrAllTelemetryCriterion(criterion)) {
            conditionChanged = true;
          } else if (this.#clearInvalidCriterionTelemetryIfStale(criterion)) {
            conditionChanged = true;
          }
        });
        if (conditionChanged) {
          this.updateCondition(conditionConfiguration, conditionIndex);
          conditionsChanged = true;
        }
      }
    );
    if (conditionsChanged) {
      this.persistConditions();
    }
  }

  updateConditionDescription(condition) {
    condition.updateDescription();

    return condition.summary;
  }

  updateCondition(conditionConfiguration) {
    let condition = this.findConditionById(conditionConfiguration.id);
    if (condition) {
      condition.update(conditionConfiguration);
      conditionConfiguration.summary = this.updateConditionDescription(condition);
    }

    let index = this.conditionSetDomainObject.configuration.conditionCollection.findIndex(
      (item) => item.id === conditionConfiguration.id
    );
    if (index > -1) {
      this.conditionSetDomainObject.configuration.conditionCollection[index] =
        conditionConfiguration;
      this.persistConditions();
    }
  }

  initCondition(conditionConfiguration, index) {
    let condition = new Condition(conditionConfiguration, this.openmct, this);
    conditionConfiguration.summary = this.updateConditionDescription(condition);

    if (index !== undefined) {
      this.conditions.splice(index + 1, 0, condition);
    } else {
      this.conditions.unshift(condition);
    }
  }

  createCondition(conditionConfiguration) {
    let conditionObj;
    if (conditionConfiguration) {
      conditionObj = {
        ...conditionConfiguration,
        id: uuid(),
        configuration: {
          ...conditionConfiguration.configuration,
          name: `Copy of ${conditionConfiguration.configuration.name}`
        }
      };
    } else {
      conditionObj = {
        id: uuid(),
        configuration: {
          name: 'Unnamed Condition',
          output: 'false',
          trigger: 'all',
          criteria: [
            {
              id: uuid(),
              telemetry: '',
              operation: '',
              input: [],
              metadata: ''
            }
          ]
        },
        summary: ''
      };
    }

    return conditionObj;
  }

  addCondition() {
    this.createAndSaveCondition();
  }

  cloneCondition(conditionConfiguration, index) {
    let clonedConfig = JSON.parse(JSON.stringify(conditionConfiguration));
    clonedConfig.configuration.criteria.forEach((criterion) => (criterion.id = uuid()));
    this.createAndSaveCondition(index, clonedConfig);
  }

  createAndSaveCondition(index, conditionConfiguration) {
    const newCondition = this.createCondition(conditionConfiguration);
    if (index !== undefined) {
      this.conditionSetDomainObject.configuration.conditionCollection.splice(
        index + 1,
        0,
        newCondition
      );
    } else {
      this.conditionSetDomainObject.configuration.conditionCollection.unshift(newCondition);
    }

    this.initCondition(newCondition, index);
    this.persistConditions();
  }

  removeCondition(id) {
    let index = this.conditions.findIndex((item) => item.id === id);
    if (index > -1) {
      this.conditions[index].destroy();
      this.conditions.splice(index, 1);
    }

    let conditionCollectionIndex =
      this.conditionSetDomainObject.configuration.conditionCollection.findIndex(
        (item) => item.id === id
      );
    if (conditionCollectionIndex > -1) {
      this.conditionSetDomainObject.configuration.conditionCollection.splice(
        conditionCollectionIndex,
        1
      );
      this.persistConditions();
    }
  }

  findConditionById(id) {
    return this.conditions.find((condition) => condition.id === id);
  }

  reorderConditions(reorderPlan) {
    let oldConditions = Array.from(this.conditionSetDomainObject.configuration.conditionCollection);
    let newCollection = [];
    reorderPlan.forEach((reorderEvent) => {
      let item = oldConditions[reorderEvent.oldIndex];
      newCollection.push(item);
    });
    this.conditionSetDomainObject.configuration.conditionCollection = newCollection;
    this.persistConditions();
  }

  getCurrentCondition() {
    const conditionCollection = this.conditionSetDomainObject.configuration.conditionCollection;
    let currentCondition = conditionCollection[conditionCollection.length - 1];

    for (let i = 0; i < conditionCollection.length - 1; i++) {
      const condition = this.findConditionById(conditionCollection[i].id);
      if (condition.result) {
        //first condition to be true wins
        currentCondition = conditionCollection[i];
        break;
      }
    }

    return currentCondition;
  }

  async getHistoricalData(options) {
    if (!this.conditionSetDomainObject.configuration.shouldFetchHistorical) {
      return [];
    }

    await this.compositionLoad;
    this.#sanitizeAllStaleOutputTelemetryInCollection();

    let historicalTelemetry = new HistoricalTelemetryProvider(
      this.openmct,
      this.telemetryObjects,
      this.conditions,
      this.conditionSetDomainObject,
      options
    );
    const historicalData = await historicalTelemetry.getHistoricalData();
    historicalTelemetry = null;

    return historicalData;
  }

  getCurrentConditionLAD(conditionResults) {
    const conditionCollection = this.conditionSetDomainObject.configuration.conditionCollection;
    let currentCondition = conditionCollection[conditionCollection.length - 1];

    for (let i = 0; i < conditionCollection.length - 1; i++) {
      if (conditionResults[conditionCollection[i].id]) {
        //first condition to be true wins
        currentCondition = conditionCollection[i];
        break;
      }
    }

    return currentCondition;
  }

  async requestLADConditionSetOutput(options) {
    if (!this.conditions.length) {
      return [];
    }

    await this.compositionLoad;

    let latestTimestamp;
    let conditionResults = {};
    let nextLegOptions = { ...options };
    delete nextLegOptions.onPartialResponse;

    const results = await Promise.all(
      this.conditions.map((condition) => condition.requestLADConditionResult(nextLegOptions))
    );

    results.forEach((resultObj) => {
      const {
        id,
        data,
        data: { result }
      } = resultObj;

      if (this.findConditionById(id)) {
        conditionResults[id] = Boolean(result);
      }

      latestTimestamp = getLatestTimestamp(
        latestTimestamp,
        data,
        this.timeSystems,
        this.openmct.time.getTimeSystem()
      );
    });

    if (!Object.values(latestTimestamp).some((timeSystem) => timeSystem)) {
      return [];
    }

    const currentCondition = this.getCurrentConditionLAD(conditionResults);
    this.#sanitizeOutputTelemetryCompositionMismatch(currentCondition);

    let output = currentCondition?.configuration?.output;

    if (output === TELEMETRY_VALUE) {
      const { outputTelemetry, outputMetadata } = currentCondition.configuration;
      const outputTelemetryObject = await this.openmct.objects.get(outputTelemetry);
      const telemetryOptions = {
        size: 1,
        strategy: 'latest',
        timeContext: this.openmct.time.getContextForView([])
      };
      const latestData = await this.openmct.telemetry.request(
        outputTelemetryObject,
        telemetryOptions
      );
      if (latestData?.[0]?.[outputMetadata]) {
        output = latestData?.[0]?.[outputMetadata];
      }
    }

    let result = currentCondition?.isDefault ? false : conditionResults[currentCondition.id];
    const currentOutput = {
      conditionId: currentCondition.id,
      id: this.conditionSetDomainObject.identifier,
      output: output,
      ...latestTimestamp,
      result,
      isDefault: currentCondition?.isDefault
    };

    return output !== undefined ? [currentOutput] : [];
  }

  isTelemetryUsed(endpoint) {
    const id = this.openmct.objects.makeKeyString(endpoint.identifier);

    for (let condition of this.conditions) {
      if (condition.isTelemetryUsed(id)) {
        return true;
      }
    }

    return false;
  }

  shouldEvaluateNewTelemetry(currentTimestamp) {
    return this.openmct.time.getBounds().end >= currentTimestamp;
  }

  telemetryReceived(endpoint, data) {
    if (!this.isTelemetryUsed(endpoint)) {
      return;
    }

    const datum = data[0];

    const normalizedDatum = this.createNormalizedDatum(datum, endpoint);
    const timeSystemKey = this.openmct.time.getTimeSystem().key;
    const currentTimestamp = normalizedDatum[timeSystemKey];
    const timestamp = {};

    timestamp[timeSystemKey] = currentTimestamp;
    this.#latestDataTable.set(normalizedDatum.id, normalizedDatum);

    if (this.shouldEvaluateNewTelemetry(currentTimestamp)) {
      // updateConditionResults expects the telemetry id keyString that changed
      // so that conditions can decide whether they need to recompute.
      this.updateConditionResults(normalizedDatum.id);
      this.updateCurrentCondition(timestamp, endpoint, datum);
    }
  }

  updateConditionResults(keyStringForUpdatedTelemetryObject) {
    //We want to stop when the first condition evaluates to true.
    const matchingCondition = this.conditions.find((condition) => {
      condition.updateResult(this.#latestDataTable, keyStringForUpdatedTelemetryObject);

      return condition.result === true;
    });

    return matchingCondition;
  }

  emitConditionSetResult(currentCondition, timestamp, outputValue, result, isDefault) {
    this.emit('conditionSetResultUpdated', {
      conditionId: currentCondition.id,
      id: this.conditionSetDomainObject.identifier,
      output: outputValue,
      ...timestamp,
      result,
      isDefault
    });
  }

  updateCurrentCondition(timestamp, telemetryObject, telemetryData) {
    this.telemetryBuffer.push({ timestamp, telemetryObject, telemetryData });

    if (!this.isProcessing) {
      this.processBuffer();
    }
  }

  async processBuffer() {
    this.isProcessing = true;

    try {
      while (this.telemetryBuffer.length > 0) {
        const { timestamp, telemetryObject, telemetryData } = this.telemetryBuffer.shift();
        await this.processCondition(timestamp, telemetryObject, telemetryData);
      }
    } catch (error) {
      console.error('Error processing telemetry buffer', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processCondition(timestamp, telemetryObject, telemetryData) {
    await this.compositionLoad;
    const currentCondition = this.getCurrentCondition();
    this.#sanitizeOutputTelemetryCompositionMismatch(currentCondition);

    const conditionDetails = this.conditions.filter(
      (condition) => condition.id === currentCondition.id
    )?.[0];
    const conditionResult = currentCondition?.isDefault ? false : conditionDetails?.result;
    let telemetryValue = currentCondition.configuration.output;

    if (telemetryValue !== undefined) {
      if (currentCondition?.configuration?.outputTelemetry) {
        const selectedOutputIdentifier = currentCondition?.configuration?.outputTelemetry;
        const outputMetadata = currentCondition?.configuration?.outputMetadata;
        const timeSystemKey = this.openmct.time.getTimeSystem().key;
        const telemetryKeystring = telemetryObject
          ? this.openmct.objects.makeKeyString(telemetryObject.identifier)
          : null;

        if (telemetryKeystring && selectedOutputIdentifier === telemetryKeystring) {
          telemetryValue = telemetryData?.[outputMetadata];
        } else {
          const outputTelemetryObject = await this.openmct.objects.get(selectedOutputIdentifier);
          const telemetryOptions = {
            size: 1,
            strategy: 'latest',
            start: timestamp?.[timeSystemKey] - 1000,
            end: timestamp?.[timeSystemKey] + 1000
          };
          const outputTelemetryData = await this.openmct.telemetry.request(
            outputTelemetryObject,
            telemetryOptions
          );
          const outputTelemetryValue =
            outputTelemetryData?.length > 0 ? outputTelemetryData.slice(-1)[0] : null;
          if (outputTelemetryData.length && outputTelemetryValue?.[outputMetadata]) {
            telemetryValue = outputTelemetryValue?.[outputMetadata];
          } else {
            telemetryValue = undefined;
          }
        }
      } else if (currentCondition?.configuration?.output) {
        telemetryValue = currentCondition?.configuration?.output;
      }

      this.emitConditionSetResult(
        currentCondition,
        timestamp,
        telemetryValue,
        conditionResult,
        currentCondition?.isDefault
      );
    }
  }

  getTestData(metadatum, identifier) {
    let data = undefined;
    if (this.testData.applied) {
      const found = this.testData.conditionTestInputs.find(
        (testInput) =>
          testInput.metadata === metadatum.source &&
          this.openmct.objects.areIdsEqual(testInput.telemetry, identifier)
      );
      if (found) {
        data = found.value;
      }
    }

    return data;
  }

  createNormalizedDatum(telemetryDatum, endpoint) {
    const id = this.openmct.objects.makeKeyString(endpoint.identifier);
    const metadata = this.openmct.telemetry.getMetadata(endpoint).valueMetadatas;

    const normalizedDatum = Object.values(metadata).reduce((datum, metadatum) => {
      const testValue = this.getTestData(metadatum, endpoint.identifier);
      const formatter = this.openmct.telemetry.getValueFormatter(metadatum);
      datum[metadatum.key] =
        testValue !== undefined
          ? formatter.parse(testValue)
          : formatter.parse(telemetryDatum[metadatum.source]);

      return datum;
    }, {});

    normalizedDatum.id = id;

    return normalizedDatum;
  }

  updateTestData(testData) {
    if (!isEqual(testData, this.testData)) {
      this.testData = JSON.parse(JSON.stringify(testData));
      this.openmct.objects.mutate(
        this.conditionSetDomainObject,
        'configuration.conditionTestData',
        this.testData.conditionTestInputs
      );
    }
  }

  persistConditions() {
    const collection = this.conditionSetDomainObject.configuration.conditionCollection;
    this.openmct.objects.mutate(
      this.conditionSetDomainObject,
      'configuration.conditionCollection',
      [...collection] // just in case, spread to create new array to implicitly trigger any mutation observers
    );
  }

  /**
   * True if a stored telemetry reference is still a child of this condition set (in telemetryObjects).
   */
  #telemetryRefStillInComposition(telemetryRef) {
    if (!telemetryRef) {
      return false;
    }

    return Boolean(this.telemetryObjects[telemetryRef]);
  }

  /**
   * Clears outputTelemetry/outputMetadata when output mode is telemetry value but the endpoint
   * is no longer in composition. Returns whether configuration changed.
   */
  #clearInvalidOutputTelemetryConfiguration(config) {
    if (config.output !== TELEMETRY_VALUE || !config.outputTelemetry) {
      return false;
    }

    if (this.#telemetryRefStillInComposition(config.outputTelemetry)) {
      return false;
    }

    config.outputTelemetry = null;
    config.outputMetadata = null;
    delete config.valueMetadata;
    config.output = undefined;

    return true;
  }

  /**
   * Criterion uses "any telemetry" / "all telemetry" instead of a single endpoint.
   */
  #isAnyOrAllTelemetryCriterion(criterion) {
    return Boolean(
      criterion.telemetry && (criterion.telemetry === 'any' || criterion.telemetry === 'all')
    );
  }

  /**
   * Whether criterion.telemetry identifies an object still in this condition set's composition.
   */
  #criterionTelemetryRefStillInComposition(criterion) {
    return Object.values(this.telemetryObjects).some(
      (telemetryObject) =>
        telemetryObject &&
        this.openmct.objects.areIdsEqual(telemetryObject.identifier, criterion.telemetry)
    );
  }

  /**
   * Clears criterion fields when its telemetry endpoint is no longer in composition.
   * @returns {boolean} whether the criterion was changed
   */
  #clearInvalidCriterionTelemetryIfStale(criterion) {
    if (this.#isAnyOrAllTelemetryCriterion(criterion)) {
      return false;
    }

    if (this.#criterionTelemetryRefStillInComposition(criterion)) {
      return false;
    }

    criterion.telemetry = '';
    criterion.metadata = '';
    criterion.input = [];
    criterion.operation = '';

    return true;
  }

  /**
   * Guard + persist: fixes stale config when resolving live or LAD output (e.g. alphanumeric view).
   */
  #sanitizeOutputTelemetryCompositionMismatch(conditionCollectionItem) {
    if (!conditionCollectionItem?.configuration) {
      return;
    }

    if (!this.#clearInvalidOutputTelemetryConfiguration(conditionCollectionItem.configuration)) {
      return;
    }

    const condition = this.findConditionById(conditionCollectionItem.id);

    if (condition) {
      conditionCollectionItem.summary = this.updateConditionDescription(condition);
    }

    this.persistConditions();
  }

  /**
   * Batch cleanup for historical evaluation and persistence (single save).
   */
  #sanitizeAllStaleOutputTelemetryInCollection() {
    let any = false;

    this.conditionSetDomainObject.configuration.conditionCollection.forEach((item) => {
      if (!item.configuration) {
        return;
      }

      if (!this.#clearInvalidOutputTelemetryConfiguration(item.configuration)) {
        return;
      }

      any = true;
      const condition = this.findConditionById(item.id);

      if (condition) {
        item.summary = this.updateConditionDescription(condition);
      }
    });

    if (any) {
      this.persistConditions();
    }
  }

  destroy() {
    this.composition.off('add', this.subscribeToTelemetry, this);
    this.composition.off('remove', this.unsubscribeFromTelemetry, this);
    Object.values(this.telemetryCollections).forEach((telemetryCollection) =>
      telemetryCollection.destroy()
    );

    this.conditions.forEach((condition) => {
      condition.destroy();
    });
  }
}

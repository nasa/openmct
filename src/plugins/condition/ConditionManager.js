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
import { v4 as uuid } from 'uuid';

import Condition from './Condition.js';
import { getLatestTimestamp } from './utils/time.js';

export default class ConditionManager extends EventEmitter {
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
    this.telemetryCollections[keyString] = null;
    this.telemetryObjects[keyString] = null;
    this.removeConditionTelemetryObjects();

    //force re-computation of condition set result as we might be in a state where
    // there is no telemetry datum coming in for a while or at all.
    const latestTimestamp = getLatestTimestamp(
      {},
      {},
      this.timeSystems,
      this.openmct.time.getTimeSystem()
    );
    this.updateConditionResults({ id: keyString });
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
        conditionConfiguration.configuration.criteria.forEach((criterion, index) => {
          const isAnyAllTelemetry =
            criterion.telemetry && (criterion.telemetry === 'any' || criterion.telemetry === 'all');
          if (!isAnyAllTelemetry) {
            const found = Object.values(this.telemetryObjects).find((telemetryObject) => {
              return this.openmct.objects.areIdsEqual(
                telemetryObject.identifier,
                criterion.telemetry
              );
            });
            if (!found) {
              criterion.telemetry = '';
              criterion.metadata = '';
              criterion.input = [];
              criterion.operation = '';
              conditionChanged = true;
            }
          } else {
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
    const currentOutput = {
      output: currentCondition.configuration.output,
      id: this.conditionSetDomainObject.identifier,
      conditionId: currentCondition.id,
      ...latestTimestamp
    };

    return [currentOutput];
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
    let timestamp = {};
    const currentTimestamp = normalizedDatum[timeSystemKey];
    timestamp[timeSystemKey] = currentTimestamp;
    if (this.shouldEvaluateNewTelemetry(currentTimestamp)) {
      this.updateConditionResults(normalizedDatum);
      this.updateCurrentCondition(timestamp);
    }
  }

  updateConditionResults(normalizedDatum) {
    //We want to stop when the first condition evaluates to true.
    this.conditions.some((condition) => {
      condition.updateResult(normalizedDatum);

      return condition.result === true;
    });
  }

  updateCurrentCondition(timestamp) {
    const currentCondition = this.getCurrentCondition();

    this.emit(
      'conditionSetResultUpdated',
      Object.assign(
        {
          output: currentCondition.configuration.output,
          id: this.conditionSetDomainObject.identifier,
          conditionId: currentCondition.id
        },
        timestamp
      )
    );
  }

  getTestData(metadatum) {
    let data = undefined;
    if (this.testData.applied) {
      const found = this.testData.conditionTestInputs.find(
        (testInput) => testInput.metadata === metadatum.source
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
      const testValue = this.getTestData(metadatum);
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
    if (!_.isEqual(testData, this.testData)) {
      this.testData = testData;
      this.openmct.objects.mutate(
        this.conditionSetDomainObject,
        'configuration.conditionTestData',
        this.testData.conditionTestInputs
      );
    }
  }

  persistConditions() {
    this.openmct.objects.mutate(
      this.conditionSetDomainObject,
      'configuration.conditionCollection',
      this.conditionSetDomainObject.configuration.conditionCollection
    );
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

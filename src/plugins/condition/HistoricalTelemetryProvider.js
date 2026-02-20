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

import { evaluateResults } from './utils/evaluator.js';

export default class HistoricalTelemetryProvider {
  constructor(openmct, telemetryObjects, conditions, conditionSetDomainObject, options) {
    this.openmct = openmct;
    this.telemetryObjects = telemetryObjects;
    this.bounds = { start: null, end: null };
    this.telemetryList = [];
    this.conditions = conditions;
    this.conditionSetDomainObject = conditionSetDomainObject;
    this.historicalTelemetryPoolMap = new Map();
    this.historicalTelemetryDateMap = new Map();
    this.timeSystem = this.openmct.time.getTimeSystem();
    this.timeSystemKey = this.timeSystem.key;
    this.index = 0;
    this.options = options;
  }

  normalizeTelemetryDatum(domainObject, telemetryDatum) {
    const metadata = this.openmct.telemetry.getMetadata(domainObject);
    const valueMetadatas = metadata?.valueMetadatas ?? [];
    const normalizedDatum = Object.values(valueMetadatas).reduce((datum, metadatum) => {
      const formatter = this.openmct.telemetry.getValueFormatter(metadatum);
      const rawValue = telemetryDatum?.[metadatum.source];
      datum[metadatum.key] = formatter.parse(rawValue);

      return datum;
    }, {});

    normalizedDatum.id = this.openmct.objects.makeKeyString(domainObject.identifier);

    return normalizedDatum;
  }

  setTimeBounds(bounds) {
    this.bounds = bounds;
  }

  setTimeSystem(timeSystem) {
    // Keep both the full timeSystem object and its key in sync, since downstream logic
    // uses the key for timestamp field names.
    this.timeSystem = timeSystem;
    this.timeSystemKey = timeSystem.key;
  }

  async refreshHistoricalTelemetry(domainObject, identifier) {
    if (!domainObject && identifier) {
      domainObject = await this.openmct.objects.get(identifier);
    }
    const id = this.openmct.objects.makeKeyString(domainObject.identifier);
    const telemetryOptions = { ...this.bounds, ...this.options };
    const historicalTelemetry = await this.openmct.telemetry.request(
      domainObject,
      telemetryOptions
    );
    const normalizedHistoricalTelemetry = (historicalTelemetry ?? []).map((datum) =>
      this.normalizeTelemetryDatum(domainObject, datum)
    );
    this.historicalTelemetryPoolMap.set(id, {
      domainObject,
      historicalTelemetry: normalizedHistoricalTelemetry
    });
    return { domainObject, historicalTelemetry: normalizedHistoricalTelemetry };
  }

  async getAllTelemetries(conditionCollection) {
    const conditionCollectionMap = new Map();
    const inputTelemetries = [];
    const outputTelemetries = [];
    const historicalTelemetryPoolPromises = [];

    const hasAnyAllTelemetry = conditionCollection.some((condition) =>
      condition.configuration.criteria.some(
        (criterion) => criterion.telemetry === 'any' || criterion.telemetry === 'all'
      )
    );

    if (hasAnyAllTelemetry) {
      // Short-circuit and fetch ALL telemetry objects from composition
      this.conditionSetDomainObject.composition.forEach((telemetryRef) => {
        const telemetryId = this.openmct.objects.makeKeyString(telemetryRef);
        if (![...inputTelemetries, ...outputTelemetries].includes(telemetryId)) {
          historicalTelemetryPoolPromises.push(this.refreshHistoricalTelemetry(null, telemetryRef));
          inputTelemetries.push(telemetryId);
        }
      });
    } else {
      // Normal processing: only fetch specific telemetry objects
      conditionCollection.forEach((condition, index) => {
        const { criteria, outputTelemetry } = condition.configuration;
        conditionCollectionMap.set(condition?.id, condition);

        criteria.forEach((criterion) => {
          const inputTelemetry = criterion?.telemetry;

          if (inputTelemetry) {
            const inputTelemetryId = this.openmct.objects.makeKeyString(inputTelemetry);
            if (![...inputTelemetries, ...outputTelemetries].includes(inputTelemetryId)) {
              historicalTelemetryPoolPromises.push(
                this.refreshHistoricalTelemetry(null, inputTelemetry)
              );
            }
            inputTelemetries.push(inputTelemetryId);
          }
        });

        // Handle output telemetry outside of criteria loop, only need to fetch once at condition level
        if (outputTelemetry) {
          if (![...inputTelemetries, ...outputTelemetries].includes(outputTelemetry)) {
            historicalTelemetryPoolPromises.push(
              this.refreshHistoricalTelemetry(null, outputTelemetry)
            );
          }
          outputTelemetries.push(outputTelemetry);
        }
      });
    }

    const historicalTelemetriesPool = await Promise.all(historicalTelemetryPoolPromises);

    return {
      historicalTelemetriesPool,
      conditionCollectionMap
    };
  }

  async sortTelemetriesInWorker(historicalTelemetriesPool) {
    const sortedTelemetries = await this.startWorker('sortTelemetries', {
      historicalTelemetriesPool,
      timeSystemKey: this.timeSystemKey
    });
    return sortedTelemetries;
  }

  fillForwardTelemetryByTimestamp(historicalTelemetryDateMap) {
    // Ensure timestamps are processed in ascending order and carry forward the
    // latest known datum for each telemetry id, matching the live/LAD "as-of" semantics.
    const sortedEntries = Array.from(historicalTelemetryDateMap.entries()).sort(
      ([a], [b]) => a - b
    );
    const latestByTelemetryId = new Map();
    const filledMap = new Map();

    for (const [timestamp, telemetryMap] of sortedEntries) {
      telemetryMap.forEach((datum, telemetryId) => {
        latestByTelemetryId.set(telemetryId, datum);
      });
      filledMap.set(timestamp, new Map(latestByTelemetryId));
    }

    return filledMap;
  }

  async startWorker(type, data) {
    // eslint-disable-next-line no-undef
    const workerUrl = `${this.openmct.getAssetPath()}${__OPENMCT_ROOT_RELATIVE__}historicalTelemetryWorker.js`;
    const worker = new Worker(workerUrl);

    try {
      const result = await this.getDataFromWorker(worker, type, data);
      return result;
    } catch (error) {
      console.error('Error in condition manager getHistoricalData:', error);
      throw error;
    } finally {
      worker.terminate();
    }
  }

  getDataFromWorker(worker, type, data) {
    return new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        if (e.data.type === 'result') {
          resolve(e.data.data);
        } else if (e.data.type === 'error') {
          reject(new Error(e.data.error));
        }
      };

      worker.onerror = (error) => {
        reject(error);
      };

      worker.postMessage({
        type,
        data
      });
    });
  }

  evaluateConditionsForTimestamp(historicalTelemetryMap, timestamp) {
    const conditionResults = new Map();

    for (const condition of this.conditions) {
      const criteriaResults = condition.criteria.map((criterion) => {
        if (criterion?.telemetry) {
          const conditionInputTelemetryId = this.openmct.objects.makeKeyString(criterion.telemetry);
          const inputTelemetry = historicalTelemetryMap.get(conditionInputTelemetryId);
          return criterion.computeResult(inputTelemetry);
        }
        return false;
      });

      const result = evaluateResults(criteriaResults, condition.trigger);
      conditionResults.set(condition.id, result);

      if (result === true) {
        break;
      }
    }

    // If no condition was true, return all results (including the default)
    return conditionResults;
  }

  getCurrentConditionForTimestamp(conditionResults, conditionCollectionMap) {
    const conditionCollection = this.conditionSetDomainObject.configuration.conditionCollection;
    let currentCondition = conditionCollection[conditionCollection.length - 1];

    for (let i = 0; i < conditionCollection.length - 1; i++) {
      const conditionId = conditionCollection[i].id;
      if (conditionResults.get(conditionId)) {
        // First condition to be true wins
        currentCondition = conditionCollection[i];
        break;
      }
    }

    return currentCondition;
  }

  processConditionOutput(historicalTelemetryMap, timestamp, currentCondition, conditionResults) {
    const conditionResult = currentCondition?.isDefault
      ? false
      : conditionResults.get(currentCondition.id);
    const conditionConfiguration = currentCondition?.configuration;
    let output = conditionConfiguration?.output;

    if (output !== undefined) {
      if (conditionConfiguration?.outputTelemetry) {
        const outputTelemetryID = this.openmct.objects.makeKeyString(
          conditionConfiguration.outputTelemetry
        );
        const outputTelemetryData = historicalTelemetryMap.get(outputTelemetryID);
        output = outputTelemetryData?.[conditionConfiguration.outputMetadata];
      }

      return {
        condition: currentCondition,
        id: this.conditionSetDomainObject.identifier,
        output: output,
        [this.timeSystemKey]: timestamp,
        result: conditionResult,
        isDefault: currentCondition?.isDefault
      };
    }

    return null;
  }

  evaluateConditionsByDate(historicalTelemetryDateMap, conditionCollectionMap) {
    const outputTelemetryDateMap = new Map();

    historicalTelemetryDateMap.forEach((historicalTelemetryMap, timestamp) => {
      // Step 1: Evaluate all conditions for this timestamp
      const conditionResults = this.evaluateConditionsForTimestamp(
        historicalTelemetryMap,
        timestamp
      );

      // Step 2: Determine which condition should be active
      const currentCondition = this.getCurrentConditionForTimestamp(
        conditionResults,
        conditionCollectionMap
      );

      // Step 3: Process the output for the current condition
      const conditionOutput = this.processConditionOutput(
        historicalTelemetryMap,
        timestamp,
        currentCondition,
        conditionResults
      );

      if (conditionOutput) {
        outputTelemetryDateMap.set(timestamp, conditionOutput);
      }
    });

    return outputTelemetryDateMap;
  }

  async getHistoricalInputsByDate() {
    const conditionCollection = this.conditionSetDomainObject.configuration.conditionCollection;
    const { historicalTelemetriesPool, conditionCollectionMap } =
      await this.getAllTelemetries(conditionCollection);
    const historicalTelemetryDateMap =
      await this.sortTelemetriesInWorker(historicalTelemetriesPool);
    const filledHistoricalTelemetryDateMap = this.fillForwardTelemetryByTimestamp(
      historicalTelemetryDateMap
    );
    const outputTelemetryDateMap = this.evaluateConditionsByDate(
      filledHistoricalTelemetryDateMap,
      conditionCollectionMap
    );

    return outputTelemetryDateMap;
  }

  async getHistoricalData() {
    this.setTimeBounds(this.openmct.time.getBounds());
    this.setTimeSystem(this.openmct.time.getTimeSystem());
    const outputTelemetryMap = await this.getHistoricalInputsByDate();
    const formattedOutputTelemetry = this.formatOutputData(outputTelemetryMap);

    return formattedOutputTelemetry;
  }

  formatOutputData(outputTelemetryMap) {
    const outputTelemetryList = [];
    const domainObject = this.conditionSetDomainObject;

    outputTelemetryMap.forEach((outputMetadata, timestamp) => {
      const { condition, output, result, isDefault } = outputMetadata;

      outputTelemetryList.push({
        conditionId: condition.id,
        id: domainObject.identifier,
        output,
        [this.timeSystemKey]: timestamp,
        result,
        isDefault
      });
    });

    return outputTelemetryList;
  }
}

export default class HistoricalTelemetryProvider {
  constructor(openmct, telemetryObjects, conditions, conditionSetDomainObject) {
    this.openmct = openmct;
    this.telemetryObjects = telemetryObjects;
    this.bounds = { start: null, end: null };
    this.telemetryList = [];
    this.conditions = conditions;
    this.conditionSetDomainObject = conditionSetDomainObject;
    this.historicalTelemetryPoolMap = new Map();
    this.historicalTelemetryDateMap = new Map();
    this.index = 0;
  }

  setTimeBounds(bounds) {
    this.bounds = bounds;
  }

  async refreshHistoricalTelemetry(domainObject, identifier) {
    console.log('refreshHistoricalTelemetry');
    if (!domainObject && identifier) {
      domainObject = await this.openmct.objects.get(identifier);
    }
    const id = this.openmct.objects.makeKeyString(domainObject.identifier);
    const telemetryOptions = { ...this.bounds };
    const historicalTelemetry = await this.openmct.telemetry.request(
      domainObject,
      telemetryOptions
    );
    this.historicalTelemetryPoolMap.set(id, { domainObject, historicalTelemetry });
    return { domainObject, historicalTelemetry };
  }

  evaluateTrueCondition(historicalDateMap, timestamp, condition, conditionCollectionMap) {
    const telemetryData = historicalDateMap.get(timestamp);
    const conditionConfiguration = conditionCollectionMap.get(condition.id)?.configuration;
    const { outputTelemetry, outputMetadata } = conditionConfiguration;
    let output = {};
    output.result = true;
    if (outputTelemetry) {
      const outputTelemetryID = this.openmct.objects.makeKeyString(outputTelemetry);
      const outputTelemetryData = telemetryData.get(outputTelemetryID);
      output.telemetry = outputTelemetryData;
      output.value = outputTelemetryData[outputMetadata];
      output.condition = condition;
    } else if (conditionConfiguration?.output) {
      output.telemetry = null;
      output.value = conditionConfiguration?.output;
      output.condition = condition;
    }
    return output;
  }

  async getAllTelemetries(conditionCollection) {
    const conditionCollectionMap = new Map();
    const inputTelemetries = [];
    const outputTelemetries = [];
    const historicalTelemetryPoolPromises = [];

    conditionCollection.forEach((condition, index) => {
      console.log('-------------------------');
      console.log(condition);
      const { id } = condition;
      const { criteria, output, outputTelemetry, outputMetadata } = condition.configuration;
      const inputTelemetry = criteria?.[0]?.telemetry;
      console.log(id);
      console.log(criteria);
      console.log(output);
      console.log(outputMetadata);
      console.log('inputTelemetry', inputTelemetry);
      console.log('outputTelemetry', outputTelemetry);
      conditionCollectionMap.set(condition?.id, condition);
      if (inputTelemetry) {
        const inputTelemetryId = this.openmct.objects.makeKeyString(inputTelemetry);
        if (![...inputTelemetries, ...outputTelemetries].includes(inputTelemetryId)) {
          historicalTelemetryPoolPromises.push(
            this.refreshHistoricalTelemetry(null, inputTelemetry)
          );
        }
        inputTelemetries.push(inputTelemetryId);
      } else {
        inputTelemetries.push(null);
      }
      if (outputTelemetry) {
        if (![...inputTelemetries, ...outputTelemetries].includes(outputTelemetry)) {
          historicalTelemetryPoolPromises.push(
            this.refreshHistoricalTelemetry(null, outputTelemetry)
          );
        }
        outputTelemetries.push(outputTelemetry);
      } else {
        outputTelemetries.push(null);
      }
    });

    const historicalTelemetriesPool = await Promise.all(historicalTelemetryPoolPromises);
    return {
      historicalTelemetriesPool,
      inputTelemetries,
      outputTelemetries,
      conditionCollectionMap
    };
  }

  sortTelemetriesByDate(historicalTelemetriesPool) {
    const historicalTelemetryDateMap = new Map();
    historicalTelemetriesPool.forEach((historicalTelemetryList) => {
      const { historicalTelemetry, domainObject } = historicalTelemetryList;
      const { identifier } = domainObject;
      const telemetryIdentifier = this.openmct.objects.makeKeyString(identifier);
      historicalTelemetry.forEach((historicalTelemetryItem) => {
        if (!historicalTelemetryDateMap.get(historicalTelemetryItem.utc)) {
          const telemetryMap = new Map();
          telemetryMap.set(telemetryIdentifier, historicalTelemetryItem);
          historicalTelemetryDateMap.set(historicalTelemetryItem.utc, telemetryMap);
        } else {
          const telemetryMap = historicalTelemetryDateMap.get(historicalTelemetryItem.utc);
          telemetryMap.set(telemetryIdentifier, historicalTelemetryItem);
          historicalTelemetryDateMap.set(historicalTelemetryItem.utc, telemetryMap);
        }
      });
    });
    return historicalTelemetryDateMap;
  }

  async sortTelemetriesInWorker(historicalTelemetriesPool) {
    const sortedTelemetries = await this.startWorker('sortTelemetries', {
      historicalTelemetriesPool
    });
    return sortedTelemetries;
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

  evaluateConditionsByDate(historicalTelemetryDateMap, conditionCollectionMap) {
    const outputTelemetryDateMap = new Map();
    historicalTelemetryDateMap.forEach((historicalTelemetryMap, timestamp) => {
      let isConditionValid = false;
      const evaluatedConditions = [];
      this.conditions.forEach((condition) => {
        if (isConditionValid) {
          return;
        }
        const { id } = condition;
        const conditionMetadata = { condition };
        const conditionCriteria = condition.criteria[0];
        let result;
        if (conditionCriteria?.telemetry) {
          const conditionInputTelemetryId = this.openmct.objects.makeKeyString(
            conditionCriteria.telemetry
          );
          const inputTelemetry = historicalTelemetryMap.get(conditionInputTelemetryId);
          conditionMetadata.inputTelemetry = inputTelemetry;
          result = conditionCriteria.computeResult({
            id,
            ...inputTelemetry
          });
        } else if (!conditionCriteria) {
          const conditionDetails = conditionCollectionMap.get(id);
          const { isDefault } = conditionDetails;
          const conditionConfiguration = conditionDetails?.configuration;
          const { output } = conditionConfiguration;
          if (isDefault) {
            const conditionOutput = {
              condition,
              telemetry: null,
              value: output,
              result: false,
              isDefault: true
            };
            outputTelemetryDateMap.set(timestamp, conditionOutput);
          }
        }
        conditionMetadata.result = result;
        evaluatedConditions.push(conditionMetadata);
        if (result === true) {
          isConditionValid = true;
          const conditionOutput = this.evaluateTrueCondition(
            historicalTelemetryDateMap,
            timestamp,
            condition,
            conditionCollectionMap
          );
          outputTelemetryDateMap.set(timestamp, conditionOutput);
        }
      });
    });
    return outputTelemetryDateMap;
  }

  async getHistoricalInputsByDate() {
    const conditionCollection = this.conditionSetDomainObject.configuration.conditionCollection;

    const {
      historicalTelemetriesPool,
      inputTelemetries,
      outputTelemetries,
      conditionCollectionMap
    } = await this.getAllTelemetries(conditionCollection);

    const historicalTelemetryDateMap =
      await this.sortTelemetriesInWorker(historicalTelemetriesPool);
    const outputTelemetryDateMap = this.evaluateConditionsByDate(
      historicalTelemetryDateMap,
      conditionCollectionMap
    );

    console.log('*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣*️⃣');
    console.log(historicalTelemetriesPool);
    console.log(this.historicalTelemetryPoolMap);
    console.log(inputTelemetries);
    console.log(outputTelemetries);
    console.log(historicalTelemetryDateMap);
    console.log(outputTelemetryDateMap);

    return outputTelemetryDateMap;
  }

  addItemToHistoricalTelemetryMap(telemetryMap, item, type, index) {
    if (type === 'input') {
      telemetryMap.set();
    }
  }

  async getHistoricalData() {
    console.log('getHistoricalData');
    this.setTimeBounds(this.openmct.time.getBounds());
    const outputTelemetryMap = await this.getHistoricalInputsByDate();
    const formattedOutputTelemetry = this.formatOutputData(outputTelemetryMap);
    console.log(formattedOutputTelemetry);
    return formattedOutputTelemetry;
  }

  formatOutputData(outputTelemetryMap) {
    const outputTelemetryList = [];
    const domainObject = this.conditionSetDomainObject;
    outputTelemetryMap.forEach((outputMetadata, timestamp) => {
      const { condition, value, result, isDefault } = outputMetadata;
      outputTelemetryList.push({
        conditionId: condition.id,
        id: domainObject.identifier,
        output: value,
        utc: timestamp,
        result,
        isDefault
      });
    });
    return outputTelemetryList;
  }
}

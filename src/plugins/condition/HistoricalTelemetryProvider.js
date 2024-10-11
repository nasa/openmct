export default class HistoricalTelemetryProvider {
  #telemetryOptions;
  #telemetryObjects = {};
  #conditions;
  #conditionSetDomainObject;
  #openmct;
  #telemetryCollections = {};
  #composition;
  #outputTelemetryDetails = {};

  constructor(openmct, conditions, conditionSetDomainObject, telemetryOptions) {
    this.#openmct = openmct;
    this.#conditions = conditions;
    this.#conditionSetDomainObject = conditionSetDomainObject;
    this.#telemetryOptions = telemetryOptions;
    this.addTelemetryObject = this.addTelemetryObject.bind(this);
    this.removeTelemetryObject = this.removeTelemetryObject.bind(this);
  }

  #evaluateTrueCondition() {
    return null;
  }

  #getInputTelemetry(conditionCriteria, dataFrame, timestamp) {
    if (conditionCriteria?.telemetry === 'all') {
      // if the criteria is 'all', return all telemetry data
      const allTelemetry = [];
      Object.keys(dataFrame).forEach((key) => {
        const telemetryData = dataFrame[key][timestamp];
        telemetryData.id = key;
        if (telemetryData) {
          allTelemetry.push(telemetryData);
        }
      });
      return allTelemetry;
    }
    if (!conditionCriteria?.telemetry) {
      console.debug('🚨 Missing telemetry key in condition criteria - are we the default?');
      return null;
    }
    const conditionInputTelemetryKeyString = this.#openmct.objects.makeKeyString(
      conditionCriteria?.telemetry
    );

    const inputTelemetryByDate = dataFrame[conditionInputTelemetryKeyString];
    if (!inputTelemetryByDate) {
      console.debug(`🚨 Missing ALL data for ${conditionInputTelemetryKeyString}`);
      return null;
    }
    const specificDatum = inputTelemetryByDate[timestamp];

    if (!specificDatum) {
      console.debug(`🚨 Missing data for ${conditionInputTelemetryKeyString} at ${timestamp}`);
      return null;
    }
    specificDatum.id = conditionInputTelemetryKeyString;
    return specificDatum;
  }

  #formatDatumForOutput(datum, metadata, result) {
    const formattedDatum = {
      ...datum,
      value: datum[metadata],
      result
    };
    return formattedDatum;
  }

  #computeHistoricalDatum(timestamp, dataFrame, timekey) {
    for (let conditionIndex = 0; conditionIndex < this.#conditions.length; conditionIndex++) {
      const condition = this.#conditions[conditionIndex];
      const { id } = condition;
      const conditionCriteria = condition.criteria?.[0];
      let result = false;
      if (conditionCriteria) {
        const inputTelemetry = this.#getInputTelemetry(conditionCriteria, dataFrame, timestamp);
        result = conditionCriteria.computeResult({ id, ...inputTelemetry });
      } else {
        // default criteria is 'all'
        result = true;
      }
      if (result) {
        // generate the output telemetry object if available
        const outputTelmetryDetail = this.#outputTelemetryDetails[id];
        if (
          outputTelmetryDetail?.outputTelemetryKeyString &&
          outputTelmetryDetail?.outputMetadata
        ) {
          const outputTelmetryDatum =
            dataFrame[outputTelmetryDetail.outputTelemetryKeyString][timestamp];
          const formattedDatum = this.#formatDatumForOutput(
            outputTelmetryDatum,
            outputTelmetryDetail.outputMetadata,
            result
          );
          return formattedDatum;
        } else if (outputTelmetryDetail?.staticOutputValue) {
          const staticOutput = {
            output: outputTelmetryDetail?.staticOutputValue,
            [timekey]: timestamp,
            result: false
          };
          return staticOutput;
        }
      }
    }
  }

  async #loadTelemetryCollections() {
    await Promise.all(
      Object.entries(this.#telemetryObjects).map(async ([keystring, telemetryObject]) => {
        const telemetryCollection = this.#openmct.telemetry.requestCollection(
          telemetryObject,
          this.#telemetryOptions
        );
        await telemetryCollection.load();
        this.#telemetryCollections[keystring] = telemetryCollection;
      })
    );
  }

  #computeHistoricalData(dataFrame) {
    const historicalData = [];
    if (Object.keys(dataFrame).length === 0) {
      // if we have no telemetry data, return an empty object
      return historicalData;
    }

    // use the first telemetry collection as the reference for the frame
    const referenceTelemetryKeyString = Object.keys(dataFrame)[0];
    const referenceTelemetryCollection = this.#telemetryCollections[referenceTelemetryKeyString];
    const referenceTelemetryData = referenceTelemetryCollection.getAll();
    referenceTelemetryData.forEach((datum) => {
      const timestamp = datum[referenceTelemetryCollection.timeKey];
      const historicalDatum = this.#computeHistoricalDatum(
        timestamp,
        dataFrame,
        referenceTelemetryCollection.timeKey
      );
      if (historicalDatum) {
        historicalData.push(historicalDatum);
      }
    });
    return historicalData;
  }

  #getImputedDataUsingLOCF(datum, telemetryCollection) {
    const telemetryCollectionData = telemetryCollection.getAll();
    let insertionPointForNewData = telemetryCollection._sortedIndex(datum);
    if (insertionPointForNewData && insertionPointForNewData >= telemetryCollectionData.length) {
      insertionPointForNewData = telemetryCollectionData.length - 1;
    }
    // get the closest datum to the new datum
    const closestDatum = telemetryCollectionData[insertionPointForNewData];
    // clone the closest datum and replace the time key with the new time
    const imputedData = {
      ...closestDatum,
      [telemetryCollection.timeKey]: datum[telemetryCollection.timeKey]
    };
    return imputedData;
  }

  #createDataFrame() {
    // Step 1: Collect all unique timestamps from all telemetry collections
    const allTimestampsSet = new Set();

    Object.values(this.#telemetryCollections).forEach((collection) => {
      collection.getAll().forEach((dataPoint) => {
        const timeKey = collection.timeKey;
        allTimestampsSet.add(dataPoint[timeKey]);
      });
    });

    // Convert the set to a sorted array
    const allTimestamps = Array.from(allTimestampsSet).sort((a, b) => a - b);

    // Step 2: Initialize the result object
    const dataFrame = {};

    // Step 3: Iterate through each telemetry collection to align data
    Object.keys(this.#telemetryCollections)?.forEach((keyString) => {
      const telemetryCollection = this.#telemetryCollections[keyString];
      const alignedValues = {};

      // Iterate through each common timestamp
      allTimestamps.forEach((timestamp) => {
        const timeKey = telemetryCollection.timeKey;
        const fakeData = { [timeKey]: timestamp };
        const imputedDatum = this.#getImputedDataUsingLOCF(fakeData, telemetryCollection);
        if (imputedDatum) {
          alignedValues[timestamp] = imputedDatum;
        } else {
          console.debug(`🚨 Missing data for ${keyString} at ${timestamp}`);
        }
      });

      dataFrame[keyString] = alignedValues;
    });
    return dataFrame;
  }

  addTelemetryObject(telemetryObjectToAdd) {
    const keyString = this.#openmct.objects.makeKeyString(telemetryObjectToAdd.identifier);
    this.#telemetryObjects[keyString] = telemetryObjectToAdd;
  }

  removeTelemetryObject(telemetryObjectToRemove) {
    const keyStringToRemove = this.#openmct.objects.makeKeyString(
      telemetryObjectToRemove.identifier
    );
    this.#telemetryObjects = this.#telemetryObjects.filter((existingTelemetryObject) => {
      const existingKeyString = this.#openmct.objects.makeKeyString(existingTelemetryObject);
      return keyStringToRemove !== existingKeyString;
    });
  }

  destroy() {
    this.#composition.off('add', this.addTelemetryObject);
    this.#composition.off('remove', this.removeTelemetryObject);
    Object.keys(this.#telemetryCollections).forEach((key) => {
      this.#telemetryCollections[key]?.destroy();
    });
  }

  async #loadComposition() {
    // load the composition of the condition set
    this.#composition = this.#openmct.composition.get(this.#conditionSetDomainObject);
    if (this.#composition) {
      this.#composition.on('add', this.addTelemetryObject);
      this.#composition.on('remove', this.removeTelemetryObject);
      await this.#composition.load();
    }
  }

  #processConditionSet() {
    const conditionCollection = this.#conditionSetDomainObject.configuration.conditionCollection;
    conditionCollection.forEach((condition, index) => {
      const { outputTelemetry, outputMetadata, output } = condition.configuration;
      if (outputTelemetry && outputMetadata) {
        this.#outputTelemetryDetails[condition.id] = {
          outputTelemetryKeyString: outputTelemetry,
          outputMetadata
        };
      } else if (output) {
        this.#outputTelemetryDetails[condition.id] = {
          staticOutputValue: output
        };
      }
    });
  }

  async getHistoricalData() {
    console.debug('🍯 Getting historical data');
    // get the telemetry objects from the condition set
    await this.#loadComposition();
    console.debug('🍯 Loaded telemetry objects', this.#telemetryObjects);
    if (!this.#telemetryObjects) {
      console.debug('🚨 No telemetry objects found in condition set');
      return [];
    }
    console.debug('🍯 Processed Condition Set', this.#outputTelemetryDetails);
    this.#processConditionSet();
    // load telemetry collections for each telemetry object
    await this.#loadTelemetryCollections();
    console.debug('🍯 Loaded Telemetry Collections', this.#telemetryCollections);
    // create data frame from telemetry collections
    const dataFrame = this.#createDataFrame();
    console.debug('🍯 Created data frame', dataFrame);
    // compute historical data from data frame
    const computedHistoricalData = this.#computeHistoricalData(dataFrame);
    console.debug('🍯 Computed historical data', computedHistoricalData);
    return computedHistoricalData;
  }
}

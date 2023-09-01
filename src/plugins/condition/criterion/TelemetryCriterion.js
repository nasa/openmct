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

import EventEmitter from 'EventEmitter';

import StalenessUtils from '@/utils/staleness';

import { IS_OLD_KEY, IS_STALE_KEY } from '../utils/constants';
import { getOperatorText, OPERATIONS } from '../utils/operations';
import { checkIfOld } from '../utils/time';

export default class TelemetryCriterion extends EventEmitter {
  /**
   * Subscribes/Unsubscribes to telemetry and emits the result
   * of operations performed on the telemetry data returned and a given input value.
   * @constructor
   * @param telemetryDomainObjectDefinition {id: uuid, operation: enum, input: Array, metadata: string, key: {domainObject.identifier} }
   * @param openmct
   */
  constructor(telemetryDomainObjectDefinition, openmct) {
    super();

    this.openmct = openmct;
    this.telemetryDomainObjectDefinition = telemetryDomainObjectDefinition;
    this.id = telemetryDomainObjectDefinition.id;
    this.telemetry = telemetryDomainObjectDefinition.telemetry;
    this.operation = telemetryDomainObjectDefinition.operation;
    this.input = telemetryDomainObjectDefinition.input;
    this.metadata = telemetryDomainObjectDefinition.metadata;
    this.result = undefined;
    this.ageCheck = undefined;
    this.unsubscribeFromStaleness = undefined;

    this.initialize();
    this.emitEvent('criterionUpdated', this);
  }

  initialize() {
    this.telemetryObjectIdAsString = '';
    if (![undefined, null, ''].includes(this.telemetryDomainObjectDefinition?.telemetry)) {
      this.telemetryObjectIdAsString = this.openmct.objects.makeKeyString(
        this.telemetryDomainObjectDefinition.telemetry
      );
    }

    this.updateTelemetryObjects(this.telemetryDomainObjectDefinition.telemetryObjects);

    if (this.isValid() && this.isOldCheck() && this.isValidInput()) {
      this.checkForOldData();
    }

    if (this.isValid() && this.isStalenessCheck()) {
      this.subscribeToStaleness();
    }
  }

  usesTelemetry(id) {
    return this.telemetryObjectIdAsString && this.telemetryObjectIdAsString === id;
  }

  checkForOldData() {
    if (this.ageCheck) {
      this.ageCheck.clear();
    }

    this.ageCheck = checkIfOld(this.handleOldTelemetry.bind(this), this.input[0] * 1000);
  }

  handleOldTelemetry(data) {
    this.result = true;
    this.emitEvent('telemetryIsOld', data);
  }

  subscribeToStaleness() {
    if (this.unsubscribeFromStaleness) {
      this.unsubscribeFromStaleness();
    }

    if (!this.stalenessUtils) {
      this.stalenessUtils = new StalenessUtils(this.openmct, this.telemetryObject);
    }

    this.openmct.telemetry.isStale(this.telemetryObject).then(this.handleStaleTelemetry.bind(this));
    this.unsubscribeFromStaleness = this.openmct.telemetry.subscribeToStaleness(
      this.telemetryObject,
      this.handleStaleTelemetry.bind(this)
    );
  }

  handleStaleTelemetry(stalenessResponse) {
    if (
      stalenessResponse !== undefined &&
      this.stalenessUtils.shouldUpdateStaleness(stalenessResponse)
    ) {
      this.result = stalenessResponse.isStale;
      this.emitEvent('telemetryStaleness');
    }
  }

  isValid() {
    return this.telemetryObject && this.metadata && this.operation;
  }

  isOldCheck() {
    return this.metadata && this.metadata === 'dataReceived' && this.operation === IS_OLD_KEY;
  }

  isStalenessCheck() {
    return this.metadata && this.metadata === 'dataReceived' && this.operation === IS_STALE_KEY;
  }

  isValidInput() {
    return this.input instanceof Array && this.input.length;
  }

  updateTelemetryObjects(telemetryObjects) {
    this.telemetryObject = telemetryObjects[this.telemetryObjectIdAsString];

    if (this.isValid() && this.isOldCheck() && this.isValidInput()) {
      this.checkForOldData();
    }

    if (this.isValid() && this.isStalenessCheck()) {
      this.subscribeToStaleness();
    }
  }

  createNormalizedDatum(telemetryDatum, endpoint) {
    const id = this.openmct.objects.makeKeyString(endpoint.identifier);
    const metadata = this.openmct.telemetry.getMetadata(endpoint).valueMetadatas;

    const normalizedDatum = Object.values(metadata).reduce((datum, metadatum) => {
      const formatter = this.openmct.telemetry.getValueFormatter(metadatum);
      datum[metadatum.key] = formatter.parse(telemetryDatum[metadatum.source]);

      return datum;
    }, {});

    normalizedDatum.id = id;

    return normalizedDatum;
  }

  formatData(data) {
    const datum = {
      result: this.computeResult(data)
    };

    if (data) {
      this.openmct.time.getAllTimeSystems().forEach((timeSystem) => {
        datum[timeSystem.key] = data[timeSystem.key];
      });
    }

    return datum;
  }

  updateResult(data) {
    const validatedData = this.isValid() ? data : {};

    if (!this.isStalenessCheck()) {
      if (this.isOldCheck()) {
        if (this.ageCheck) {
          this.ageCheck.update(validatedData);
        }

        this.result = false;
      } else {
        this.result = this.computeResult(validatedData);
      }
    }
  }

  requestLAD(telemetryObjects, requestOptions) {
    //We pass in the global time context here
    let options = {
      strategy: 'latest',
      size: 1,
      timeContext: this.openmct.time.getContextForView([])
    };

    if (requestOptions !== undefined) {
      options = Object.assign(options, requestOptions);
    }

    if (!this.isValid()) {
      return {
        id: this.id,
        data: this.formatData({})
      };
    }

    let telemetryObject = this.telemetryObject;

    return this.openmct.telemetry
      .request(this.telemetryObject, options)
      .then((results) => {
        const latestDatum = results.length ? results[results.length - 1] : {};
        const normalizedDatum = this.createNormalizedDatum(latestDatum, telemetryObject);

        return {
          id: this.id,
          data: this.formatData(normalizedDatum)
        };
      })
      .catch((error) => {
        return {
          id: this.id,
          data: this.formatData()
        };
      });
  }

  findOperation(operation) {
    for (let i = 0, ii = OPERATIONS.length; i < ii; i++) {
      if (operation === OPERATIONS[i].name) {
        return OPERATIONS[i].operation;
      }
    }

    return null;
  }

  computeResult(data) {
    let result = false;
    if (data) {
      let comparator = this.findOperation(this.operation);
      let params = [];
      params.push(data[this.metadata]);
      if (this.isValidInput()) {
        this.input.forEach((input) => params.push(input));
      }

      if (typeof comparator === 'function') {
        result = Boolean(comparator(params));
      }
    }

    return result;
  }

  emitEvent(eventName, data) {
    this.emit(eventName, {
      id: this.id,
      data: data
    });
  }

  getMetaDataObject(telemetryObject, metadata) {
    let metadataObject;
    if (metadata) {
      const telemetryMetadata = this.openmct.telemetry.getMetadata(telemetryObject);
      if (telemetryMetadata) {
        metadataObject = telemetryMetadata.valueMetadatas.find(
          (valueMetadata) => valueMetadata.key === metadata
        );
      }
    }

    return metadataObject;
  }

  getInputValueFromMetaData(metadataObject, input) {
    let inputValue;
    if (metadataObject) {
      if (metadataObject.enumerations && input.length) {
        const enumeration = metadataObject.enumerations.find(
          (item) => item.value.toString() === input[0].toString()
        );
        if (enumeration !== undefined && enumeration.string) {
          inputValue = [enumeration.string];
        }
      }
    }

    return inputValue;
  }

  getMetadataValueFromMetaData(metadataObject) {
    let metadataValue;
    if (metadataObject) {
      if (metadataObject.name) {
        metadataValue = metadataObject.name;
      }
    }

    return metadataValue;
  }

  getDescription(criterion, index) {
    let description;
    if (!this.telemetry || !this.telemetryObject || this.telemetryObject.type === 'unknown') {
      description = `Unknown ${this.metadata} ${getOperatorText(this.operation, this.input)}`;
    } else {
      const metadataObject = this.getMetaDataObject(this.telemetryObject, this.metadata);
      const metadataValue =
        this.getMetadataValueFromMetaData(metadataObject) ||
        (this.metadata === 'dataReceived' ? '' : this.metadata);
      const inputValue = this.getInputValueFromMetaData(metadataObject, this.input) || this.input;
      description = `${this.telemetryObject.name} ${metadataValue} ${getOperatorText(
        this.operation,
        inputValue
      )}`;
    }

    return description;
  }

  destroy() {
    delete this.telemetryObject;
    delete this.telemetryObjectIdAsString;

    if (this.ageCheck) {
      delete this.ageCheck;
    }

    if (this.stalenessUtils) {
      this.stalenessUtils.destroy();
    }

    if (this.unsubscribeFromStaleness) {
      this.unsubscribeFromStaleness();
    }
  }
}

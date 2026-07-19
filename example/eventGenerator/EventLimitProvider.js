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

export const SEVERITY_CSS = {
  WATCH: 'is-event--yellow',
  WARNING: 'is-event--yellow',
  DISTRESS: 'is-event--red',
  CRITICAL: 'is-event--red',
  SEVERE: 'is-event--purple'
};

const NOMINAL_SEVERITY = {
  cssClass: 'is-event--no-style',
  name: 'NOMINAL'
};

/**
 * @typedef {Object} EvaluationResult
 * @property {string} cssClass CSS class information
 * @property {string} name a severity name
 */
export default class EventLimitProvider {
  constructor(openmct) {
    this.openmct = openmct;
  }

  getLimitEvaluator(domainObject) {
    const self = this;

    return {
      /**
       * Evaluates a telemetry datum for severity.
       *
       * @param {Datum} datum the telemetry datum from the historical or realtime plugin ({@link Datum})
       * @param {object} valueMetadata metadata about the telemetry datum
       *
       * @returns {EvaluationResult} ({@link EvaluationResult})
       */
      evaluate: function (datum, valueMetadata) {
        // prevent applying the class to the tr, only to td
        if (!valueMetadata) {
          return;
        }

        if (datum.severity in SEVERITY_CSS) {
          return self.getSeverity(datum, valueMetadata);
        }

        return NOMINAL_SEVERITY;
      }
    };
  }
  getSeverity(datum, valueMetadata) {
    if (!valueMetadata) {
      return;
    }

    const severityValue = datum.severity;

    return {
      cssClass: SEVERITY_CSS[severityValue],
      name: severityValue
    };
  }

  supportsLimits(domainObject) {
    return domainObject.type === 'eventGenerator';
  }
}

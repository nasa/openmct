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

const SEVERITIES = ['WATCH', 'WARNING', 'CRITICAL'];
const MOONWALK_TIMESTAMP = 14159040000;
const NAMESPACE = '/Example/fault-';
const getRandom = {
  severity: () => SEVERITIES[Math.floor(Math.random() * 3)],
  value: () => Math.random() + Math.floor(Math.random() * 21) - 10,
  fault: (num, staticFaults) => {
    let val = getRandom.value();
    let severity = getRandom.severity();
    let time = Date.now() - num;

    if (staticFaults) {
      let severityIndex = num > 3 ? num % 3 : num;

      val = num;
      severity = SEVERITIES[severityIndex - 1];
      // Subtract `num` from the timestamp so that the faults are in order
      time = MOONWALK_TIMESTAMP - num; // Mon, 21 Jul 1969 02:56:00 GMT 🌔👨‍🚀👨‍🚀👨‍🚀
    }

    return {
      type: num,
      fault: {
        acknowledged: false,
        currentValueInfo: {
          value: val,
          rangeCondition: severity,
          monitoringResult: severity
        },
        id: `id-${num}`,
        name: `Example Fault ${num}`,
        namespace: NAMESPACE + num,
        seqNum: 0,
        severity: severity,
        shelved: false,
        shortDescription: '',
        triggerTime: time,
        triggerValueInfo: {
          value: val,
          rangeCondition: severity,
          monitoringResult: severity
        }
      }
    };
  }
};

export function shelveFault(fault, opts = { shelved: true, comment: '', shelveDuration: 90000 }) {
  fault.shelved = true;

  setTimeout(() => {
    fault.shelved = false;
  }, opts.shelveDuration);
}

export function acknowledgeFault(fault) {
  fault.acknowledged = true;
}

export function randomFaults(staticFaults, count = 5) {
  let faults = [];

  for (let i = 1; i <= count; i++) {
    faults.push(getRandom.fault(i, staticFaults));
  }

  return faults;
}

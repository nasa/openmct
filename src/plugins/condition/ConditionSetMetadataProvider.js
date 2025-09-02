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

export default class ConditionSetMetadataProvider {
  constructor(openmct) {
    this.openmct = openmct;
  }

  supportsMetadata(domainObject) {
    return domainObject.type === 'conditionSet';
  }

  getDomains(domainObject) {
    return this.openmct.time.getAllTimeSystems().map(function (ts, i) {
      return {
        key: ts.key,
        name: ts.name,
        format: ts.timeFormat,
        hints: {
          domain: i
        }
      };
    });
  }

  getMetadata(domainObject) {
    const enumerations = domainObject.configuration.conditionCollection.map((condition, index) => {
      return {
        string: condition.configuration.output,
        value: index
      };
    });

    return {
      values: this.getDomains().concat([
        {
          key: 'state',
          source: 'output',
          name: 'State',
          format: 'enum',
          enumerations: enumerations,
          hints: {
            range: 1
          }
        },
        {
          key: 'output',
          name: 'Value',
          format: 'string',
          hints: {
            range: 2
          }
        }
      ])
    };
  }
}

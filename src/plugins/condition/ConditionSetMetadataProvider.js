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

  getDefaultDomains(domainObject) {
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
    const format = {};
    domainObject.configuration.conditionCollection.forEach((condition, index) => {
      if (condition?.configuration?.valueMetadata?.enumerations) {
        delete format.formatString;
        format.format = 'enum';
        format.enumerations = condition?.configuration?.valueMetadata?.enumerations;
      }
    });

    const resultEnum = [
      {
        string: 'true',
        value: true
      },
      {
        string: 'false',
        value: false
      }
    ];

    const metaDataToReturn = {
      values: [
        {
          key: 'value',
          name: 'Value',
          hints: {
            range: 1
          }
        },
        {
          key: 'result',
          source: 'result',
          name: 'Result',
          format: 'enum',
          enumerations: resultEnum,
          hints: {
            range: 2
          }
        }
      ]
    };

    // if there are any parameters, grab the first one's timeMetaData
    const timeMetaData =
      domainObject?.configuration?.conditionCollection[0]?.configuration.timeMetadata;

    if (timeMetaData) {
      metaDataToReturn.values.push(timeMetaData);
    } else {
      const defaultDomains = this.getDefaultDomains(domainObject);
      metaDataToReturn.values.push(...defaultDomains);
    }

    return metaDataToReturn;
  }
}

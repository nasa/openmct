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

const METADATA_BY_TYPE = {
  generator: {
    values: [
      {
        key: 'name',
        name: 'Name',
        format: 'string'
      },
      {
        key: 'utc',
        name: 'Time',
        format: 'utc',
        hints: {
          domain: 1
        }
      },
      {
        key: 'yesterday',
        name: 'Yesterday',
        format: 'utc',
        hints: {
          domain: 2
        }
      },
      {
        key: 'wavelengths',
        name: 'Wavelength',
        unit: 'nm',
        format: 'string[]',
        hints: {
          range: 4
        }
      },
      // Need to enable "LocalTimeSystem" plugin to make use of this
      // {
      //     key: "local",
      //     name: "Time",
      //     format: "local-format",
      //     source: "utc",
      //     hints: {
      //         domain: 3
      //     }
      // },
      {
        key: 'sin',
        name: 'Sine',
        unit: 'Hz',
        formatString: '%0.2f',
        hints: {
          range: 1
        }
      },
      {
        key: 'cos',
        name: 'Cosine',
        unit: 'deg',
        formatString: '%0.2f',
        hints: {
          range: 2
        }
      },
      {
        key: 'intensities',
        name: 'Intensities',
        format: 'number[]',
        hints: {
          range: 3
        }
      }
    ]
  },
  'example.state-generator': {
    values: [
      {
        key: 'name',
        name: 'Name',
        format: 'string'
      },
      {
        key: 'utc',
        name: 'Time',
        format: 'utc',
        hints: {
          domain: 1
        }
      },
      {
        key: 'local',
        name: 'Time',
        format: 'utc',
        source: 'utc',
        hints: {
          domain: 2
        }
      },
      {
        key: 'state',
        source: 'value',
        name: 'State',
        format: 'enum',
        enumerations: [
          {
            value: 0,
            string: 'OFF'
          },
          {
            value: 1,
            string: 'ON'
          }
        ],
        hints: {
          range: 1
        }
      },
      {
        key: 'value',
        name: 'Value',
        hints: {
          range: 2
        }
      }
    ]
  }
};

function GeneratorMetadataProvider() {}

GeneratorMetadataProvider.prototype.supportsMetadata = function (domainObject) {
  return Object.prototype.hasOwnProperty.call(METADATA_BY_TYPE, domainObject.type);
};

GeneratorMetadataProvider.prototype.getMetadata = function (domainObject) {
  return Object.assign({}, domainObject.telemetry, METADATA_BY_TYPE[domainObject.type]);
};

export { GeneratorMetadataProvider };

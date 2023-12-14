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

export const mockTelemetryTableSelection = [
  [
    {
      context: {
        item: {
          configuration: {},
          type: 'table',
          identifier: {
            key: 'mock-telemetry-table-1',
            namespace: ''
          }
        }
      }
    }
  ]
];

export const mockStyle = {
  backgroundColor: '#ff0000',
  border: '#ff0000',
  color: '#ff0000'
};

const mockDisplayLayoutPath = {
  context: {
    item: {
      identifier: {
        key: '6af3200d-928b-4ff0-8ed0-b94a0e6752d1',
        namespace: ''
      },
      type: 'layout',
      configuration: {
        items: [
          {
            id: 'dd3202e5-40d0-4112-8951-00f0f1ed6a29',
            type: 'text-view',
            fontSize: 'default',
            font: 'default'
          },
          {
            id: 'b522d636-90b2-4f5f-9588-2a0345c30f87',
            type: 'text-view',
            fontSize: 'default',
            font: 'default'
          },
          {
            id: '537b7596-b442-44fe-b464-07f56bdc67c8',
            type: 'text-view',
            fontSize: 'default',
            font: 'default'
          },
          {
            id: '3f17162f-a822-4e39-8332-6aa39b79d022',
            type: 'text-view',
            fontSize: 'default',
            font: 'default'
          },
          {
            id: 'c1c5acd8-a14b-450c-8c94-ce0075dd9912',
            type: 'text-view',
            fontSize: '8',
            font: 'monospace-bold'
          }
        ],
        objectStyles: {
          'dd3202e5-40d0-4112-8951-00f0f1ed6a29': {
            staticStyle: {
              style: {
                backgroundColor: '#0000ff',
                border: '1px solid #0000ff'
              }
            }
          },
          'b522d636-90b2-4f5f-9588-2a0345c30f87': {
            staticStyle: {
              style: {
                backgroundColor: '#ff0000',
                border: '1px solid #ff0000'
              }
            }
          },
          '537b7596-b442-44fe-b464-07f56bdc67c8': {
            staticStyle: {
              style: {
                backgroundColor: '#ff0000',
                border: '1px solid #ff0000'
              }
            }
          },
          '3f17162f-a822-4e39-8332-6aa39b79d022': {
            staticStyle: {
              style: {
                backgroundColor: '#0000ff',
                border: '1px solid #0000ff',
                color: '#0000ff'
              }
            }
          },
          'c1c5acd8-a14b-450c-8c94-ce0075dd9912': {
            staticStyle: {
              style: {
                backgroundColor: '#0000ff',
                border: '1px solid #0000ff',
                color: '#0000ff'
              }
            }
          }
        }
      }
    },
    supportsMultiSelect: true
  }
};

const mockTextBox1Path = {
  context: {
    index: 0,
    layoutItem: {
      id: 'dd3202e5-40d0-4112-8951-00f0f1ed6a29',
      type: 'text-view',
      fontSize: 'default',
      font: 'default'
    }
  }
};

const mockTextBox2Path = {
  context: {
    index: 1,
    layoutItem: {
      id: 'b522d636-90b2-4f5f-9588-2a0345c30f87',
      type: 'text-view',
      fontSize: 'default',
      font: 'default'
    }
  }
};

const mockTextBox3Path = {
  context: {
    index: 2,
    layoutItem: {
      id: '537b7596-b442-44fe-b464-07f56bdc67c8',
      type: 'text-view',
      fontSize: 'default',
      font: 'default'
    }
  }
};

const mockTextBox4Path = {
  context: {
    index: 3,
    layoutItem: {
      id: '3f17162f-a822-4e39-8332-6aa39b79d022',
      type: 'text-view',
      fontSize: 'default',
      font: 'default'
    }
  }
};

const mockTextBox5Path = {
  context: {
    index: 4,
    layoutItem: {
      id: 'c1c5acd8-a14b-450c-8c94-ce0075dd9912',
      type: 'text-view',
      fontSize: '8',
      font: 'default-bold'
    }
  }
};

export const mockMultiSelectionSameStyles = [
  [mockTextBox2Path, mockDisplayLayoutPath],
  [mockTextBox3Path, mockDisplayLayoutPath]
];

export const mockMultiSelectionMixedStyles = [
  [mockTextBox1Path, mockDisplayLayoutPath],
  [mockTextBox2Path, mockDisplayLayoutPath]
];

export const mockMultiSelectionNonSpecificStyles = [
  [mockTextBox4Path, mockDisplayLayoutPath],
  [mockTextBox5Path, mockDisplayLayoutPath]
];

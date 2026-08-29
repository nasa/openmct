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
import { createOpenMct, resetApplicationState } from 'utils/testing';

import CustomStringFormatter from './CustomStringFormatter.js';

const CUSTOM_FORMATS = [
  {
    key: 'sclk',
    format: (value) => 2 * value
  },
  {
    key: 'lts',
    format: (value) => 3 * value
  }
];

const valueMetadata = {
  key: 'sin',
  name: 'Sine',
  unit: 'Hz',
  formatString: '%0.2f',
  hints: {
    range: 1,
    priority: 3
  },
  source: 'sin'
};

const datum = {
  name: '1 Sine Wave Generator',
  utc: 1603930354000,
  yesterday: 1603843954000,
  sin: 0.587785209686822,
  cos: -0.8090170253297632
};

describe('CustomStringFormatter', function () {
  let element;
  let child;
  let openmct;
  let customStringFormatter;

  beforeEach((done) => {
    openmct = createOpenMct();

    element = document.createElement('div');
    child = document.createElement('div');
    element.appendChild(child);
    CUSTOM_FORMATS.forEach((formatter) => {
      openmct.telemetry.addFormat(formatter);
    });
    openmct.on('start', done);
    openmct.startHeadless();

    customStringFormatter = new CustomStringFormatter(openmct, valueMetadata);
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  it('adds custom format sclk', () => {
    const format = openmct.telemetry.getFormatter('sclk');
    expect(format.key).toEqual('sclk');
  });

  it('adds custom format lts', () => {
    const format = openmct.telemetry.getFormatter('lts');
    expect(format.key).toEqual('lts');
  });

  it('returns correct value for custom format sclk', () => {
    customStringFormatter.setFormat('&sclk');
    const value = customStringFormatter.format(datum, valueMetadata);
    expect(datum.sin * 2).toEqual(value);
  });

  it('returns correct value for custom format lts', () => {
    customStringFormatter.setFormat('&lts');
    const value = customStringFormatter.format(datum, valueMetadata);
    expect(datum.sin * 3).toEqual(value);
  });
});

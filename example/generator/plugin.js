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

import GeneratorMetadataProvider from './GeneratorMetadataProvider.js';
import GeneratorProvider from './GeneratorProvider.js';
import SinewaveLimitProvider from './SinewaveLimitProvider.js';
import SinewaveStalenessProvider from './SinewaveStalenessProvider.js';
import StateGeneratorProvider from './StateGeneratorProvider.js';

export default function (openmct) {
  openmct.types.addType('example.state-generator', {
    name: 'State Generator',
    description:
      'For development use. Generates example enumerated telemetry by cycling through a given set of states.',
    cssClass: 'icon-generator-telemetry',
    creatable: true,
    form: [
      {
        name: 'State Duration (seconds)',
        control: 'numberfield',
        cssClass: 'l-input-sm l-numeric',
        key: 'duration',
        required: true,
        property: ['telemetry', 'duration']
      }
    ],
    initialize: function (object) {
      object.telemetry = {
        duration: 5
      };
    }
  });

  openmct.telemetry.addProvider(new StateGeneratorProvider());

  openmct.types.addType('generator', {
    name: 'Sine Wave Generator',
    description:
      'For development use. Generates example streaming telemetry data using a simple sine wave algorithm.',
    cssClass: 'icon-generator-telemetry',
    creatable: true,
    form: [
      {
        name: 'Period',
        control: 'numberfield',
        cssClass: 'l-input-sm l-numeric',
        key: 'period',
        required: true,
        property: ['telemetry', 'period']
      },
      {
        name: 'Amplitude',
        control: 'numberfield',
        cssClass: 'l-numeric',
        key: 'amplitude',
        required: true,
        property: ['telemetry', 'amplitude']
      },
      {
        name: 'Offset',
        control: 'numberfield',
        cssClass: 'l-numeric',
        key: 'offset',
        required: true,
        property: ['telemetry', 'offset']
      },
      {
        name: 'Data Rate (hz)',
        control: 'numberfield',
        cssClass: 'l-input-sm l-numeric',
        key: 'dataRateInHz',
        required: true,
        property: ['telemetry', 'dataRateInHz']
      },
      {
        name: 'Phase (radians)',
        control: 'numberfield',
        cssClass: 'l-input-sm l-numeric',
        key: 'phase',
        required: true,
        property: ['telemetry', 'phase']
      },
      {
        name: 'Randomness',
        control: 'numberfield',
        cssClass: 'l-input-sm l-numeric',
        key: 'randomness',
        required: true,
        property: ['telemetry', 'randomness']
      },
      {
        name: 'Loading Delay (ms)',
        control: 'numberfield',
        cssClass: 'l-input-sm l-numeric',
        key: 'loadDelay',
        required: true,
        property: ['telemetry', 'loadDelay']
      },
      {
        name: 'Include Infinity Values',
        control: 'toggleSwitch',
        cssClass: 'l-input',
        key: 'infinityValues',
        property: ['telemetry', 'infinityValues']
      },
      {
        name: 'Exceed Float32 Limits',
        control: 'toggleSwitch',
        cssClass: 'l-input',
        key: 'exceedFloat32',
        property: ['telemetry', 'exceedFloat32']
      },
      {
        name: 'Provide Staleness Updates',
        control: 'toggleSwitch',
        cssClass: 'l-input',
        key: 'staleness',
        property: ['telemetry', 'staleness']
      }
    ],
    initialize: function (object) {
      object.telemetry = {
        period: 10,
        amplitude: 1,
        offset: 0,
        dataRateInHz: 1,
        phase: 0,
        randomness: 0,
        loadDelay: 0,
        infinityValues: false,
        exceedFloat32: false,
        staleness: false
      };
    }
  });
  const stalenessProvider = new SinewaveStalenessProvider(openmct);

  openmct.telemetry.addProvider(new GeneratorProvider(openmct, stalenessProvider));
  openmct.telemetry.addProvider(new GeneratorMetadataProvider());
  openmct.telemetry.addProvider(new SinewaveLimitProvider());
  openmct.telemetry.addProvider(stalenessProvider);
}

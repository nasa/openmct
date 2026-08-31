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

import {
  CAPSULE_IDENTIFIER,
  CAPSULE_KEY,
  CAPSULE_TYPE,
  ROOT_IDENTIFIER,
  ROOT_KEY,
  STREAM_IDENTIFIER,
  STREAM_KEY,
  STREAM_TYPE,
  TELEMETRY_VALUES,
  VERIFICATION_NAMESPACE
} from './constants.js';

export default class VerificationObjectProvider {
  constructor() {
    this.objects = new Map([
      [
        ROOT_KEY,
        {
          identifier: ROOT_IDENTIFIER,
          name: 'Verification Telemetry',
          type: 'folder',
          location: 'ROOT'
        }
      ],
      [
        CAPSULE_KEY,
        {
          identifier: CAPSULE_IDENTIFIER,
          name: 'Sample Verification Capsule',
          type: CAPSULE_TYPE,
          location: `${VERIFICATION_NAMESPACE}:${ROOT_KEY}`
        }
      ],
      [
        STREAM_KEY,
        {
          identifier: STREAM_IDENTIFIER,
          name: 'Sample Verification Events',
          type: STREAM_TYPE,
          location: `${VERIFICATION_NAMESPACE}:${CAPSULE_KEY}`,
          telemetry: {
            values: TELEMETRY_VALUES
          }
        }
      ]
    ]);
  }

  get(identifier) {
    return Promise.resolve(this.objects.get(identifier.key));
  }

  search() {
    return Promise.resolve([]);
  }
}

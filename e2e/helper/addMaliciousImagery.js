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
document.addEventListener('DOMContentLoaded', () => {
  const openmct = window.openmct;

  const maliciousTypeConfig = {
    key: 'malicious.imagery',
    name: 'Malicious Test Imagery',
    cssClass: 'icon-image',
    creatable: true,
    initialize: (object) => {
      object.telemetry = {
        values: [
          { name: 'Time', key: 'utc', format: 'utc', hints: { domain: 1 } },
          { name: 'Image', key: 'url', format: 'image', hints: { image: 1 } }
        ]
      };
    }
  };

  const mockProvider = {
    supportsRequest: (domainObject) => domainObject.type === 'malicious.imagery',
    request: (domainObject) => {
      return Promise.resolve([
        {
          utc: Date.now(),
          url: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7#javascript:alert(1)'
        }
      ]);
    }
  };

  openmct.types.addType(maliciousTypeConfig.key, maliciousTypeConfig);
  openmct.telemetry.addProvider(mockProvider);
});

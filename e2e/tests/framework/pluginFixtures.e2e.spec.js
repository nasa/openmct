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

/*
This test suite is dedicated to testing our use of our custom fixtures to verify
that they are working as expected.
*/

const { test } = require('../../pluginFixtures.js');

// eslint-disable-next-line playwright/no-skipped-test
test.describe.skip('pluginFixtures tests', () => {
  // test.use({ domainObjectName: 'Timer' });
  // let timerUUID;
  // test('Creates a timer object @framework @unstable', ({ domainObject }) => {
  //     const { uuid } = domainObject;
  //     const uuidRegexp = /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/;
  //     expect(uuid).toMatch(uuidRegexp);
  //     timerUUID = uuid;
  // });
  // test('Provides same uuid for subsequent uses of the same object @framework', ({ domainObject }) => {
  //     const { uuid } = domainObject;
  //     expect(uuid).toEqual(timerUUID);
  // });
});

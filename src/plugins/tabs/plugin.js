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
import Tabs from './tabs.js';

export default function plugin(options) {
  return function install(openmct) {
    const eagerLoad = options?.eagerLoad ?? false;

    openmct.objectViews.addProvider(new Tabs(openmct));

    openmct.types.addType('tabs', {
      name: 'Tabs View',
      description: 'Quickly navigate between multiple objects of any type using tabs.',
      creatable: true,
      cssClass: 'icon-tabs-view',
      initialize(domainObject) {
        domainObject.composition = [];
        domainObject.keep_alive = eagerLoad;
      },
      form: [
        {
          key: 'keep_alive',
          name: 'Eager Load Tabs',
          control: 'toggleSwitch',
          options: [
            {
              name: 'True',
              value: true
            },
            {
              name: 'False',
              value: false
            }
          ],
          required: true,
          cssClass: 'l-input'
        }
      ]
    });
  };
}

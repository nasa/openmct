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

import FlexibleLayoutViewProvider from './flexibleLayoutViewProvider.js';
import ToolBarProvider from './toolbarProvider.js';
import Container from './utils/container.js';

export default function plugin() {
  return function install(openmct) {
    openmct.objectViews.addProvider(new FlexibleLayoutViewProvider(openmct));

    openmct.types.addType('flexible-layout', {
      name: 'Flexible Layout',
      creatable: true,
      description:
        'A fluid, flexible layout canvas that can display multiple objects in rows or columns.',
      cssClass: 'icon-flexible-layout',
      initialize: function (domainObject) {
        domainObject.configuration = {
          containers: [new Container(50), new Container(50)],
          rowsLayout: false
        };
        domainObject.composition = [];
      }
    });

    let toolbar = ToolBarProvider(openmct);

    openmct.toolbars.addProvider(toolbar);
  };
}

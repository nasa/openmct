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

import TimelistViewProvider from './TimelistViewProvider';
import { TIMELIST_TYPE } from './constants';
import TimeListInspectorViewProvider from './inspector/TimeListInspectorViewProvider';
import TimelistCompositionPolicy from '@/plugins/timelist/TimelistCompositionPolicy';

export default function () {
  return function install(openmct) {
    openmct.types.addType(TIMELIST_TYPE, {
      name: 'Time List',
      key: TIMELIST_TYPE,
      description:
        'A configurable, time-ordered list view of activities for a compatible mission plan file.',
      creatable: true,
      cssClass: 'icon-timelist',
      initialize: function (domainObject) {
        domainObject.configuration = {
          sortOrderIndex: 0,
          futureEventsIndex: 1,
          futureEventsDurationIndex: 0,
          futureEventsDuration: 20,
          currentEventsIndex: 1,
          currentEventsDurationIndex: 0,
          currentEventsDuration: 20,
          pastEventsIndex: 1,
          pastEventsDurationIndex: 0,
          pastEventsDuration: 20,
          filter: ''
        };
        domainObject.composition = [];
      }
    });
    openmct.objectViews.addProvider(new TimelistViewProvider(openmct));
    openmct.inspectorViews.addProvider(new TimeListInspectorViewProvider(openmct));
    openmct.composition.addPolicy(new TimelistCompositionPolicy(openmct).allow);
  };
}

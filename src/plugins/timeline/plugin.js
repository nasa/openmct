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

import TimelineViewProvider from './TimelineViewProvider';
import timelineInterceptor from './timelineInterceptor';
import TimelineCompositionPolicy from './TimelineCompositionPolicy';

export default function () {
  return function install(openmct) {
    openmct.types.addType('time-strip', {
      name: 'Time Strip',
      key: 'time-strip',
      description:
        'Compose and display time-based telemetry and other object types in a timeline-like view.',
      creatable: true,
      cssClass: 'icon-timeline',
      initialize: function (domainObject) {
        domainObject.composition = [];
        domainObject.configuration = {
          useIndependentTime: false
        };
      }
    });
    timelineInterceptor(openmct);
    openmct.composition.addPolicy(new TimelineCompositionPolicy(openmct).allow);

    openmct.objectViews.addProvider(new TimelineViewProvider(openmct));
  };
}

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

import activityStatesInterceptor from '../activityStates/activityStatesInterceptor.js';
import { createActivityStatesIdentifier } from '../activityStates/createActivityStatesIdentifier.js';
import ganttChartCompositionPolicy from './GanttChartCompositionPolicy.js';
import ActivityInspectorViewProvider from './inspector/ActivityInspectorViewProvider.js';
import GanttChartInspectorViewProvider from './inspector/GanttChartInspectorViewProvider.js';
import { DEFAULT_CONFIGURATION } from './PlanViewConfiguration.js';
import PlanViewProvider from './PlanViewProvider.js';

const ACTIVITY_STATES_DEFAULT_NAME = 'Activity States';
/**
 * @typedef {Object} PlanOptions
 * @property {boolean} creatable true/false to allow creation of a plan via the Create menu.
 * @property {string} name The name of the activity states model.
 * @property {string} namespace the namespace to use for the activity states object.
 * @property {number} priority the priority of the interceptor. By default, it is low.
 */

/**
 *
 * @param {PlanOptions} options
 * @returns {*} (any)
 */
export default function (options = {}) {
  return function install(openmct) {
    openmct.actions.register({
      key: 'generate-random-plan',
      async invoke(objectPath) {
        const parent = objectPath[0];
        const newKey = crypto.randomUUID();
        const randomActivities = {
          'Driving': {activities: ["Driving", "Pano", "Driver Change"], color: "orange"},
          'Drilling': {activities: ["Take Bite", "Stow Drill"], color: "blue"},
          'Comm':  {activities: ["LOS", "AOS", "DSN Handover"], color: "green"},
          'Science': {activities: ["AIM Image", "NIRVSS Spec.", "NSS ON", "MSOLO ON", "MSOLO OFF", "NSS OFF"], color: "gray"}
        }
        const start = Date.now() - 24 * 60 * 60 * 1000;
        const end = Date.now() + 24 * 60 * 60 * 1000;
        const groups = Object.keys(randomActivities);
        let activityStart = start;
        let activityEnd = start;
        let randomPlan = {};

        while (activityEnd < end) {
          activityStart = activityEnd;
          activityEnd = activityStart + 1000000 + Math.random() * 1000000;
          let randomGroup = groups[Math.round(Math.random() * (groups.length - 1))];
          let namesForGroup = randomActivities[randomGroup].activities;
          let randomName = namesForGroup[Math.round(Math.random() * (namesForGroup.length - 1))];
          randomPlan[randomGroup] = randomPlan[randomGroup] || [];
          randomPlan[randomGroup].push({
            name: randomName,
            start: activityStart,
            end: activityEnd,
            type: randomGroup,
            color: randomActivities[randomGroup].color,
            textColor: "white",
          });
        }
        const newPlanObject = {
          identifier: {
            namespace: parent.identifier.namespace,
            key: newKey
          },
          type: 'plan',
          name: `Random plan ${newKey}`,
          selectFile: {
            body: randomPlan
          }
        };
        await openmct.objects.save(newPlanObject);
        const composition = await openmct.composition.get(parent);
        composition.add(newPlanObject);
      },
      name: 'Generate plan'
    });
    openmct.types.addType('plan', {
      name: 'Plan',
      key: 'plan',
      description: 'A non-configurable timeline-like view for a compatible plan file.',
      creatable: options.creatable ?? false,
      cssClass: 'icon-plan',
      form: [
        {
          name: 'Upload Plan (JSON File)',
          key: 'selectFile',
          control: 'file-input',
          required: true,
          text: 'Select File...',
          type: 'application/json',
          property: ['selectFile']
        }
      ],
      initialize: function (domainObject) {
        domainObject.configuration = {
          clipActivityNames: DEFAULT_CONFIGURATION.clipActivityNames
        };
      }
    });

    // Name TBD and subject to change
    openmct.types.addType('gantt-chart', {
      name: 'Gantt Chart',
      key: 'gantt-chart',
      description: 'A configurable timeline-like view for a compatible plan file.',
      creatable: true,
      cssClass: 'icon-plan',
      form: [],
      initialize(domainObject) {
        domainObject.configuration = {
          clipActivityNames: true
        };
        domainObject.composition = [];
      }
    });
    openmct.objectViews.addProvider(new PlanViewProvider(openmct));
    openmct.inspectorViews.addProvider(new ActivityInspectorViewProvider(openmct));
    openmct.inspectorViews.addProvider(new GanttChartInspectorViewProvider(openmct));
    openmct.composition.addPolicy(ganttChartCompositionPolicy(openmct));

    //add activity states get interceptor
    const { name = ACTIVITY_STATES_DEFAULT_NAME, namespace = '', priority } = options;
    const identifier = createActivityStatesIdentifier(namespace);

    openmct.objects.addGetInterceptor(
      activityStatesInterceptor(openmct, { identifier, name, priority })
    );
  };
}

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

import { ACTIVITY_STATES_KEY } from './createActivityStatesIdentifier.js';

/**
 * @typedef {Object} ActivityStatesInterceptorOptions
 * @property {import('../../api/objects/ObjectAPI').Identifier} identifier the {namespace, key} to use for the activity states object.
 * @property {string} name The name of the activity states model.
 * @property {number} priority the priority of the interceptor. By default, it is low.
 */

/**
 * Creates an activity states object in the persistence store. This is used to save plan activity states.
 * This will only get invoked when an attempt is made to save the state for an activity and no activity states object exists in the store.
 * @param {import('../../../openmct').OpenMCT} openmct
 * @param {ActivityStatesInterceptorOptions} options
 * @returns {Object}
 */
const ACTIVITY_STATES_TYPE = 'activity-states';

function activityStatesInterceptor(openmct, options) {
  const { identifier, name, priority = openmct.priority.LOW } = options;
  const activityStatesModel = {
    identifier,
    name,
    type: ACTIVITY_STATES_TYPE,
    activities: {},
    location: null
  };

  return {
    appliesTo: (identifierObject) => {
      return identifierObject.key === ACTIVITY_STATES_KEY;
    },
    invoke: (identifierObject, object) => {
      if (!object || openmct.objects.isMissing(object)) {
        openmct.objects.save(activityStatesModel);

        return activityStatesModel;
      }

      return object;
    },
    priority
  };
}

export default activityStatesInterceptor;

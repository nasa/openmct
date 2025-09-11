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

import { PLAN_EXECUTION_MONITORING_KEY } from './planExecutionMonitoringIdentifier.js';

/**
 * @typedef {Object} PlanExecutionMonitoringOptions
 * @property {import('openmct').Identifier} identifier the {namespace, key} to use for the plan execution monitoring object.
 * @property {string} name The name of the plan execution monitoring model.
 * @property {number} priority the priority of the interceptor. By default, it is low.
 */

/**
 * Creates an plan execution monitoring object in the persistence store. This is used to save plan plan execution monitoring.
 * This will only get invoked when an attempt is made to save the execution monitoring information for a plan and no plan execution monitoring object exists in the store.
 * @param {import('../../../openmct').OpenMCT} openmct
 * @param {PlanExecutionMonitoringOptions} options
 * @returns {Object}
 */
const PLAN_EXECUTION_MONITORING_TYPE = 'plan-execution-monitoring';

function planExecutionMonitoringInterceptor(openmct, options) {
  const { identifier, name, priority = openmct.priority.LOW } = options;
  const planExecutionMonitoringModel = {
    identifier,
    name,
    type: PLAN_EXECUTION_MONITORING_TYPE,
    execution_monitoring: {},
    location: null
  };

  return {
    appliesTo: (identifierObject) => {
      return identifierObject.key === PLAN_EXECUTION_MONITORING_KEY;
    },
    invoke: (identifierObject, object) => {
      if (!object || openmct.objects.isMissing(object)) {
        openmct.objects.save(planExecutionMonitoringModel);

        return planExecutionMonitoringModel;
      }

      return object;
    },
    priority
  };
}

export default planExecutionMonitoringInterceptor;

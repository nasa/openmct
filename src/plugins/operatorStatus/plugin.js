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
import OperatorStatusIndicator from './operatorStatus/OperatorStatusIndicator.js';
import PollQuestionIndicator from './pollQuestion/PollQuestionIndicator.js';

/**
 * @param {import('@/api/user/UserAPI').UserAPIConfiguration} configuration
 * @returns {function} The plugin install function
 */
export default function operatorStatusPlugin(configuration) {
  return function install(openmct) {
    if (openmct.user.hasProvider()) {
      const operatorStatusIndicator = new OperatorStatusIndicator(openmct, configuration);
      operatorStatusIndicator.install();

      openmct.user.status.canSetPollQuestion().then((canSetPollQuestion) => {
        if (canSetPollQuestion) {
          const pollQuestionIndicator = new PollQuestionIndicator(openmct, configuration);

          pollQuestionIndicator.install();
        }
      });
    }
  };
}

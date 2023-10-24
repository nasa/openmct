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

/**
 * An object containing key-value pairs, where keys are symbolic of
 * device attributes, and values are functions that take the
 * `agent` as inputs and return boolean values indicating
 * whether or not the current device has these attributes.
 *
 * For internal use by the mobile support bundle.
 *
 * @memberof src/plugins/DeviceClassifier
 * @private
 */

export default {
  mobile: function (agent) {
    return agent.isMobile();
  },
  phone: function (agent) {
    return agent.isPhone();
  },
  tablet: function (agent) {
    return agent.isTablet();
  },
  desktop: function (agent) {
    return !agent.isMobile();
  },
  portrait: function (agent) {
    return agent.isPortrait();
  },
  landscape: function (agent) {
    return agent.isLandscape();
  },
  touch: function (agent) {
    return agent.isTouch();
  }
};

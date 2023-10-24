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

const FAULT_SEVERITY = {
  CRITICAL: {
    name: 'CRITICAL',
    value: 'critical',
    priority: 0
  },
  WARNING: {
    name: 'WARNING',
    value: 'warning',
    priority: 1
  },
  WATCH: {
    name: 'WATCH',
    value: 'watch',
    priority: 2
  }
};

export const FAULT_MANAGEMENT_TYPE = 'faultManagement';
export const FAULT_MANAGEMENT_INSPECTOR = 'faultManagementInspector';
export const FAULT_MANAGEMENT_ALARMS = 'alarms';
export const FAULT_MANAGEMENT_GLOBAL_ALARMS = 'global-alarm-status';
export const FAULT_MANAGEMENT_SHELVE_DURATIONS_IN_MS = [
  {
    name: '5 Minutes',
    value: 300000
  },
  {
    name: '10 Minutes',
    value: 600000
  },
  {
    name: '15 Minutes',
    value: 900000
  },
  {
    name: 'Indefinite',
    value: 0
  }
];
export const FAULT_MANAGEMENT_VIEW = 'faultManagement.view';
export const FAULT_MANAGEMENT_NAMESPACE = 'faults.taxonomy';
export const FILTER_ITEMS = ['Standard View', 'Acknowledged', 'Unacknowledged', 'Shelved'];
export const SORT_ITEMS = {
  'newest-first': {
    name: 'Newest First',
    value: 'newest-first',
    sortFunction: (a, b) => {
      if (b.triggerTime > a.triggerTime) {
        return 1;
      }

      if (a.triggerTime > b.triggerTime) {
        return -1;
      }

      return 0;
    }
  },
  'oldest-first': {
    name: 'Oldest First',
    value: 'oldest-first',
    sortFunction: (a, b) => {
      if (a.triggerTime > b.triggerTime) {
        return 1;
      }

      if (a.triggerTime < b.triggerTime) {
        return -1;
      }

      return 0;
    }
  },
  severity: {
    name: 'Severity',
    value: 'severity',
    sortFunction: (a, b) => {
      const diff = FAULT_SEVERITY[a.severity].priority - FAULT_SEVERITY[b.severity].priority;
      if (diff !== 0) {
        return diff;
      }

      if (b.triggerTime > a.triggerTime) {
        return 1;
      }

      if (a.triggerTime > b.triggerTime) {
        return -1;
      }

      return 0;
    }
  }
};

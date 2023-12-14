<!--
 Open MCT, Copyright (c) 2014-2023, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->

<template>
  <FaultManagementListView :faults-list="faultsList" />
</template>

<script>
import { FAULT_MANAGEMENT_ALARMS, FAULT_MANAGEMENT_GLOBAL_ALARMS } from './constants';
import FaultManagementListView from './FaultManagementListView.vue';

export default {
  components: {
    FaultManagementListView
  },
  inject: ['openmct', 'domainObject'],
  data() {
    return {
      faultsList: []
    };
  },
  mounted() {
    this.unsubscribe = this.openmct.faults.subscribe(this.domainObject, this.updateFault);
  },
  beforeUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },
  methods: {
    updateFault({ fault, type }) {
      if (type === FAULT_MANAGEMENT_GLOBAL_ALARMS) {
        this.updateFaultList();
      } else if (type === FAULT_MANAGEMENT_ALARMS) {
        this.faultsList.forEach((faultValue, i) => {
          if (fault.id === faultValue.id) {
            this.faultsList[i] = fault;
          }
        });
      }
    },
    updateFaultList() {
      this.openmct.faults.request(this.domainObject).then((faultsData) => {
        if (faultsData?.length > 0) {
          this.faultsList = faultsData.map((fd) => fd.fault);
        } else {
          this.faultsList = [];
        }
      });
    }
  }
};
</script>

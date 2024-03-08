<!--
 Open MCT, Copyright (c) 2014-2024, United States Government
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
  <div class="c-faults-list-view">
    <FaultManagementSearch
      :search-term="searchTerm"
      @filter-changed="updateFilter"
      @update-search-term="updateSearchTerm"
    />

    <FaultManagementToolbar
      v-if="showToolbar"
      :selected-faults="selectedFaults"
      @acknowledge-selected="toggleAcknowledgeSelected"
      @shelve-selected="toggleShelveSelected"
    />

    <div class="c-faults-list-view-header-item-container-wrapper">
      <div class="c-faults-list-view-header-item-container">
        <FaultManagementListHeader
          class="header"
          :selected-faults="selectedFaults"
          :total-faults-count="filteredFaultsList.length"
          @select-all="selectAll"
          @sort-changed="sortChanged"
        />

        <div class="c-faults-list-view-item-body">
          <template v-if="filteredFaultsList.length > 0">
            <FaultManagementListItem
              v-for="fault of filteredFaultsList"
              :key="fault.id"
              :fault="fault"
              :is-selected="isSelected(fault)"
              @toggle-selected="toggleSelected"
              @acknowledge-selected="toggleAcknowledgeSelected"
              @shelve-selected="toggleShelveSelected"
              @clear-all-selected="resetSelectedFaultMap"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  FAULT_MANAGEMENT_ALARMS,
  FAULT_MANAGEMENT_GLOBAL_ALARMS,
  FAULT_MANAGEMENT_SHELVE_DURATIONS_IN_MS,
  FILTER_ITEMS,
  SORT_ITEMS
} from './constants.js';
import FaultManagementListHeader from './FaultManagementListHeader.vue';
import FaultManagementListItem from './FaultManagementListItem.vue';
import FaultManagementSearch from './FaultManagementSearch.vue';
import FaultManagementToolbar from './FaultManagementToolbar.vue';

const SEARCH_KEYS = [
  'id',
  'triggerValueInfo',
  'currentValueInfo',
  'triggerTime',
  'severity',
  'name',
  'shortDescription',
  'namespace'
];

export default {
  components: {
    FaultManagementListHeader,
    FaultManagementListItem,
    FaultManagementSearch,
    FaultManagementToolbar
  },
  inject: ['openmct', 'domainObject'],
  data() {
    return {
      faultsList: [],
      filterIndex: 0,
      searchTerm: '',
      selectedFaultMap: {},
      sortBy: Object.values(SORT_ITEMS)[0].value
    };
  },
  computed: {
    selectedFaults() {
      return Object.values(this.selectedFaultMap);
    },
    filteredFaultsList() {
      const filterName = FILTER_ITEMS[this.filterIndex];
      let list = this.faultsList;

      // Exclude shelved alarms from all views except the Shelved view
      if (filterName !== 'Shelved') {
        list = list.filter((fault) => fault.shelved !== true);
      }

      if (filterName === 'Acknowledged') {
        list = list.filter((fault) => fault.acknowledged);
      } else if (filterName === 'Unacknowledged') {
        list = list.filter((fault) => !fault.acknowledged);
      } else if (filterName === 'Shelved') {
        list = list.filter((fault) => fault.shelved);
      }

      if (this.searchTerm.length > 0) {
        list = list.filter(this.filterUsingSearchTerm);
      }

      list.sort(SORT_ITEMS[this.sortBy].sortFunction);

      return list;
    },
    showToolbar() {
      return this.openmct.faults.supportsActions();
    }
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
    },
    filterUsingSearchTerm(fault) {
      if (!fault) {
        return false;
      }

      let match = false;

      SEARCH_KEYS.forEach((key) => {
        if (fault[key]?.toString().toLowerCase().includes(this.searchTerm)) {
          match = true;
        }
      });

      return match;
    },
    isSelected(fault) {
      return Boolean(this.selectedFaultMap[fault.id]);
    },
    selectAll(toggle = false) {
      this.faultsList.forEach((fault) => {
        const faultData = {
          fault,
          selected: toggle
        };
        this.toggleSelected(faultData);
      });
    },
    sortChanged(sort) {
      this.sortBy = sort.value;
    },
    toggleSelected({ fault, selected = false }) {
      if (selected) {
        this.selectedFaultMap[fault.id] = fault;
      } else {
        delete this.selectedFaultMap[fault.id];
      }

      this.openmct.selection.select(
        [
          {
            element: this.$el,
            context: {
              item: this.openmct.router.path[0]
            }
          },
          {
            element: this.$el,
            context: {
              selectedFaults: this.selectedFaults
            }
          }
        ],
        false
      );
    },
    async toggleAcknowledgeSelected(faults = this.selectedFaults) {
      let title = '';
      if (faults.length > 1) {
        title = `Acknowledge ${faults.length} selected faults`;
      } else if (faults.length === 1) {
        title = `Acknowledge fault: ${faults[0].name}`;
      }

      const formStructure = {
        title,
        sections: [
          {
            rows: [
              {
                key: 'comment',
                control: 'textarea',
                name: 'Optional comment',
                pattern: '\\S+',
                required: false,
                cssClass: 'l-input-lg',
                value: ''
              }
            ]
          }
        ],
        buttons: {
          submit: {
            label: 'Acknowledge'
          }
        }
      };

      try {
        const data = await this.openmct.forms.showForm(formStructure);
        faults.forEach((fault) => {
          this.openmct.faults.acknowledgeFault(fault, data);
        });
      } catch (err) {
        console.error(err);
      } finally {
        this.resetSelectedFaultMap();
      }
    },
    resetSelectedFaultMap() {
      Object.keys(this.selectedFaultMap).forEach((key) => {
        delete this.selectedFaultMap[key];
      });
    },
    async toggleShelveSelected(faults = this.selectedFaults, shelveData = {}) {
      const { shelved = true } = shelveData;
      if (shelved) {
        let title =
          faults.length > 1
            ? `Shelve ${faults.length} selected faults`
            : `Shelve fault: ${faults[0].name}`;
        const formStructure = {
          title,
          sections: [
            {
              rows: [
                {
                  key: 'comment',
                  control: 'textarea',
                  name: 'Optional comment',
                  pattern: '\\S+',
                  required: false,
                  cssClass: 'l-input-lg',
                  value: ''
                },
                {
                  key: 'shelveDuration',
                  control: 'select',
                  name: 'Shelve duration',
                  options: FAULT_MANAGEMENT_SHELVE_DURATIONS_IN_MS,
                  required: false,
                  cssClass: 'l-input-lg',
                  value: FAULT_MANAGEMENT_SHELVE_DURATIONS_IN_MS[0].value
                }
              ]
            }
          ],
          buttons: {
            submit: {
              label: 'Shelve'
            }
          }
        };

        let data;
        try {
          data = await this.openmct.forms.showForm(formStructure);
        } catch (e) {
          return;
        }

        shelveData.comment = data.comment || '';
        shelveData.shelveDuration =
          data.shelveDuration !== undefined
            ? data.shelveDuration
            : FAULT_MANAGEMENT_SHELVE_DURATIONS_IN_MS[0].value;
      } else {
        shelveData = {
          shelved: false
        };
      }

      Object.values(faults).forEach((selectedFault) => {
        this.openmct.faults.shelveFault(selectedFault, shelveData);
      });

      this.selectedFaultMap = {};
    },
    updateFilter(filter) {
      this.selectAll();

      this.filterIndex = filter.model.options.findIndex((option) => option.value === filter.value);
    },
    updateSearchTerm(term = '') {
      this.searchTerm = term.toLowerCase();
    }
  }
};
</script>

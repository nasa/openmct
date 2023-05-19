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
  <div class="c-fault-mgmt__list data-selectable" :class="classesFromState">
    <div class="c-fault-mgmt-item c-fault-mgmt__list-checkbox">
      <input type="checkbox" :checked="isSelected" @input="toggleSelected" />
    </div>
    <div class="c-fault-mgmt-item">
      <div
        class="c-fault-mgmt__list-severity"
        :title="fault.severity"
        :class="['is-severity-' + severity]"
      ></div>
    </div>
    <div class="c-fault-mgmt-item c-fault-mgmt__list-content">
      <div class="c-fault-mgmt-item c-fault-mgmt__list-pathname">
        <div class="c-fault-mgmt__list-path">{{ fault.namespace }}</div>
        <div class="c-fault-mgmt__list-faultname">{{ fault.name }}</div>
      </div>
      <div class="c-fault-mgmt__list-content-right">
        <div class="c-fault-mgmt-item c-fault-mgmt__list-trigVal">
          <div class="c-fault-mgmt-item__value" :class="tripValueClassname" title="Trip Value">
            {{ fault.triggerValueInfo.value }}
          </div>
        </div>
        <div class="c-fault-mgmt-item c-fault-mgmt__list-curVal">
          <div class="c-fault-mgmt-item__value" :class="liveValueClassname" title="Live Value">
            {{ fault.currentValueInfo.value }}
          </div>
        </div>
        <div class="c-fault-mgmt-item c-fault-mgmt__list-trigTime">
          <div class="c-fault-mgmt-item__value" title="Last Trigger Time">
            {{ fault.triggerTime }}
          </div>
        </div>
      </div>
    </div>
    <div class="c-fault-mgmt-item c-fault-mgmt__list-action-wrapper">
      <button
        class="c-fault-mgmt__list-action-button l-browse-bar__actions c-icon-button icon-3-dots"
        title="Disposition Actions"
        @click="showActionMenu"
      ></button>
    </div>
  </div>
</template>
<script>
const RANGE_CONDITION_CLASS = {
  LOW: 'is-limit--lwr',
  HIGH: 'is-limit--upr'
};

const SEVERITY_CLASS = {
  CRITICAL: 'is-limit--red',
  WARNING: 'is-limit--yellow',
  WATCH: 'is-limit--cyan'
};

export default {
  inject: ['openmct', 'domainObject'],
  props: {
    fault: {
      type: Object,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: () => {
        return false;
      }
    }
  },
  computed: {
    classesFromState() {
      const exclusiveStates = [
        {
          className: 'is-shelved',
          test: () => this.fault.shelved
        },
        {
          className: 'is-unacknowledged',
          test: () => !this.fault.acknowledged && !this.fault.shelved
        },
        {
          className: 'is-acknowledged',
          test: () => this.fault.acknowledged && !this.fault.shelved
        }
      ];

      const classes = [];

      if (this.isSelected) {
        classes.push('is-selected');
      }

      const matchingState = exclusiveStates.find((stateDefinition) => stateDefinition.test());

      if (matchingState !== undefined) {
        classes.push(matchingState.className);
      }

      return classes;
    },
    liveValueClassname() {
      const currentValueInfo = this.fault?.currentValueInfo;
      if (!currentValueInfo || currentValueInfo.monitoringResult === 'IN_LIMITS') {
        return '';
      }

      let classname = RANGE_CONDITION_CLASS[currentValueInfo.rangeCondition] || '';
      classname += ' ';
      classname += SEVERITY_CLASS[currentValueInfo.monitoringResult] || '';

      return classname.trim();
    },
    name() {
      return `${this.fault?.name}/${this.fault?.namespace}`;
    },
    severity() {
      return this.fault?.severity?.toLowerCase();
    },
    triggerTime() {
      return this.fault?.triggerTime;
    },
    triggerValue() {
      return this.fault?.triggerValueInfo?.value;
    },
    tripValueClassname() {
      const triggerValueInfo = this.fault?.triggerValueInfo;
      if (!triggerValueInfo || triggerValueInfo.monitoringResult === 'IN_LIMITS') {
        return '';
      }

      let classname = RANGE_CONDITION_CLASS[triggerValueInfo.rangeCondition] || '';
      classname += ' ';
      classname += SEVERITY_CLASS[triggerValueInfo.monitoringResult] || '';

      return classname.trim();
    }
  },
  methods: {
    showActionMenu(event) {
      event.stopPropagation();

      const menuItems = [
        {
          cssClass: 'icon-check',
          isDisabled: this.fault.acknowledged,
          name: 'Acknowledge',
          description: '',
          onItemClicked: (e) => {
            this.$emit('acknowledgeSelected', [this.fault]);
          }
        },
        {
          cssClass: 'icon-timer',
          name: 'Shelve',
          description: '',
          onItemClicked: () => {
            this.$emit('shelveSelected', [this.fault], { shelved: true });
          }
        },
        {
          cssClass: 'icon-timer',
          isDisabled: Boolean(!this.fault.shelved),
          name: 'Unshelve',
          description: '',
          onItemClicked: () => {
            this.$emit('shelveSelected', [this.fault], { shelved: false });
          }
        }
      ];

      this.openmct.menus.showMenu(event.x, event.y, menuItems);
    },
    toggleSelected(event) {
      const faultData = {
        fault: this.fault,
        selected: event.target.checked
      };

      this.$emit('toggleSelected', faultData);
    }
  }
};
</script>

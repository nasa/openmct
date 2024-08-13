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
  <div class="c-cs" aria-label="Derived Telemetry">
    <section class="c-cs__current-output c-section">
      <div class="c-cs__content c-cs__current-output-value">
        <span class="c-cs__current-output-value__label">Current Output</span>
        <span class="c-cs__current-output-value__value" aria-label="Current Output Value">
          <template v-if="currentCompOutput">
            {{ currentCompOutput }}
          </template>
          <template v-else> --- </template>
        </span>
      </div>
    </section>
    <section id="telemetryReferenceSection" aria-label="Derived Telemetry References">
      <div class="c-cs__header c-section__header">
        <div class="c-cs__header-label c-section__label">Telemetry References</div>
      </div>
      <div
        :class="[
          'c-cs__test-data__controls c-cdef__controls',
          { disabled: !domainObject.configuration.comps.parameters }
        ]"
      >
        <label class="c-toggle-switch">
          <input type="checkbox" :checked="testDataApplied" @change="applyTestData" />
          <span class="c-toggle-switch__slider" aria-label="Apply Test Data"></span>
          <span class="c-toggle-switch__label">Apply Test Values</span>
        </label>
      </div>
      <div class="c-cs__content">
        <div
          class="hint"
          :class="{ 's-status-icon-warning-lo': !domainObject.configuration.comps.parameters }"
        >
          <div v-for="parameter in parameters" :key="parameter.name">
            <div class="c-cs__telemetry-reference">
              <input
                v-model="parameter.name"
                class="c-cs__telemetry-reference__label"
                @change="compsManager.persist"
              />
              <ObjectPath
                :domain-object="compsManager.getDomainObjectForParameter(parameter.keyString)"
              />
              {{ compsManager.getDomainObjectForParameter(parameter.keyString).name }}
              <!-- drop down to select value from telemetry -->
              <select
                v-model="parameter.value"
                class="c-cs__telemetry-reference__value"
                @change="compsManager.persist"
              >
                <option
                  v-for="parameterValueOption in compsManager.getDomainObjectForParameter(
                    parameter.keyString
                  )"
                  :key="parameterValueOption"
                  :value="parameterValueOption"
                />
              </select>
            </div>
          </div>
          <template v-if="!domainObject.configuration.comps.parameters"
            >Drag telemetry into Telemetry References to add variables for an expression</template
          >
        </div>
      </div>
    </section>
    <section id="expressionSection" aria-label="Derived Telemetry Expression">
      <div class="c-cs__header c-section__header">
        <div class="c-cs__header-label c-section__label">Expression</div>
      </div>
      <div class="c-cs__content">
        <div v-if="!isEditing">{{ domainObject.configuration.comps.expression }}</div>
        <div v-else>
          <textarea
            v-model="domainObject.configuration.comps.expression"
            class="c-cs__expression__input"
            placeholder="Enter an expression"
            @change="compsManager.persist"
          ></textarea>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { inject, onBeforeMount, onBeforeUnmount, ref } from 'vue';

import ObjectPath from '../../../ui/components/ObjectPath.vue';
import CompsManager from '../CompsManager';

const openmct = inject('openmct');
const domainObject = inject('domainObject');
const compsManagerPool = inject('compsManagerPool');
const compsManager = CompsManager.getCompsManager(domainObject, openmct, compsManagerPool);
const currentCompOutput = ref(null);
const testDataApplied = ref(false);
const parameters = ref(null);

let outputTelemetryCollection;

defineProps({
  isEditing: { type: Boolean, required: true }
});

onBeforeMount(async () => {
  console.debug('🚀 CompsView: onMounted with compsManager', compsManager);
  outputTelemetryCollection = openmct.telemetry.requestCollection(domainObject);
  outputTelemetryCollection.on('add', (data) => {
    telemetryProcessor(data);
  });
  outputTelemetryCollection.on('clear', clearData);
  await outputTelemetryCollection.load();
  await compsManager.load();
  parameters.value = domainObject.configuration.comps.parameters;
});

function applyTestData() {}

function telemetryProcessor(data) {
  // new data will come in as array, so just take the last element
  currentCompOutput.value = data[data.length - 1]?.output;
}

function clearData() {
  currentCompOutput.value = null;
}

onBeforeUnmount(() => {
  outputTelemetryCollection.destroy();
});
</script>

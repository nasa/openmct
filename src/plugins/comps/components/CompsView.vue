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
          <template v-if="testDataApplied && currentTestOutput">
            {{ currentTestOutput }}
          </template>
          <template v-else-if="currentCompOutput && !testDataApplied">
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
          <input type="checkbox" :checked="testDataApplied" @change="toggleTestData" />
          <span class="c-toggle-switch__slider" aria-label="Apply Test Data"></span>
          <span class="c-toggle-switch__label">Apply Test Values</span>
        </label>
      </div>
      <div
        :class="{ 'is-active-dragging': isDragging }"
        class="c-cs__content"
        @drop="drop($event)"
        @dragover.prevent
        @dragstart="dragStart($event)"
        @dragleave="dragLeave($event)"
      >
        <div
          class="hint"
          :class="{ 's-status-icon-warning-lo': !domainObject.configuration.comps.parameters }"
        >
          <div v-for="parameter in parameters" :key="parameter.name" class="telemery-reference">
            Reference
            <input
              v-model="parameter.name"
              class="telemery-reference-variable-input"
              @change="persistParameters"
            />
            <ObjectPath
              :domain-object="compsManager.getTelemetryObjectForParameter(parameter.keyString)"
            />
            {{ compsManager.getTelemetryObjectForParameter(parameter.keyString)?.name }}
            <!-- drop down to select value from telemetry -->
            <select v-model="parameter.valueToUse" @change="persistParameters">
              <option
                v-for="parameterValueOption in compsManager.getMetaDataValuesForParameter(
                  parameter.keyString
                )"
                :key="parameterValueOption.key"
                :value="parameterValueOption.key"
              >
                {{ parameterValueOption.name }}
              </option>
            </select>
            <input
              v-model="parameter.testValue"
              class="telemery-reference-variable-input"
              @change="persistParameters"
            />
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
        <div>
          <textarea
            v-model="expression"
            class="expression-input"
            placeholder="Enter an expression"
            @change="persistExpression"
          ></textarea>
        </div>
        <div v-if="expressionOutput" class="c-expression-output-bad">{{ expressionOutput }}</div>
        <div v-else class="c-expression-output-good">Valid Expression</div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { evaluate } from 'mathjs';
import { inject, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue';

import ObjectPath from '../../../ui/components/ObjectPath.vue';
import CompsManager from '../CompsManager';

const openmct = inject('openmct');
const domainObject = inject('domainObject');
const compsManagerPool = inject('compsManagerPool');
const compsManager = CompsManager.getCompsManager(domainObject, openmct, compsManagerPool);
const currentCompOutput = ref(null);
const currentTestOutput = ref(null);
const testDataApplied = ref(false);
const parameters = ref(null);
const expression = ref(null);
const expressionOutput = ref(null);
const isDragging = ref(false);

let outputTelemetryCollection;

defineProps({
  isEditing: { type: Boolean, required: true }
});

watch(
  () => domainObject.configuration.comps.parameters,
  (newParameters) => {
    parameters.value = newParameters;
  }
);
onBeforeMount(async () => {
  console.debug('🚀 CompsView: onMounted with compsManager', compsManager);
  outputTelemetryCollection = openmct.telemetry.requestCollection(domainObject);
  outputTelemetryCollection.on('add', telemetryProcessor);
  outputTelemetryCollection.on('clear', clearData);
  await compsManager.load();
  parameters.value = compsManager.getParameters();
  expression.value = compsManager.getExpression();
  compsManager.on('parametersUpdated', reloadParameters);
  outputTelemetryCollection.load();
  applyTestData();
});

onBeforeUnmount(() => {
  outputTelemetryCollection.off('add', telemetryProcessor);
  outputTelemetryCollection.off('clear', clearData);
  outputTelemetryCollection.destroy();
});

function drop(event) {
  isDragging.value = false;
  console.debug('🚀 CompsView: drop', event);
}

function dragStart(event) {
  isDragging.value = true;
}

function dragLeave(event) {
  isDragging.value = false;
}

function reloadParameters() {
  parameters.value = compsManager.getParameters();
}

function persistParameters() {
  domainObject.configuration.comps.parameters = parameters.value;
  compsManager.persist(domainObject);
  applyTestData();
}

function toggleTestData() {
  testDataApplied.value = !testDataApplied.value;
  if (testDataApplied.value) {
    applyTestData();
  } else {
    clearData();
  }
}

function persistExpression() {
  domainObject.configuration.comps.expression = expression.value;
  compsManager.persist(domainObject);
  applyTestData();
}

function applyTestData() {
  const scope = parameters.value.reduce((acc, parameter) => {
    acc[parameter.name] = parameter.testValue;
    return acc;
  }, {});
  try {
    const testOutput = evaluate(expression.value, scope);
    currentTestOutput.value = testOutput;
    expressionOutput.value = null;
    compsManager.setValid(true);
    compsManager.persist(domainObject);
  } catch (error) {
    console.error('👎 Error applying test data', error);
    currentTestOutput.value = null;
    compsManager.setValid(false);
    compsManager.persist(domainObject);
    expressionOutput.value = error.message;
  }
}

function telemetryProcessor(data) {
  if (testDataApplied.value) {
    return;
  }
  // new data will come in as array, so just take the last element
  currentCompOutput.value = data[data.length - 1]?.output;
}

function clearData() {
  currentCompOutput.value = null;
}
</script>

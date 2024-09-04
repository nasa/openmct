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
        :class="['c-cs__test-data__controls c-cdef__controls', { disabled: !parameters?.length }]"
      >
        <label v-if="isEditing" class="c-toggle-switch">
          <input type="checkbox" :checked="testDataApplied" @change="toggleTestData" />
          <span class="c-toggle-switch__slider" aria-label="Apply Test Data"></span>
          <span class="c-toggle-switch__label">Apply Test Values</span>
        </label>
      </div>
      <div class="c-cs__content">
        <div class="hint" :class="{ 's-status-icon-warning-lo': !parameters?.length && isEditing }">
          <div
            v-for="parameter in parameters"
            :key="parameter.keyString"
            class="telemery-reference"
          >
            Reference
            <input
              v-if="isEditing"
              v-model="parameter.name"
              class="telemery-reference-variable-input"
              @change="updateParameters"
            />
            <div v-else>&nbsp;{{ parameter.name }}</div>
            <ObjectPath
              :domain-object="compsManager.getTelemetryObjectForParameter(parameter.keyString)"
            />
            <div class="parametery-telemetry">
              <div
                class="parameter-telemetry-icon"
                :class="
                  getIconForType(compsManager.getTelemetryObjectForParameter(parameter.keyString))
                "
              />
              <div class="parametery-telemetry-name">
                {{ compsManager.getTelemetryObjectForParameter(parameter.keyString)?.name }}
              </div>
            </div>
            <!-- drop down to select value from telemetry -->
            <select v-if="isEditing" v-model="parameter.valueToUse" @change="updateParameters">
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
            <div v-else>&nbsp;{{ parameter.valueToUse }}</div>
            <input
              v-if="isEditing"
              v-model="parameter.testValue"
              class="telemery-reference-variable-input"
              @change="updateParameters"
            />
            <div v-else>&nbsp;{{ parameter.testValue }}</div>
          </div>
          <template v-if="!parameters?.length && isEditing"
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
        <textarea
          v-if="isEditing"
          v-model="expression"
          class="expression-input"
          placeholder="Enter an expression"
          @change="updateExpression"
        ></textarea>
        <div v-else>
          {{ expression }}
        </div>
        <div v-if="expression && expressionOutput && isEditing" class="c-expression-output-bad">
          {{ expressionOutput }}
        </div>
        <div
          v-else-if="expression && !expressionOutput && isEditing"
          class="c-expression-output-good"
        >
          Valid Expression
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { evaluate } from 'mathjs';
import { inject, onBeforeMount, onBeforeUnmount, ref } from 'vue';

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
const outputFormat = ref(null);

let outputTelemetryCollection;

defineProps({
  isEditing: { type: Boolean, required: true }
});

onBeforeMount(async () => {
  console.debug('🚀 CompsView: onMounted with compsManager', compsManager);
  outputTelemetryCollection = openmct.telemetry.requestCollection(domainObject);
  outputTelemetryCollection.on('add', telemetryProcessor);
  outputTelemetryCollection.on('clear', clearData);
  await compsManager.load();
  parameters.value = compsManager.getParameters();
  expression.value = compsManager.getExpression();
  outputFormat.value = compsManager.getOutputFormat();
  compsManager.on('parametersUpdated', reloadParameters);
  outputTelemetryCollection.load();
  applyTestData();
});

onBeforeUnmount(() => {
  outputTelemetryCollection.off('add', telemetryProcessor);
  outputTelemetryCollection.off('clear', clearData);
  outputTelemetryCollection.destroy();
});

function reloadParameters() {
  parameters.value = compsManager.getParameters();
  domainObject.configuration.comps.parameters = parameters.value;
  compsManager.setDomainObject(domainObject);
}

function updateParameters() {
  console.debug('🚀 CompsView: updateParameters', parameters.value);
  openmct.objects.mutate(domainObject, `configuration.comps.parameters`, parameters.value);
  compsManager.setDomainObject(domainObject);
  applyTestData();
}

function getIconForType(telemetryObject) {
  return openmct.types.get(telemetryObject.type).definition.cssClass;
}

function toggleTestData() {
  testDataApplied.value = !testDataApplied.value;
  if (testDataApplied.value) {
    applyTestData();
  } else {
    clearData();
  }
}

function updateExpression() {
  openmct.objects.mutate(domainObject, `configuration.comps.expression`, expression.value);
  compsManager.setDomainObject(domainObject);
  applyTestData();
}

function getValueFormatter() {
  const metaData = openmct.telemetry.getMetadata(domainObject);
  const outputMetaDatum = metaData.values().find((metaDatum) => metaDatum.key === 'compsOutput');
  return openmct.telemetry.getValueFormatter(outputMetaDatum);
}

function applyTestData() {
  const scope = parameters.value.reduce((acc, parameter) => {
    acc[parameter.name] = parameter.testValue;
    return acc;
  }, {});
  try {
    const testOutput = evaluate(expression.value, scope);
    const formattedData = getValueFormatter().format(testOutput);
    currentTestOutput.value = formattedData;
    expressionOutput.value = null;
    compsManager.setValid(true);
  } catch (error) {
    console.error('👎 Error applying test data', error);
    currentTestOutput.value = null;
    compsManager.setValid(false);
    expressionOutput.value = error.message;
  }
}

function telemetryProcessor(data) {
  if (testDataApplied.value) {
    return;
  }
  // new data will come in as array, so just take the last element
  const currentOutput = data[data.length - 1]?.compsOutput;
  const formattedOutput = getValueFormatter().format(currentOutput);
  currentCompOutput.value = formattedOutput;
}

function clearData() {
  currentCompOutput.value = null;
}
</script>

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
  <div class="c-comps" aria-label="Derived Telemetry">
    <section class="c-section c-comps-output">
      <div class="c-output-featured">
        <span class="c-output-featured__label">Current Output</span>
        <span class="c-output-featured__value" aria-label="Current Output Value">
          <template
            v-if="testDataApplied && currentTestOutput !== undefined && currentTestOutput !== null"
          >
            {{ currentTestOutput }}
          </template>
          <template
            v-else-if="
              !testDataApplied && currentCompOutput !== undefined && currentCompOutput !== null
            "
          >
            {{ currentCompOutput }}
          </template>
          <template v-else> --- </template>
        </span>
      </div>
    </section>
    <section
      id="telemetryReferenceSection"
      class="c-comps__section c-comps__refs-and-controls"
      aria-describedby="telemetryReferences"
    >
      <div class="c-cs__header c-section__header">
        <div id="telemetryReferences" class="c-cs__header-label c-section__label">
          Telemetry References
        </div>
      </div>

      <div
        v-if="isEditing"
        class="c-comps__apply-test-data-control"
        :class="['c-comps__refs-controls c-cdef__controls', { disabled: !parameters?.length }]"
      >
        <label class="c-toggle-switch">
          <input type="checkbox" :checked="testDataApplied" @change="toggleTestData" />
          <span class="c-toggle-switch__slider" aria-label="Apply Test Data"></span>
          <span class="c-toggle-switch__label">Apply Test Values</span>
        </label>
      </div>
      <div class="c-comps__refs">
        <div v-for="parameter in parameters" :key="parameter.keyString" class="c-comps__ref">
          <div class="c-comps__ref-section">
            <div class="c-comps__ref-sub-section ref-and-path">
              <span class="c-test-datum__string">Reference</span>
              <input
                v-if="isEditing"
                v-model="parameter.name"
                :aria-label="`Reference Name Input for ${parameter.name}`"
                type="text"
                class="c-input--md"
                @change="updateParameters"
              />
              <div v-else class="--em">{{ parameter.name }}</div>
              <span class="c-test-datum__string">=</span>
              <span
                class="c-comps__path-and-field"
                :aria-label="`Reference ${parameter.name} Object Path`"
              >
                <ObjectPathString
                  :domain-object="compsManager.getTelemetryObjectForParameter(parameter.keyString)"
                  :show-object-itself="true"
                  class="c-comp__ref-path --em"
                />
                <!-- drop down to select value from telemetry -->
                <select
                  v-if="isEditing"
                  v-model="parameter.valueToUse"
                  class="c-comp__ref-field"
                  @change="updateParameters"
                >
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
                <div v-else class="c-comp__ref-field">{{ parameter.valueToUse }}</div>
              </span>
            </div>

            <div
              v-if="isEditing"
              class="c-comps__ref-sub-section accum-vals"
              :class="['c-comps__refs-controls', { disabled: !parameters?.length }]"
            >
              <label class="c-toggle-switch">
                <span class="c-toggle-switch__label">Accumulate Values</span>
                <input
                  v-model="parameter.accumulateValues"
                  type="checkbox"
                  @change="updateAccumulateValues(parameter)"
                />
                <span
                  class="c-toggle-switch__slider"
                  aria-label="Toggle Parameter Accumulation"
                ></span>
              </label>

              <span v-if="isEditing && parameter.accumulateValues" class="c-comps__label"
                >Sample Size</span
              >
              <input
                v-if="isEditing && parameter.accumulateValues"
                v-model="parameter.sampleSize"
                :aria-label="`Sample Size for ${parameter.name}`"
                type="number"
                class="c-input--sm c-comps__value"
                @change="updateParameters"
              />
            </div>

            <div
              v-if="!isEditing && parameter.accumulateValues"
              class="c-comps__ref-sub-section accum-vals"
            >
              Accumulating values with sample size {{ parameter.sampleSize }}
            </div>
          </div>

          <div v-if="isEditing" class="c-comps__ref-section">
            <span class="c-comps__label">Test value</span>
            <input
              v-if="isEditing"
              v-model="parameter.testValue"
              :aria-label="`Reference Test Value for ${parameter.name}`"
              type="text"
              class="c-input--md c-comps__value"
              @change="updateTestValue(parameter)"
            />
          </div>
        </div>
      </div>
    </section>
    <section id="expressionSection" class="c-comps__section c-comps__expression">
      <div class="c-cs__header c-section__header">
        <div class="c-cs__header-label c-section__label">Expression</div>
      </div>

      <div v-if="!parameters?.length && isEditing" class="hint">
        Drag in telemetry to add references for an expression.
      </div>

      <textarea
        v-if="parameters?.length && isEditing"
        v-model="expression"
        class="c-comps__expression-value"
        placeholder="Enter an expression"
        @change="updateExpression"
      ></textarea>
      <div v-else>
        <div class="c-comps__expression-value" aria-label="Expression">
          {{ expression }}
        </div>
      </div>
      <span
        v-if="expression && expressionOutput"
        class="icon-alert-triangle c-comps__expression-msg --bad"
      >
        Invalid: {{ expressionOutput }}
      </span>
      <span
        v-else-if="expression && !expressionOutput && isEditing"
        class="c-comps__expression-msg --good"
      >
        Expression valid
      </span>
    </section>
  </div>
</template>

<script setup>
import { evaluate } from 'mathjs';
import { inject, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue';

import ObjectPathString from '../../../ui/components/ObjectPathString.vue';
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

const props = defineProps({
  isEditing: {
    type: Boolean,
    required: true
  }
});

onBeforeMount(async () => {
  let maxSampleSize = 20;
  if (parameters.value) {
    maxSampleSize =
      parameters.value.reduce((max, param) => {
        if (param.accumulateValues) {
          return Math.max(max, param.sampleSize);
        }
        return max;
      }, 0) + 20;
  }

  const telemetryOptions = {
    strategy: 'minmax',
    size: maxSampleSize
  };
  // TODO: we should dynamically set size to the largest comp input window
  outputTelemetryCollection = openmct.telemetry.requestCollection(domainObject, telemetryOptions);
  outputTelemetryCollection.on('add', telemetryProcessor);
  outputTelemetryCollection.on('clear', clearData);
  compsManager.on('parameterAdded', reloadParameters);
  compsManager.on('parameterRemoved', reloadParameters);
  compsManager.on('outputFormatChanged', updateOutputFormat);

  // Track outstanding requests using a Promise
  let outstandingRequests = 0;

  const allRequestsComplete = new Promise((resolve) => {
    outputTelemetryCollection.on('requestStarted', () => {
      outstandingRequests++;
    });

    outputTelemetryCollection.on('requestEnded', () => {
      outstandingRequests--;
      if (outstandingRequests === 0) {
        resolve();
      }
    });
    // If no requests were started, resolve immediately
    outputTelemetryCollection.load(telemetryOptions); // will implicitly load compsManager

    if (outstandingRequests === 0) {
      resolve();
    }
  });

  await allRequestsComplete;

  // Update state after all requests are complete
  parameters.value = compsManager.getParameters();
  expression.value = compsManager.getExpression();
  outputFormat.value = compsManager.getOutputFormat();
  applyTestData();
});

onBeforeUnmount(() => {
  outputTelemetryCollection.off('add', telemetryProcessor);
  outputTelemetryCollection.off('clear', clearData);
  compsManager.off('parameterAdded', reloadParameters);
  compsManager.off('parameterRemoved', reloadParameters);
  compsManager.off('outputFormatChanged', updateOutputFormat);
  outputTelemetryCollection.destroy();
});

watch(
  () => props.isEditing,
  (editMode) => {
    if (!editMode) {
      testDataApplied.value = false;
    }
  }
);

function updateOutputFormat() {
  outputFormat.value = compsManager.getOutputFormat();
  // delete the metadata cache so that the new output format is used
  openmct.telemetry.removeMetadataFromCache(domainObject);
}

function reloadParameters() {
  domainObject.configuration.comps.parameters = compsManager.getParameters();
  parameters.value = domainObject.configuration.comps.parameters;
  openmct.objects.mutate(domainObject, `configuration.comps.parameters`, parameters.value);
  compsManager.setDomainObject(domainObject);
  applyTestData();
}

function updateParameters() {
  openmct.objects.mutate(domainObject, `configuration.comps.parameters`, parameters.value);
  compsManager.setDomainObject(domainObject);
  applyTestData();
  reload();
}

function updateAccumulateValues(parameter) {
  if (parameter.accumulateValues) {
    parameter.testValue = [''];
  } else {
    parameter.testValue = '';
  }
  updateParameters();
}

function updateTestValue(parameter) {
  if (parameter.accumulateValues && parameter.testValue === '') {
    parameter.testValue = [];
  }
  updateParameters();
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
  reload();
}

function getValueFormatter() {
  const metaData = openmct.telemetry.getMetadata(domainObject);
  const outputMetaDatum = metaData.values().find((metaDatum) => metaDatum.key === 'value');
  return openmct.telemetry.getValueFormatter(outputMetaDatum);
}

function applyTestData() {
  if (expression.value === undefined || parameters.value === undefined) {
    return;
  }
  const scope = parameters.value.reduce((acc, parameter) => {
    // try to parse the test value as JSON
    try {
      const parsedValue = JSON.parse(parameter.testValue);
      acc[parameter.name] = parsedValue;
    } catch (error) {
      acc[parameter.name] = parameter.testValue;
    }
    return acc;
  }, {});

  // see which parameters are misconfigured as non-arrays
  const misconfiguredParameterNames = parameters.value
    .filter((parameter) => {
      return parameter.accumulateValues && !Array.isArray(scope[parameter.name]);
    })
    .map((parameter) => parameter.name);
  if (misconfiguredParameterNames.length) {
    const misconfiguredParameterNamesString = misconfiguredParameterNames.join(', ');
    currentTestOutput.value = null;
    expressionOutput.value = `Reference "${misconfiguredParameterNamesString}" set to accumulating, but test values aren't arrays.`;
    return;
  }

  try {
    const testOutput = evaluate(expression.value, scope);
    const formattedData = getValueFormatter().format(testOutput);
    currentTestOutput.value = formattedData;
    expressionOutput.value = null;
  } catch (error) {
    currentTestOutput.value = null;
    expressionOutput.value = error.message;
  }
}

function telemetryProcessor(data) {
  if (testDataApplied.value) {
    return;
  }
  // new data will come in as array, so just take the last element
  const currentOutput = data[data.length - 1]?.value;
  const formattedOutput = getValueFormatter().format(currentOutput);
  currentCompOutput.value = formattedOutput;
}

function reload() {
  clearData();
  outputTelemetryCollection._requestHistoricalTelemetry();
}

function clearData() {
  currentCompOutput.value = null;
}
</script>

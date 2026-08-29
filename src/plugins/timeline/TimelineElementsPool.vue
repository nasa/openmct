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
  <ElementsPool>
    <template #content="{ index }">
      <TimelineElementsContent :index="index" :container="containers[index]" />
    </template>
    <template #custom>
      <div class="c-inspector__properties c-inspect-properties" aria-label="Swimlane Column">
        <div class="c-inspect-properties__header">Swimlane Column</div>
        <div v-if="isEditing" class="c-inspect-properties__row">
          <span class="c-inspect-properties__label">Width</span>
          <div class="c-inspect-properties__label align-right">
            <input
              :value="swimLaneLabelWidth"
              aria-labelledby="Width in pixels"
              class="field control c-input--sm"
              :pattern="/\d+/"
              type="number"
              name="value"
              min="0"
              @change="changeSwimLaneLabelWidth"
            />
            <span>px</span>
          </div>
        </div>
        <div v-else class="c-inspect-properties__row">{{ swimLaneLabelWidth }}px</div>
      </div>
    </template>
  </ElementsPool>
</template>
<script>
import useIsEditing from 'utils/vue/useIsEditing.js';
import { inject, onUnmounted, ref } from 'vue';

import ElementsPool from '@/plugins/inspectorViews/elements/ElementsPool.vue';

import getDefaultConfiguration from './configuration.js';
import TimelineElementsContent from './TimelineElementsContent.vue';

export default {
  components: {
    ElementsPool,
    TimelineElementsContent
  },
  setup() {
    const configuration = getDefaultConfiguration();
    const openmct = inject('openmct');
    const domainObject = inject('domainObject');
    const { isEditing } = useIsEditing(openmct);

    // get initial containers configuration from selection context,
    // as domain.configuration.containers not resilient to composition modifications made outside of view
    const initialContainers =
      openmct.selection.get()?.[0]?.[0]?.context?.containers ??
      domainObject.configuration.containers ??
      configuration.containers;
    const initialSwimLaneLabelWidth =
      domainObject.configuration.swimLaneLabelWidth ?? configuration.swimLaneLabelWidth;

    const containers = ref(initialContainers);
    const swimLaneLabelWidth = ref(initialSwimLaneLabelWidth);
    const unobserveContainers = openmct.objects.observe(
      domainObject,
      'configuration.containers',
      updateContainers
    );
    const unobserveSwimLaneLabelWidth = openmct.objects.observe(
      domainObject,
      'configuration.swimLaneLabelWidth',
      updateSwimLaneLabelWidth
    );

    onUnmounted(() => {
      unobserveContainers?.();
      unobserveSwimLaneLabelWidth?.();
    });

    function updateContainers(_containers) {
      containers.value = _containers;
    }

    function updateSwimLaneLabelWidth(_swimLaneLabelWidth) {
      swimLaneLabelWidth.value = _swimLaneLabelWidth;
    }

    function changeSwimLaneLabelWidth(event) {
      const _size = Number(event.target.value);
      openmct.objectViews.emit(
        `contextAction:${openmct.objects.makeKeyString(domainObject.identifier)}`,
        'changeSwimLaneLabelWidthContextAction',
        _size
      );
    }

    return { domainObject, containers, changeSwimLaneLabelWidth, swimLaneLabelWidth, isEditing };
  }
};
</script>

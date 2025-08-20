<template>
  <ElementsPool>
    <template #content="{ index }">
      <TimelineElementsContent :index="index" :container="containers[index]" />
    </template>
    <template #custom>
      <div class="c-inspector__properties c-inspect-properties" aria-label="Swim Lane Label Width">
        <div class="c-inspect-properties__header">Swim Lane Label Width</div>
        <div v-if="isEditing" class="c-inspect-properties__row">
          <input
            :value="swimLaneLabelWidth"
            aria-labelledby="Width in pixels"
            class="field control"
            :pattern="/\d+/"
            type="number"
            name="value"
            min="0"
            @change="changeSwimLaneLabelWidth"
          />
          <span>px</span>
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

import { configuration } from './configuration.js';
import TimelineElementsContent from './TimelineElementsContent.vue';

export default {
  components: {
    ElementsPool,
    TimelineElementsContent
  },
  setup() {
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

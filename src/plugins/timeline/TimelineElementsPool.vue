<template>
  <ElementsPool>
    <template #content="{ index }">
      <TimelineElementsContent
        :index="index"
        :container="domainObject.configuration.containers[index]"
      />
    </template>
    <template #custom>
      <div class="c-inspector__properties c-inspect-properties" aria-label="Swim Lane Label Width">
        <div class="c-inspect-properties__header">Swin Lane Label Width</div>
        <div class="c-inspect-properties__row">
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
      </div>
    </template>
  </ElementsPool>
</template>
<script>
import { inject, ref } from 'vue';

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

    const selectionContext = openmct.selection.get()[0][0].context;
    const initialSwimLaneLabelWidth =
      domainObject.configuration.swimLaneLabelWidth ?? configuration.swimLaneLabelWidth;
    // get initial containers configuration from selection context,
    // as domain.configuration.containers not resilient to composition modifications made outside of view
    const initialContainers =
      selectionContext.containers ??
      domainObject.configuration.containers ??
      configuration.containers;
    const swimLaneLabelWidth = ref(initialSwimLaneLabelWidth);
    const containers = ref(initialContainers);
    openmct.objects.observe(domainObject, 'configuration.containers', updateContainers);
    openmct.objects.observe(
      domainObject,
      'configuration.swimLaneLabelWidth',
      updateSwimLaneLabelWidth
    );

    function updateSwimLaneLabelWidth(_swimLaneLabelWidth) {
      swimLaneLabelWidth.value = _swimLaneLabelWidth;
    }

    function updateContainers(_containers) {
      containers.value = _containers;
    }

    function changeSwimLaneLabelWidth(event) {
      const _size = Number(event.target.value);
      openmct.objectViews.emit(
        `contextAction:${openmct.objects.makeKeyString(domainObject.identifier)}`,
        'changeSwimLaneLabelWidthContextAction',
        _size
      );
    }

    return { domainObject, changeSwimLaneLabelWidth, swimLaneLabelWidth };
  }
};
</script>

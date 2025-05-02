<template>
  <template v-if="fixed">
    <input
      :value="size"
      aria-labelledby="pixelSize"
      class="field control"
      :pattern="/\d+/"
      type="number"
      name="value"
      min="0"
      @change="changeSize"
    />
    <span>px</span>
  </template>
  <select v-model="isFixed" aria-label="fixedOrFlex">
    <option :selected="!isFixed" :value="false">flex</option>
    <option :selected="isFixed" :value="true">fixed</option>
  </select>
</template>
<script>
import { computed, inject, ref, toRaw } from 'vue';

export default {
  props: {
    object: {
      type: Object,
      required: true
    },
    index: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const openmct = inject('openmct');
    const domainObject = inject('domainObject');

    openmct.objects.observe(domainObject, 'configuration.containers', updateContainer);

    const container = ref(null);
    const fixed = computed(() => {
      return container.value?.fixed;
    });
    const isFixed = computed({ get: () => fixed, set: (_isFixed) => toggleFixed(_isFixed) });
    const size = computed(() => container.value?.size);

    function toggleFixed(_fixed) {
      openmct.objectViews.emit(
        `contextAction:${openmct.objects.makeKeyString(domainObject.identifier)}`,
        'toggleFixedContextAction',
        props.index,
        _fixed
      );
    }

    function changeSize(event) {
      const _size = Number(event.target.value);
      openmct.objectViews.emit(
        `contextAction:${openmct.objects.makeKeyString(domainObject.identifier)}`,
        'changeSizeContextAction',
        props.index,
        _size
      );
    }

    function updateContainer(containers) {
      container.value = containers[props.index];
    }

    return {
      openmct,
      domainObject,
      container,
      fixed,
      isFixed,
      size,
      updateContainer,
      changeSize
    };
  }
};
</script>

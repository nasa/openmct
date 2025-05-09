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
  <select v-model="fixed" aria-label="fixedOrFlex" @change="toggleFixed">
    <option :value="false">flex</option>
    <option :value="true">fixed</option>
  </select>
</template>
<script>
import { inject, ref } from 'vue';

export default {
  props: {
    index: {
      type: Number,
      required: true
    },
    container: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const openmct = inject('openmct');
    const domainObject = inject('domainObject');

    const fixed = ref(props.container.fixed ?? false);
    const size = ref(props.container.size);

    function toggleFixed() {
      openmct.objectViews.emit(
        `contextAction:${openmct.objects.makeKeyString(domainObject.identifier)}`,
        'toggleFixedContextAction',
        props.index,
        fixed.value
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

    return {
      openmct,
      domainObject,
      fixed,
      size,
      changeSize,
      toggleFixed
    };
  }
};
</script>

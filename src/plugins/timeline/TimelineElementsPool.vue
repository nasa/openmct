<template>
  <ElementsPool>
    <template #content="{ index, object }">
      <TimelineElementsContent :index="index" :object="object" />
    </template>
  </ElementsPool>
</template>
<script>
import ElementsPool from '@/plugins/inspectorViews/elements/ElementsPool.vue';

import TimelineElementsContent from './TimelineElementsContent.vue';
export default {
  components: {
    ElementsPool,
    TimelineElementsContent
  },
  setup() {
    return {};
  }
};
</script>

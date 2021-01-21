<template>
<div ref="axisHolder"
     class="c-timeline-plan"
>
    <div class="nowMarker"><span class="icon-arrow-down"></span></div>
</div>
</template>

<script>

let chronicles = {
    name: "chronicles.vue"
};

export default {
  inject: ['openmct', 'domainObject'],

  data() {
    return {
      msg: "Hello APRES!",
    };
  },
};
</script>


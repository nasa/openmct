<template>
  <div
    class="l-multipane"
    :class="{
      'l-multipane--vertical': type === 'vertical',
      'l-multipane--horizontal': type === 'horizontal'
    }"
  >
    <slot />
  </div>
</template>

<script>
export default {
    props: {
        type: {
            type: String,
            validator: function (value) {
                return ['vertical', 'horizontal'].indexOf(value) !== -1;
            }
        }
    }
}
</script>

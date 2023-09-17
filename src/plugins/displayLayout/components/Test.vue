<template>
  <div>
    <button><span>I'm a button inside a div</span></button>
    <span style="display: none">Hello</span>
  </div>
</template>
<script>
export default {
  methods: {
    getViewContext() {
      return {};
    }
  }
};
</script>

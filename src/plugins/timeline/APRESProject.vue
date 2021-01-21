<template>
  <div>
    <div class="example">{{ msg }}</div>
    <h3>My name is Keith</h3>
    <button type="button" onclick="alert('help me out')">I'm a big button</button>
  </div>
</template>

<script>

export default {
  inject: ['openmct', 'domainObject'],

  data() {
    return {
      msg: "Hello APRES!",
    };
  },
};
</script>

<style scoped>
.example {
  color: red;
}
h3 {
  color: red;
}
</style>

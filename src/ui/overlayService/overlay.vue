<template>
<div class="abs overlay l-large-view">
    <div class="abs blocker" v-on:click="destroy"></div> 

    <div class="abs outer-holder">

        <a 
            class="close icon-x-in-circle"
            v-on:click="destoy">
        </a>

        <div class="abs inner-holder l-flex-col"> 
            <div class="t-contents flex-elem holder grows">
            <div ref="element"></div>
            </div>

            <div class="bottom-bar flex-elem holder" v-on:click="destroy">
                <a class="t-done s-button major">Done</a> 
            </div> 
        </div> 
    </div>
</div>
</template>

<script>
export default {
  inject: ['destroy', 'element'],
  mounted() {
      this.$refs.element.appendChild(this.element);
  }
}
</script>

<style lang="scss">

</style>


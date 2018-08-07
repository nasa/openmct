<template>
  <div class="Layout">
      <mct-tree ref="tree"></mct-tree>
      <mct-main ref="main"></mct-main>
      <mct-inspector ref="inspector"></mct-inspector>
      <mct-status ref="status"></mct-status>
  </div>
</template>


<style lang="scss">
.Layout {
    height: 100%;
    width: 100%;
    overflow: hidden;
    position: absolute
}
</style>

<script>
import MctTree from './MctTree.vue'
import MctMain from './MctMain.vue'
import MctInspector from './MctInspector.vue'
import MctStatus from './MctStatus.vue'

export default {
    data () {
        return {
            msg: 'Hello world!'
        }
    },
    components: {
        MctTree,
        MctMain,
        MctInspector,
        MctStatus
    }
}
</script>

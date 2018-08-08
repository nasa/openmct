<template>
<div class="l-shell">
    <div class="l-shell__main">
        <div class="l-shell__tree l-pane" style="width: 400px">
            <div class="l-pane__elem c-search">
                <input placeholder="Search" />
            </div>
            <ul class="l-pane__elem l-tree">
                <li class="l-tree__item-h">
                    <div class="l-tree__item" onclick="alert('tree item click');">
                        <span class="c-view-control"></span><span class="c-object-name icon-folder">
        Tree item x with a long name that forces ellipsis to occur
        </span>
                    </div>
                    <ul class="l-tree">
                        <li class="l-tree__item-h">
                            <div class="l-tree__item" onclick="alert('tree item click');">
                                <span class="c-view-control"></span><span class="c-object-name icon-folder">Tree item y</span>
                            </div>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
        <div class="c-splitter c-splitter--horz js-t-split-o"></div>
        <div class="l-shell__object l-object-view">
            <div class="l-object-view__object-h">l-object-h</div>
            <div class="l-object-view__time-conductor-h c-time-conductor">c-time-conductor</div>
        </div>
        <div class="c-splitter c-splitter--horz js-o-split-i"></div>
        <div class="l-shell__inspector l-inspector" style="width: 200px">
            <div class="l-inspector__properties" style="height: 300px">
                l-inspector__properties
            </div>
            <div class="c-splitter c-splitter--vert js-p-split-e"></div>
            <div class="l-inspector__elements">
                l-inspector__elements
            </div>
        </div>
    </div>
    <div class="l-shell__status">
        l-shell_status
    </div>
</div>




<!--<div class="l-shell">
  <mct-tree ref="tree"></mct-tree>
  <mct-main ref="main"></mct-main>
  <mct-inspector ref="inspector"></mct-inspector>
  <mct-status ref="status"></mct-status>
</div>-->
</template>


<style lang="scss">
    @import "~styles/constants";
    /******************************* SHELL */
    .l-shell {
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        display: flex;
        flex-flow: column nowrap;

        /********** HEAD */
        &__status {
            background: #666;
            color: #ccc;
            flex: 0 1 auto;
            height: 40px;
            order: 1;
            padding: $interiorMarginLg;
        }

        /********** MAIN */
        &__main {
            flex: 1 1 auto;
            display: flex;
            flex-flow: row nowrap;
            order: 2;
        }

        &__tree,
        &__inspector {
            max-width: 30%;
            min-width: 5%;
        }

        &__tree {
            background: #f90;
            display: flex;
            flex-flow: column nowrap;
            padding: $interiorMarginLg;
        }

        &__object {
            flex: 1 1 auto;
        }

        &__inspector {
            background: #f9c;
        }
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

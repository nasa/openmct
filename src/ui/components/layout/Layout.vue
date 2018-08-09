<template>
<div class="l-shell">
    <div class="l-shell__main">
        <MctTree cssClass="l-shell__tree-pane" cssStyle="width: 400px" ref="shell-tree"></MctTree>
        <splitter cssClass="c-splitter--horz js-t-split-o"></splitter>
        <div class="l-shell__object-pane l-object-view">
            <div class="l-object-view__object-h" ref="shell-status">l-object-h</div>
            <div class="l-object-view__time-conductor-h c-time-conductor" ref="shell-time-conductor">c-time-conductor</div>
        </div>
        <splitter cssClass="c-splitter--horz js-o-split-i"></splitter>
        <div class="l-shell__inspector-pane l-inspector" style="width: 200px" ref="shell-inspector">
            <div class="l-inspector__properties" style="height: 300px">
                l-inspector__properties
            </div>
            <splitter cssClass="c-splitter--vert js-p-split-e"></splitter>
            <div class="l-inspector__elements">
                l-inspector__elements
            </div>
        </div>
    </div>
    <div class="l-shell__status" ref="shell-status">
        l-shell_status
    </div>
</div>
</template>

<style lang="scss">
    @import "~styles/constants";

    .l-shell {
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        display: flex;
        flex-flow: column nowrap;

        /********** STATUS AREA */
        &__status {
            background: #666;
            color: #ccc;
            flex: 0 1 auto;
            height: 40px;
            order: 1;
            padding: $interiorMarginLg;
        }

        /********** MAIN AREA */
        &__main {
            flex: 1 1 auto;
            display: flex;
            flex-flow: row nowrap;
            order: 2;
        }

        &__tree-pane,
        &__inspector-pane {
            max-width: 30%;
            min-width: 5%;
        }

        &__tree-pane {
            background: #f90;
            display: flex;
            flex-flow: column nowrap;
            padding: $interiorMarginLg;
        }

        &__object-pane {
            flex: 1 1 auto;
        }

        &__inspector-pane {
            background: #f9c;
        }
    }
</style>

<script>
import MctTree from './MctTree.vue'
import splitter from '../controls/splitter.vue'

export default {
    data () {
        return {
            msg: 'Hello world!'
        }
    },
    components: {
        MctTree,
        splitter
    }
}
</script>

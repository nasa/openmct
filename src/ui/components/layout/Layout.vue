<template>
    <div class="l-shell">
        <div class="l-shell__main">
            <div class="l-pane l-shell__tree-pane" style="width: 400px" ref="shell-tree-pane">
                <div class="l-pane__elem l-shell__search">
                    <!-- Change to search compoonent -->
                    <input placeholder="Search"/>
                </div>
                <div class="l-pane__elem l-shell__tree">
                    <MctTree ref="shell-tree"></MctTree>
                </div>
            </div>
            <splitter align="vertical" target="shell-tree-pane"></splitter>
            <div class="l-pane l-shell__main-pane" ref="shell-main-pane">
                <div class="l-shell__object-view c-object-view">c-object-view</div>
                <div class="l-shell__time-conductor c-time-conductor">c-time-conductor</div>
            </div>
            <splitter align="vertical" target="shell-main-pane"></splitter>
            <div class="l-pane l-inspector-pane">
                <MctInspector ref="shell-inspector"></MctInspector>
            </div>
        </div>
        <div class="l-shell__status">
            [ Create Button ]
            <MctStatus ref="shell-status"></MctStatus>
            [ App Logo ]
        </div>
    </div>
</template>

<style lang="scss">
@import "~styles/constants";

/******************************* SHELL */
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

    &__object-view {
        background: #cc0;
        flex: 1 1 auto;
        padding: $interiorMarginLg;
    }

    &__time-conductor {
        background: #cac;
        min-height: 50px;
        padding: $interiorMarginLg;
    }

    /******************************* OBJECT VIEW */
    &__main-pane {
        display: flex;
        flex-flow: column nowrap;
    }

    &__object-view {
        background: #cc0;
        flex: 1 1 auto;
        padding: $interiorMarginLg;
    }

    &__time-conductor {
        background: #cac;
        min-height: 50px;
        padding: $interiorMarginLg;
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

    &__main-pane {
        flex: 1 1 auto;
    }

    &__inspector-pane {
        background: #f9c;
    }
}



</style>

<script>
    import MctInspector from './MctInspector.vue';
    import MctMain from './MctMain.vue';
    import MctStatus from './MctStatus.vue';
    import MctTree from './MctTree.vue';
    import splitter from '../controls/splitter.vue';

export default {
    data () {
        return {
            msg: 'Hello world!'
        }
    },
    components: {
        MctInspector,
        MctMain,
        MctStatus,
        MctTree,
        splitter
    }
}
</script>

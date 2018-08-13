<template>
    <div class="l-shell">
        <div class="l-shell__main">
            <div class="l-pane l-shell__pane-tree" ref="shell-pane-tree">
                <div class="l-shell__search">
                    <MctSearch ref="shell-search"></MctSearch>
                </div>
                <div class="l-shell__tree">
                    <MctTree ref="shell-tree"></MctTree>
                </div>
            </div>
            <splitter align="vertical" target="shell-pane-tree" collapse="to-left"></splitter>
            <div class="l-pane l-shell__pane-main" ref="shell-pane-main">
                <div class="l-shell__object-view">c-object-view</div>
                <div class="l-shell__time-conductor">c-time-conductor</div>
            </div>
            <splitter align="vertical" target="shell-pane-main" collapse="to-right"></splitter>
            <div class="l-pane l-shell__pane-inspector">
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
@import "~styles/constants-snow";

/******************************* SHELL */
.l-shell {
    position: absolute;
    top: 0; right: 0; bottom: 0; left: 0;
    display: flex;
    flex-flow: column nowrap;

    /********** STATUS AREA */
    &__status {
        border-bottom: 1px solid $colorInteriorBorder;
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
        flex: 1 1 auto;
        padding: $interiorMarginLg;
    }

    &__time-conductor {
        border-top: 1px solid $colorInteriorBorder;
        min-height: 50px;
        padding: $interiorMarginLg;
    }

    /********** MAIN AREA PANES */
    &__pane-tree,
    &__pane-main,
    &__pane-inspector {
        display: flex;
        flex-flow: column nowrap;
    }

    &__pane-tree,
    &__pane-inspector {
        max-width: 30%;
        min-width: 5%;
    }

    &__pane-tree {
        $m: $interiorMargin;
        background: $colorTreeBg;
        padding: $m $m + ($splitterD - $splitterHandleD) $m $m;
        width: 300px
    }

    &__pane-main {
        flex: 1 1 auto;
    }

    &__pane-inspector {
        width: 200px
    }
}
</style>

<script>
    import MctInspector from './MctInspector.vue';
    import MctMain from './MctMain.vue';
    import MctSearch from './MctSearch.vue';
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
        MctSearch,
        MctStatus,
        MctTree,
        splitter
    }
}
</script>

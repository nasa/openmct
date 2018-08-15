<template>
    <div class="l-shell">
        <multipane class="l-shell__main"
                   type="horizontal">
            <pane class="l-pane l-shell__pane-tree"
                  splitter="after"
                  collapsable>
                <div class="l-shell__search">
                    <search ref="shell-search"></search>
                </div>
                <div class="l-shell__tree">
                    <MctTree ref="shell-tree"></MctTree>
                </div>
            </pane>
            <pane class="l-pane l-shell__pane-main" >
                <div class="l-shell__object-view">c-object-view</div>
                <div class="l-shell__time-conductor">c-time-conductor</div>
            </pane>
            <splitter align="vertical" target="shell-pane-main" collapse="to-right"></splitter>
            <pane class="l-pane l-shell__pane-inspector"
                  splitter="before"
                  collapsable>
                <MctInspector></MctInspector>
            </pane>
        </multipane>
        <div class="l-shell__status">
            [ Create Button ]
            <MctStatus></MctStatus>
            [ App Logo ]
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

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
    import MctStatus from './MctStatus.vue';
    import MctTree from './MctTree.vue';
    import search from '../controls/search.vue';
    import multipane from '../controls/multipane.vue';
    import pane from '../controls/pane.vue';

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
            search,
            multipane,
            pane
        }
    }
</script>

<template>
    <div class="l-shell">
        <div class="l-shell__head">
            [ Create Button ]
            [ App Logo ]
        </div>
        <multipane class="l-shell__main"
                   type="horizontal">
            <pane class="l-pane l-shell__pane-tree"
                  handle="after"
                  collapsable>
                <div class="l-shell__search">
                    <search class="c-search--major" ref="shell-search"></search>
                </div>
                <div class="l-shell__tree">
                    <MctTree ref="shell-tree"></MctTree>
                </div>
            </pane>
            <pane class="l-pane l-shell__pane-main">
                <div class="l-shell__main-container" ref="mainContainer"></div>
            </pane>
            <pane class="l-pane l-shell__pane-inspector"
                  handle="before"
                  collapsable>
                <MctInspector ref="inspector"></MctInspector>
            </pane>
        </multipane>
        <div class="l-shell__status">
            <MctStatus></MctStatus>
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

        /********** HEAD AND STATUS */
        &__head,
        &__status {
            flex: 0 1 auto;
        }

        &__head {
            border-bottom: 1px solid $colorInteriorBorder;
            height: 40px;
            padding: $interiorMarginLg;
        }

        &__status {
            background: $colorBodyFg;
            color: $colorBodyBg;
            border-top: 1px solid $colorInteriorBorder;
            height: 24px;
            padding: $interiorMarginSm;

        }

        /********** MAIN AREA */
        &__main {
            flex: 1 1 auto;
            display: flex;
            flex-flow: row nowrap;
        }

        &__main-container {
            // Wrapper for main views
            $m: $interiorMargin;
            overflow: auto;
            position: absolute;
            top: $m; right: $m; bottom: $m; left: $m;
        }

        &__tree {
            flex: 1 1 100%;
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

            // Create margin between shell elements in a pane
            > [class*="l-shell__"] + [class*="l-shell__"] {
                margin-top: $interiorMargin;
            }
        }

        &__pane-tree,
        &__pane-inspector {
            max-width: 30%;
            min-width: 5%;
        }

        &__pane-tree {
            $m: $interiorMargin;
            background: $colorTreeBg;
            padding: $m $m + ($splitterD) $m $m; // TODO: move this into pane.vue
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
        methods: {
            navigateTo(path, openmct) {
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

<template>
    <div class="l-shell">
        <div class="l-shell__head">
            [ Create Button ]
            [ App Logo ]
        </div>
        <multipane class="l-shell__main"
                   type="horizontal">
            <pane class="l-shell__pane-tree"
                  handle="after"
                  collapsable>
                <div class="l-shell__search">
                    <search class="c-search--major" ref="shell-search"></search>
                </div>
                <div class="l-shell__tree">
                    <mct-tree :nodes="treeRoots"></mct-tree>
                </div>
            </pane>
            <pane class="l-shell__pane-main">
                <div class="l-shell__main-container" ref="mainContainer"></div>
            </pane>
            <pane class="l-shell__pane-inspector"
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
        $m: $interiorMargin;
        position: absolute;
        top: 0; right: 0; bottom: 0; left: 0;
        display: flex;
        flex-flow: column nowrap;

        /*************************** MOBILE-FIRST */
        &__head {
            display: none;
        }

        &__status {
            background: $colorBodyFg;
            color: $colorBodyBg;
            border-top: 1px solid $colorInteriorBorder;
            height: 24px;
            padding: $interiorMarginSm;
        }

        &__pane-tree {
            background: $colorTreeBg;
            padding: $m;
            backface-visibility: hidden;
            transition: all 350ms ease-in-out;
            width: 30%;

            // Add drop shadow
            //background-image: linear-gradient(90deg, rgba(black, 0) calc(100% - 10px), rgba(black, 0.1) calc(100% - 2px), rgba(black, 0.2) 100%);

            [class*="collapse-button"] {
                // For mobile, collapse button becomes menu icon
                height: $mobileMenuIconD;
                width: $mobileMenuIconD;
                transform: translateX(100%);

                &:before {
                    color: $colorKey;
                    content: $glyph-icon-menu-hamburger;
                    font-size: 1.4em;
                }
            }
        }

        &__pane-main {
            transform: translateX(0);
            // width: 100%;
        }

        @include phonePortrait() {
            &__pane-tree {
                width: calc(100% - #{$mobileMenuIconD});

                + .l-pane {
                    // Hide pane-main over when this pane is expanded
                    opacity: 0;
                    pointer-events: none;
                }

                &[class*="--collapsed"] + .l-pane {
                    opacity: 1;
                    pointer-events: inherit;
                    transition: opacity 500ms ease 250ms;
                }
            }
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
            font-size: 16px; // TEMP FOR LEGACY STYLING
            overflow: auto;
            position: absolute;
            top: $m; right: $m; bottom: $m; left: $m;
        }

        &__tree {
            // Tree component within __pane-tree
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

        &__pane-main {
            flex: 1 1 auto;
        }

        &__pane-inspector {
            // Mobile-first
            display: none;
        }

        body.desktop & {
            /********** HEAD AND STATUS */
            &__head,
            &__status {
                display: block;
                flex: 0 1 auto;
            }

            &__head {
                border-bottom: 1px solid $colorInteriorBorder;
                height: 40px;
                padding: $interiorMarginLg;
            }

            &__pane-tree,
            &__pane-inspector {
                max-width: 30%;
                min-width: 5%;
            }

            &__pane-tree {
                width: 300px;
            }


            &__pane-inspector {
                display: flex;
            }
        }
    }
</style>

<script>
    import MctInspector from './MctInspector.vue';
    import MctMain from './MctMain.vue';
    import MctStatus from './MctStatus.vue';
    import MctTree from './mct-tree.vue';
    import search from '../controls/search.vue';
    import multipane from '../controls/multipane.vue';
    import pane from '../controls/pane.vue';

    export default {
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

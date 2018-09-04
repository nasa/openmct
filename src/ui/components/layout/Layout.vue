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
                  label="Browse"
                  collapsable>
                <div class="l-shell__search">
                    <search class="c-search--major" ref="shell-search"></search>
                </div>
                <div class="l-shell__tree">
                    <mct-tree></mct-tree>
                </div>
            </pane>
            <pane class="l-shell__pane-main">
                <browse-object class="l-shell__main-container">
                </browse-object>
                <mct-template template-key="conductor"
                              class="l-shell__time-conductor">
                </mct-template>
            </pane>
            <pane class="l-shell__pane-inspector l-pane--holds-multipane"
                  handle="before"
                  label="Inspect"
                  collapsable>
                <Inspector ref="inspector"></Inspector>
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

        &__status {
            background: $colorBodyFg;
            color: $colorBodyBg;
            border-top: 1px solid $colorInteriorBorder;
            height: 24px;
            padding: $interiorMarginSm;
        }

        &__pane-tree {
            background: $colorTreeBg;
            width: 40%;

            [class*="collapse-button"] {
                // For mobile, collapse button becomes menu icon
                body.mobile & {
                    height: $mobileMenuIconD;
                    width: $mobileMenuIconD;
                    transform: translateX(100%);

                    &:before {
                        color: $colorKey;
                        content: $glyph-icon-menu-hamburger;
                        font-family: symbolsfont;
                        font-size: 1.4em;
                    }
                }
            }
        }

        &__pane-main {
            > .l-pane__contents {
                display: flex;
                flex-flow: column nowrap;
            }
        }

        &__head,
        &__pane-inspector {
            body.mobile & {
                display: none;
            }
        }

        @include phonePortrait() {
            &__pane-tree {
                width: calc(100% - #{$mobileMenuIconD});

                + .l-pane {
                    // Hide pane-main when this pane is expanded
                    opacity: 0;
                    pointer-events: none;
                }

                &[class*="--collapsed"] + .l-pane {
                    // Show pane-main when tree is collapsed
                    opacity: 1;
                    pointer-events: inherit;
                    transition: opacity 250ms ease 250ms;
                }
            }
        }

        /********** MAIN AREA */
        &__main-container {
            // Wrapper for main views
            flex: 1 1 100%;
            font-size: 16px; // TEMP FOR LEGACY STYLING
        }

        &__tree {
            // Tree component within __pane-tree
            flex: 1 1 100%;
            overflow-y: auto;
        }

        &__time-conductor {
            border-top: 1px solid $colorInteriorBorder;
            flex: 0 0 auto;
            padding: $interiorMargin;
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
            }

            &__pane-tree {
                width: 300px;
            }

            &__pane-inspector {
                width: 200px;
            }
        }
    }
</style>

<script>
    import Inspector from '../inspector/Inspector.vue';
    import MctStatus from './MctStatus.vue';
    import MctTree from './mct-tree.vue';
    import BrowseObject from './BrowseObject.vue';
    import MctTemplate from '../legacy/mct-template.vue';

    import search from '../controls/search.vue';
    import multipane from '../controls/multipane.vue';
    import pane from '../controls/pane.vue';

    export default {
        components: {
            Inspector,
            MctStatus,
            MctTree,
            BrowseObject,
            'mct-template': MctTemplate,
            search,
            multipane,
            pane
        }
    }
</script>

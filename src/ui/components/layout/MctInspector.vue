<template>
    <multipane class="c-inspector"
               type="vertical">
        <pane class="c-inspector__properties">
            <div ref="properties"></div>
        </pane>
        <pane class="l-pane c-inspector__elements"
              handle="before"
              label="Elements">
            <div ref="elements">c-inspector__elements 1</div>
        </pane>
    </multipane>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    @mixin grid-two-column() {
        display: grid;
        grid-row-gap: 0;
        grid-template-columns: 1fr 2fr;
        align-items: start;
    }

    @mixin grid-two-column-span-cols() {
        grid-column: 1 / 3;
    }

    .c-inspector {
        min-width: 150px;

        > [class*="__"] {
            min-height: 50px;

            &:not(:last-child) {
                margin-bottom: $interiorMargin;
            }

            > .l-pane__contents > * {
                // Provide margin against scrollbar
                // TODO: move this into pane.vue
                margin-right: $interiorMarginSm;
            }
        }

        &__elements {
            height: 200px;
        }

        .l-inspector-part {
            display: contents; // Legacy
        }

        h2 {
            // Legacy, somewhat
            @include grid-two-column-span-cols;
            border-radius: $smallCr;
            background-color: $colorInspectorSectionHeaderBg;
            color: $colorInspectorSectionHeaderFg;
            font-size: .85em;
            font-weight: normal;
            margin: $interiorMarginLg 0 $interiorMarginSm 0;
            padding: $interiorMarginSm $interiorMargin;
            text-transform: uppercase;

            &.first {
                margin-top: 0;
            }
        }

        .grid-properties {
            .label {
                color: $colorInspectorPropName;
            }
            .value {
                color: $colorInspectorPropVal;
                word-break: break-all;
                &:first-child {
                    // If there is no preceding .label element, make value span columns
                    @include grid-two-column-span-cols;
                }
            }
        }
    }

    /******************************* PROPERTIES GRID */

    .grid-elem {
        &:not(:first-child) {
            border-top: 1px solid $colorInteriorBorder;
        }
        &.label {
            background-color: rgba(0,0,128,0.2);
        }
        &.value {
            background-color: rgba(0,128,0,0.2);
        }
    }

    // Properties grids
    .grid-properties, // LEGACY
    .l-grid-properties {
        @include grid-two-column;
    }

    .grid-row {
        display: contents;
    }

    .grid-span-all {
        @include grid-two-column-span-cols;
    }

    .grid-row {
        .grid-cell {
            padding: 3px $interiorMarginLg 3px 0;
            &[title] {
                // When a cell has a title, assume it's helpful text
                cursor: help;
            }
        }
        &.force-border,
        &:not(:first-of-type) {
            // Row borders, effected via border-top on child elements of the row
            .grid-cell {
                border-top: 1px solid $colorInspectorSectionHeaderBg;
            }
        }


        /************************************************************** LEGACY STYLES */
        .tree {
            .grid-properties {
                margin-left: $treeItemIndent + $interiorMarginLg;
            }
        }


        .inspector-location {
            display: inline-block;

            .location-item {
                $h: 1.2em;
                box-sizing: border-box;
                cursor: pointer;
                display: inline-block;
                line-height: $h;
                position: relative;
                padding: 2px 4px;
                .t-object-label {
                    .t-item-icon {
                        height: $h;
                        margin-right: $interiorMarginSm;
                    }
                }
                &:hover {
                    background: $colorItemTreeHoverBg;
                    color: $colorItemTreeHoverFg;
                    .icon {
                        color: $colorItemTreeIconHover;
                    }
                }
            }
            &:not(.last) .t-object-label .t-title-label:after {
                color: pushBack($colorInspectorFg, 15%);
                content: '\e904';
                display: inline-block;
                font-family: symbolsfont;
                font-size: 8px;
                font-style: normal !important;
                line-height: inherit;
                margin-left: $interiorMarginSm;
                width: 4px;
            }
        }

        // Elements pool
        .holder-elements {
            .current-elements {
                position: relative;
                .tree-item {
                    .t-object-label {
                        // Elements pool is a flat list, so don't indent items.
                        /*font-size: 0.75rem;*/
                        left: 0;
                    }
                }
            }
        }
    }
</style>

<script>
    import multipane from '../controls/multipane.vue';
    import pane from '../controls/pane.vue';
    export default {
        components: {
            multipane,
            pane
        }
    }
</script>

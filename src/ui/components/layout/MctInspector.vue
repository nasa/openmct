<template>
    <multipane class="c-inspector"
               type="vertical">
        <pane class="c-inspector__properties"
              ref="properties">
        </pane>
        <pane class="l-pane c-inspector__elements"
              handle="before"
              ref="elements">
            c-inspector__elements
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

    /******************************* INSPECTOR */
    .c-inspector {
        display: flex;
        flex-flow: column nowrap;
        height: 100%;

        > [class*="__"] {
            min-height: 50px;
            padding: $interiorMarginLg;
        }

        &__properties {
            flex: 1 1 auto;
        }

        &__elements {
            height: 25%;
            flex: 0 1 auto;
        }

        .l-inspector-part {
            display: contents;
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
    .l-grid-properties {
        @include grid-two-column;


        h2 {
            // Headers for .l-inspector-part elements
            @include grid-two-column-span-cols;
            border-radius: $controlCr;
            background-color: $colorInspectorSectionHeaderBg;
            color: $colorInspectorSectionHeaderFg;
            font-size: 0.9rem;
            font-weight: normal;
            margin: $interiorMarginLg 0 $interiorMarginSm 0;
            padding: $interiorMarginSm $interiorMargin;
            text-transform: uppercase;

            &.first {
                margin-top: 0;
            }
        }
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

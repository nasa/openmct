<template>
    <multipane class="c-inspector"
               type="vertical">
        <pane class="c-inspector__properties">
            <properties></properties>
            <location></location>
            <inspector-view></inspector-view>
        </pane>
        <pane class="c-inspector__elements"
              handle="before"
              label="Elements">
            <elements></elements>
        </pane>
    </multipane>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-inspector {
        min-width: 150px;

        > [class*="__"] {
            min-height: 50px;

            + [class*="__"] {
                // Margin between elements
                margin-top: $interiorMargin;
            }

            > .l-pane__contents {
                overflow: auto;

                > * {
                    // Fend off scrollbar
                    margin-right: $interiorMarginSm;
                }
            }
        }

        &__elements {
            // LEGACY TODO: Refactor when markup is updated, fix scrolling
            // so that only tree holder handles overflow
            height: 200px;

            .tree-item {
                .t-object-label {
                    // Elements pool is a flat list, so don't indent items.
                    left: 0;
                }
            }
        }

        /************************************************************** LEGACY */
        // TODO: refactor when markup can be converted
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
    }

    .c-properties {
        @include gridTwoColumn();

        + .c-properties {
            // Margin between components
            margin-top: $interiorMarginLg;
        }

        &__section,
        &__row {
            display: contents;
        }

        &__row + &__row {
            > [class*="__"] {
                // Row borders, effected via border-top on child elements of the row
                border-top: 1px solid $colorInspectorSectionHeaderBg;
            }
        }

        &__header {
            font-size: .85em;
            text-transform: uppercase;
        }

        &__label,
        &__value {
            padding: 3px $interiorMarginLg 3px 0;
        }

        &__label {
            color: $colorInspectorPropName;

            &[title] {
                // When a cell has a title, assume it's helpful text
                cursor: help;
            }
        }

        &__value {
            color: $colorInspectorPropVal;
            word-break: break-all;
            &:first-child {
                // If there is no preceding .label element, make value span columns
                @include gridTwoColumnSpanCols();
            }
        }
    }
</style>

<script>
    import multipane from '../controls/multipane.vue';
    import pane from '../controls/pane.vue';
    import Elements from './Elements.vue';
    import Location from './Location.vue';
    import Properties from './Properties.vue';
    import InspectorView from './InspectorView.vue';

    export default {
        inject: ['openmct'],
        components: {
            multipane,
            pane,
            Elements,
            Properties,
            Location,
            InspectorView
        }
    }
</script>

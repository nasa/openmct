<template>
    <multipane class="c-inspector"
               type="vertical">
        <pane class="c-inspector__properties">
            <properties></properties>
            <location></location>
            <inspector-views></inspector-views>
        </pane>
        <pane class="c-inspector__elements"
              handle="before"
              label="Elements" v-if="isEditing && hasComposition">
            <elements></elements>
        </pane>
    </multipane>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-inspector {
        > [class*="__"] {
            min-height: 50px;

            + [class*="__"] {
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
            height: 200px; // Initial height

            .tree-item {
                .t-object-label {
                    // Elements pool is a flat list, so don't indent items.
                    left: 0;
                }
            }
        }

        .c-color-swatch {
            $d: 12px;
            display: block;
            flex: 0 0 auto;
            width: $d;
            height: $d;
        }

        .c-tree {
            // When a tree is in the Inspector, remove scrolling and right pad
            overflow: visible;
            padding-right: 0;
        }

        /************************************************************** LEGACY */
        .l-inspector-part {
            display: contents;
        }

        h2 {
            @include propertiesHeader();
            font-size: 0.65rem;
            grid-column: 1 / 3;
        }

        .c-tree .grid-properties {
            margin-left: $treeItemIndent;
        }
    }

    .c-properties {
        display: grid;
        grid-row-gap: 0;
        grid-template-columns: 1fr 2fr;
        align-items: start;
        min-width: 150px;

        [class*="header"] {
            @include propertiesHeader();

            &:not(:first-child) {
                // Allow multiple headers within a component
                margin-top: $interiorMarginLg;
            }
        }

        [class*="span-all"],
        [class*="header"] {
            grid-column: 1 / 3;
        }

        + .c-properties {
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
                grid-column: 1 / 3;
            }
        }
    }
    /********************************************* LEGACY SUPPORT */
    .c-inspector {
        // FilterField.vue
        .u-contents + .u-contents {
            li.grid-row > * {
                border-top: 1px solid $colorInspectorSectionHeaderBg;
            }
        }

        li.grid-row + li.grid-row {
            > * {
                border-top: 1px solid $colorInspectorSectionHeaderBg;
            }
        }

        li.grid-row .label {
            color: $colorInspectorPropName;
        }

        li.grid-row .value {
            color: $colorInspectorPropVal;
            word-break: break-all;
            &:first-child {
                // If there is no preceding .label element, make value span columns
                grid-column: 1 / 3;
            }
        }
    }
</style>

<script>
    import multipane from '../layout/multipane.vue';
    import pane from '../layout/pane.vue';
    import Elements from './Elements.vue';
    import Location from './Location.vue';
    import Properties from './Properties.vue';
    import InspectorViews from './InspectorViews.vue';

    export default {
        inject: ['openmct'],
        props: {
            'isEditing': Boolean
        },
        components: {
            multipane,
            pane,
            Elements,
            Properties,
            Location,
            InspectorViews
        },
        data() {
            return {
                hasComposition: false
            }
        },
        methods: {
            refreshComposition(selection) {
                if (selection.length > 0 && selection[0].length > 0) {
                    let parentObject = selection[0][0].context.item;

                    this.hasComposition = !!(parentObject && this.openmct.composition.get(parentObject));
                }
            }
        },
        mounted() {
            this.openmct.selection.on('change', this.refreshComposition);
            this.refreshComposition(this.openmct.selection.get());
        },
        destroyed() {
            this.openmct.selection.off('change', this.refreshComposition);
        }
    }
</script>

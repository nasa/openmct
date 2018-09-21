<template>
    <!-- - TODO: styles for selectable, moveable, etc. -->
    <div class="c-frame has-local-controls"
         :style="item.style"
         :class="classObject"
         @dblclick="drill(item.id, $event)">
        <div class="c-frame__header">
            <div class="c-frame__header__start">
                <div class="c-frame__name icon-object">Header</div>
                <div class="c-frame__context-actions c-disclosure-button"></div>
            </div>
            <div class="c-frame__header__end">
                <div class="c-button icon-expand local-controls--hidden"></div>
            </div>
        </div>
        <object-view
                class="c-frame__object-view"
                :object="item.domainObject"></object-view>

        <!-- Drag handles -->
        <span class="abs t-edit-handle-holder" v-if="item.selected && !item.drilledIn">
            <span class="edit-handle edit-move">
            </span>
            <span class="edit-corner edit-resize-nw">
            </span>
            <span class="edit-corner edit-resize-ne">
            </span>
            <span class="edit-corner edit-resize-sw">
            </span>
            <span class="edit-corner edit-resize-se">
            </span>
        </span>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    /******************************* FRAME */
    .c-frame {
        display: flex;
        flex-direction: column;

        /*************************** HEADER */
        &__header {
            display: flex;
            align-items: center;
            flex: 0 0 auto;
            margin-bottom: $interiorMargin;

            > [class*="__"] {
                display: flex;
                align-items: center;
            }

            [class*="__start"] {
                flex: 0 0 auto;
            }

            [class*="__end"] {
                justify-content: flex-end;
                flex: 1 1 auto;

                [class*="button"] {
                    font-size: 0.7em;
                }
            }
        }

        &__name {
            @include ellipsize();
            flex: 0 1 auto;
            font-size: 1.2em;

            &:before {
                // Object type icon
                flex: 0 0 auto;
                margin-right: $interiorMarginSm;
            }
        }

        /*************************** OBJECT VIEW */
        &__object-view {
            flex: 1 1 auto;
            overflow: auto;
        }

        /*************************** NO-FRAME */
        &.no-frame {
            [class*="__header"] {
                display: none;
            }
        }

        &:not(.no-frame) {
            background: $colorBodyBg;
            border: 1px solid $colorInteriorBorder;
            padding: $interiorMargin;
        }
    }

</style>


<script>
    import ObjectView from '../../ui/components/layout/ObjectView.vue'

    export default {
        inject: ['openmct'],
        props: {
            item: Object
        },
        components: {
            ObjectView
        },
        computed: {
            classObject: function () {
                return {
                    's-drilled-in': this.item.drilledIn,
                    'no-frame': !this.item.hasFrame
                }
            }
        },
        methods: {
            setSelection(selection) {
                if (selection.length === 0) {
                    return;
                }

                let id = this.openmct.objects.makeKeyString(selection[0].context.item.identifier);
                if (this.item.id === id) {
                    this.$emit('selected', id);
                }
            },
            drill(id, $event) {
                if ($event) {
                    $event.stopPropagation();
                }

                if (!this.isBeingEdited(this.item.domainObject)) {
                    return;
                }

                if (this.openmct.composition.get(this.item.domainObject) === undefined) {
                    return;
                }

                // Disable for fixed position.
                if (this.item.domainObject.type === 'telemetry.fixed') {
                    return;
                }

                this.$emit('drilledIn', id);
            },
            isBeingEdited(object) {
                // TODO: add logic when inEditContext() is implemented in Vue.
                return true;
            }
        },
        mounted() {
            this.removeSelectable = this.openmct.selection.selectable(
                this.$el,
                {
                    item: this.item.domainObject
                },
                this.item.selected
            );

            this.openmct.selection.on('change', this.setSelection);
        },
        destroyed() {
            this.openmct.off('change', this.selection);
            this.removeSelectable();
        }
    }
</script>
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
        <div class="c-frame-edit">
            <div class="c-frame-edit__move"></div>
            <div class="c-frame-edit__handle --nw"></div>
            <div class="c-frame-edit__handle --ne"></div>
            <div class="c-frame-edit__handle --se"></div>
            <div class="c-frame-edit__handle --sw"></div>
        </div>
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

        /*************************** SELECTION */
        &.s-selected {
            //Legacy name for now
            border-color: $colorKey;
        }

        &.is-drilled-in {
            border: 1px dashed deeppink;
        }
    }

    /*************************** EDITING */
    .is-editing .c-frame:not(.is-drilled-in) {
        border: 1px dotted rgba($colorKey, 0.5);

        &.s-selected {
            > .c-frame-edit {
                display: block;
            }
        }
    }

    .c-frame-edit {
        $z: 10;

        @include abs();
        box-shadow: rgba($colorKey, 1) 0 0 10px;
        display: none;

        &__move {
            @include abs();
            cursor: move;
            z-index: $z;
        }

        &__handle {
            $d: 8px;
            $o: floor($d * -0.5);
            background: rgba($colorKey, 0.3);
            border: 1px solid $colorKey;
            position: absolute;
            width: $d; height: $d;
            top: auto; right: auto; bottom: auto; left: auto;
            z-index: $z + 1;

            &:before {
                // Extended hit area
                $m: -5px;
                content: '';
                display: block;
                position: absolute;
                top: $m; right: $m; bottom: $m; left: $m;
                z-index: -1;
            }

            &:hover {
                background: $colorKey;
            }

            &.--nw {
                cursor: nw-resize;
                left: $o; top: $o;
            }

            &.--ne {
                cursor: ne-resize;
                right: $o; top: $o;
            }

            &.--se {
                cursor: se-resize;
                right: $o; bottom: $o;
            }

            &.--sw {
                cursor: sw-resize;
                left: $o; bottom: $o;
            }
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
                    'is-drilled-in': this.item.drilledIn,
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
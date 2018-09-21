<template>
    <div class="l-layout"
         :class="[{
            'is-editing': isEditing === true
         }]">
        <toolbar class="l-layout__toolbar"></toolbar>
        <div class="l-layout__object">
            <!-- Background grid -->
            <div class="l-layout__grid-holder c-grid" v-if="!drilledIn">
                <div class="c-grid__x l-grid l-grid-x"
                     v-if="gridSize[0] >= 3"
                     :style="[{ backgroundSize: gridSize[0] + 'px 100%' }]">
                </div>
                <div class="c-grid__y l-grid l-grid-y"
                     v-if="gridSize[1] >= 3"
                     :style="[{ backgroundSize: '100%' + gridSize[1] + 'px' }]"></div>
            </div>

            <layout-frame v-for="item in frameItems"
                          class="l-layout__frame"
                          :key="item.id"
                          :item="item"
                          @drilledIn="updateDrilledInState"
                          @selected="updateSelectedState">
            </layout-frame>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .l-layout,
    .c-grid,
    .c-grid__x,
    .c-grid__y {
        @include abs();
    }

    .l-layout {
        display: flex;
        flex-direction: column;

        &.is-editing {
            > [class*="__object"] {
                background: rgba($colorKey, 0.1);
                box-shadow: inset rgba($colorKey, 0.7) 0 0 4px;
            }
        }

        &:not(.is-editing) {
            [class*="__grid-holder"],
            > [class*="__toolbar"] {
                display: none;
            }
        }

        &__toolbar {
            flex: 0 0 auto;
            margin-bottom: $interiorMargin;
        }

        &__object {
            flex: 1 1 auto;
            overflow: auto;
        }

        &__frame {
            position: absolute;
        }
    }

    .c-grid {
        z-index: -1;
        pointer-events: none;

        &__x  { @include bgTicks($colorGridLines, 'x'); }
        &__y  { @include bgTicks($colorGridLines, 'y'); }
    }
</style>


<script>
    import LayoutFrame from './LayoutFrame.vue';
    import Toolbar from '../../ui/components/layout/Toolbar.vue';
    
    const DEFAULT_GRID_SIZE = [32, 32],
          DEFAULT_DIMENSIONS = [12, 8],
          MINIMUM_FRAME_SIZE = [320, 180];

    export default {
        data() {
            return {
                gridSize: DEFAULT_GRID_SIZE,
                frameItems: [],
                frames: [],                
                composition: Object,
                frameStyles: [],
                rawPositions: {},
                isEditing: true,
                initSelect: true,
                drilledIn: undefined
            }
        },          
        inject: ['openmct'],
        props: ['domainObject'],
        components: {
            LayoutFrame,
            Toolbar
        },
        created: function () {
            console.log("domainObject", JSON.parse(JSON.stringify(this.domainObject)));                    

            this.populatePositions(this.domainObject.configuration.layout.panels);

            this.composition = this.openmct.composition.get(this.domainObject);
            this.composition.on('add', this.onAddComposition);
            this.composition.on('remove', this.onRemoveComposition);
            this.composition.load();
        },
        methods: {            
            onAddComposition(domainObject) {
                console.log('composition object', domainObject);
                const id = this.openmct.objects.makeKeyString(domainObject.identifier)
                this.frameItems.push({
                    id: id,
                    hasFrame: this.hasFrame(id),
                    domainObject,
                    style: this.frameStyles[id],
                    drilledIn: this.isDrilledIn(id),
                    selected: false
                });
            },
            onRemoveComposition(identifier) {
                // TODO: remove the object from frameItems
            },
            populatePositions(panels) {
                Object.keys(panels).forEach(function (key, index) {
                    this.rawPositions[key] = {
                        position: panels[key].position || this.defaultPosition(index),
                        dimensions: panels[key].dimensions || this.defaultDimensions()
                    };
                    this.frameStyles[key] = this.convertPosition(this.rawPositions[key]);
                    this.frames[key] = panels[key].hasFrame;
                }.bind(this));
            },
            defaultPosition(index) {
                return [index, index];
            },
            defaultDimensions() {
                let gridSize = this.gridSize;
                return MINIMUM_FRAME_SIZE.map(function (min, i) {
                    return Math.max(
                        Math.ceil(min / gridSize[i]),
                        DEFAULT_DIMENSIONS[i]
                    );
                });
            },
            convertPosition(raw) {
                return {
                    left: (this.gridSize[0] * raw.position[0]) + 'px',
                    top: (this.gridSize[1] * raw.position[1]) + 'px',
                    width: (this.gridSize[0] * raw.dimensions[0]) + 'px',
                    height: (this.gridSize[1] * raw.dimensions[1]) + 'px',
                    minWidth: (this.gridSize[0] * raw.dimensions[0]) + 'px',
                    minHeight: (this.gridSize[1] * raw.dimensions[1]) + 'px'
                };
            },
            hasFrame(id) {
                return this.frames[id]
            },
            setSelection(selection) {
                if (selection.length === 0) {
                    return;
                }

                this.updateDrilledInState();
                this.updateSelectedState();
            },
            updateDrilledInState(id) {
                this.drilledIn = id;
                this.frameItems.forEach(function (item) {
                    item.drilledIn = item.id === id;
                });
            },
            updateSelectedState(id) {
                this.frameItems.forEach(function (item) {
                    item.selected = item.id === id;
                });
            },
            isDrilledIn(id) {
                return this.drilledIn === id;
            }
        },
        mounted() {
            this.removeSelectable = this.openmct.selection.selectable(
                this.$el,
                {
                    item: this.domainObject
                },
                this.initSelect
            );

            this.openmct.selection.on('change', this.setSelection);
        },
        destroyed: function () {
            this.composition.off('add', this.onAddComposition);
            this.composition.off('remove', this.onRemoveComposition);
            this.openmct.off('change', this.selection);
            this.removeSelectable();
        }
    }
    
</script>
<template>
    <div class="l-layout"
         droppable="true" @drop="handleDrop">
        <div class="l-layout__object">
            <!-- Background grid -->
            <div class="l-layout__grid-holder c-grid"
                 v-if="!drilledIn">
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
                          :gridSize="gridSize"
                          @drilledIn="updateDrilledInState"
                          @dragInProgress="updatePosition"
                          @endDrag="mutate">
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

        &__grid-holder {
            display: none;
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

    .is-editing {
        .l-layout {
            background: rgba($colorKey, 0.1);

            &.s-selected,
            &.s-selected-parent {
                [class*="__grid-holder"] {
                    display: block;
                }
            }
        }
    }
</style>


<script>
    import LayoutFrame from './LayoutFrame.vue';

    const DEFAULT_GRID_SIZE = [32, 32],
          DEFAULT_DIMENSIONS = [12, 8],
          DEFAULT_POSITION = [0, 0],
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
            LayoutFrame
        },
        created: function () {
            console.log("domainObject", JSON.parse(JSON.stringify(this.domainObject)));
            this.composition = this.openmct.composition.get(this.domainObject);
            if (this.composition !== undefined) {
                this.composition.load().then((composition) => {
                    composition.forEach(function (domainObject) {
                        this.readLayoutConfiguration(domainObject);
                        this.makeFrameItem(domainObject, false);
                    }.bind(this));
                    this.composition.on('add', this.onAddComposition);
                    this.composition.on('remove', this.onRemoveComposition);
                });
            }

            this.unlisten = this.openmct.objects.observe(this.domainObject, '*', function (obj) {
                this.domainObject = JSON.parse(JSON.stringify(obj));
                this.gridSize = this.domainObject.layoutGrid;
            }.bind(this));
        },
        methods: {
            readLayoutConfiguration(domainObject) {
                let panels = this.domainObject.configuration.layout.panels;
                let id = this.openmct.objects.makeKeyString(domainObject.identifier);
                this.rawPositions[id] = {
                    position: panels[id].position || DEFAULT_POSITION,
                    dimensions: panels[id].dimensions || this.defaultDimensions()
                };
                this.frameStyles[id] = this.convertPosition(this.rawPositions[id]);
                this.frames[id] = panels[id].hasFrame;
            },
            makeFrameItem(domainObject, initSelect) {
                let id = this.openmct.objects.makeKeyString(domainObject.identifier);
                this.frameItems.push({
                    id: id,
                    hasFrame: this.hasFrame(id),
                    domainObject,
                    style: this.frameStyles[id],
                    drilledIn: this.isDrilledIn(id),
                    initSelect: initSelect,
                    rawPosition: this.rawPositions[id]
                });
            },
            onAddComposition(domainObject) {
                console.log('onAddComposition', domainObject);
                // TODO: set the appropriate values in rawPositions, frameStyles and frames
                this.makeFrameItem(domainObject, true);
            },
            onRemoveComposition(identifier) {
                // TODO: remove the object from frameItems
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
            },
            updateDrilledInState(id) {
                this.drilledIn = id;
                this.frameItems.forEach(function (item) {
                    item.drilledIn = item.id === id;
                });
            },
            isDrilledIn(id) {
                return this.drilledIn === id;
            },
            updatePosition(id, newPosition) {
                let newStyle = this.convertPosition(newPosition);
                this.frameStyles[id] = newStyle;
                this.rawPositions[id] = newPosition;
                this.frameItems.forEach(function (item) {
                    if (item.id === id) {
                        item.style = newStyle;
                        item.rawPosition = newPosition;
                    }
                });
            },
            mutate(id) {
                console.log("endDrag");
                this.dragInProgress = true;
                setTimeout(function () {
                    this.dragInProgress = false;
                }.bind(this), 0);

                // TODO: mutate the domainObject with the new position value
            },
            handleDrop($event) {
                var child = JSON.parse($event.dataTransfer.getData('text/plain'));
                this.composition.add(child);
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
            this.unlisten();
        }
    }
    
</script>
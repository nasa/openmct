/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

<template>
    <div class="l-layout"
         @dragover="handleDragOver"
         @click="bypassSelection"
         @drop="handleDrop">
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
                          @endDrag="endDrag">
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
        pointer-events: none;

        &__x  { @include bgTicks($colorGridLines, 'x'); }
        &__y  { @include bgTicks($colorGridLines, 'y'); }
    }

    .is-editing {
        .l-shell__main-container > .l-layout {
            // Target the top-most layout container and color its background
            background: rgba($editColor, 0.1);
        }

        [s-selected],
        [s-selected-parent] {
            .l-layout {
                // Show the layout grid for the top-most child of the current selection,
                // and hide the grid for deeper nested levels.
                [class*="__grid-holder"] {
                    display: block;
                }

                .l-layout [class*="__grid-holder"] {
                    display: none;
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
          MINIMUM_FRAME_SIZE = [320, 180],
          DEFAULT_HIDDEN_FRAME_TYPES = [
            'hyperlink'
          ];

    export default {
        data() {
            return {
                gridSize: [],
                frameItems: [],
                frames: [],
                frameStyles: [],
                rawPositions: {},
                drilledIn: undefined
            }
        },          
        inject: ['openmct'],
        props: ['domainObject'],
        components: {
            LayoutFrame
        },
        created: function () {
            this.newDomainObject = this.domainObject;
            this.gridSize = this.newDomainObject.layoutGrid ||  DEFAULT_GRID_SIZE;
            this.composition = this.openmct.composition.get(this.newDomainObject);
            this.Listeners = [];
            let panels = (((this.newDomainObject.configuration || {}).layout || {}).panels || {});

            if (this.composition !== undefined) {
                this.composition.load().then((composition) => {
                    composition.forEach(function (domainObject) {
                        this.readLayoutConfiguration(domainObject, panels);
                        this.makeFrameItem(domainObject, false);
                    }.bind(this));
                    this.composition.on('add', this.onAddComposition);
                    this.composition.on('remove', this.onRemoveComposition);
                });
            }

            this.unlisten = this.openmct.objects.observe(this.newDomainObject, '*', function (obj) {
                this.newDomainObject = JSON.parse(JSON.stringify(obj));
                this.gridSize = this.newDomainObject.layoutGrid || DEFAULT_GRID_SIZE;;
            }.bind(this));
        },
        methods: {
            readLayoutConfiguration(domainObject, panels) {
                let id = this.openmct.objects.makeKeyString(domainObject.identifier);
                this.rawPositions[id] = {
                    position: panels[id].position || DEFAULT_POSITION,
                    dimensions: panels[id].dimensions || this.defaultDimensions()
                };
                this.frameStyles[id] = this.convertPosition(this.rawPositions[id]);
                this.frames[id] = panels[id].hasOwnProperty('hasFrame') ? 
                                panels[id].hasFrame :
                                this.hasFrameByDefault(domainObject.type);
            },
            makeFrameItem(domainObject, initSelect) {
                let id = this.openmct.objects.makeKeyString(domainObject.identifier);
                this.frameItems.push({
                    id: id,
                    hasFrame: this.frames[id],
                    domainObject,
                    style: this.frameStyles[id],
                    drilledIn: this.isDrilledIn(id),
                    initSelect: initSelect,
                    rawPosition: this.rawPositions[id]
                });
            },
            onAddComposition(domainObject) {
                let id = this.openmct.objects.makeKeyString(domainObject.identifier);
                this.rawPositions[id] = {
                    position: [
                        Math.floor(this.droppedObjectPosition.x / this.gridSize[0]),
                        Math.floor(this.droppedObjectPosition.y / this.gridSize[1])
                    ],
                    dimensions: this.defaultDimensions()
                };
                this.frameStyles[id] = this.convertPosition(this.rawPositions[id]);
                this.frames[id] = this.hasFrameByDefault(domainObject.type);

                let newPanel = this.rawPositions[id];
                newPanel.hasFrame = this.frames[id];
                this.mutate("configuration.layout.panels[" + id + "]", newPanel);
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
            /**
             * Checks if the frame should be hidden or not.
             *
             * @param type the domain object type
             * @return {boolean} true if the object should have
             *         frame by default, false, otherwise
             */
            hasFrameByDefault(type) {
                return DEFAULT_HIDDEN_FRAME_TYPES.indexOf(type) === -1;
            },
            setSelection(selection) {
                if (selection.length === 0) {
                    return;
                }

                let domainObject = selection[0].context.item;
                if (domainObject && domainObject === this.selectedObject) {
                    return;
                }
                
                this.selectedObject = domainObject;
                this.removeListeners();

                if (selection[1]) {
                    this.attachSelectionListeners();
                }

                this.updateDrilledInState();
            },
            attachSelectionListeners() {
                let id = this.openmct.objects.makeKeyString(this.selectedObject.identifier);
                let path = "configuration.layout.panels[" + id + "]";
                this.listeners.push(this.openmct.objects.observe(this.newDomainObject, path + ".hasFrame", function (newValue) {
                    this.frameItems.forEach(function (item) {
                        if (item.id === id) {
                            item.hasFrame = newValue;
                        }
                    });
                    this.frames[id] = newValue;
                }.bind(this)));  
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
            bypassSelection($event) {
                if (this.dragInProgress) {
                    if ($event) {
                        $event.stopImmediatePropagation();
                    }
                    return;
                }
            },
            endDrag(id) {
                this.dragInProgress = true;
                setTimeout(function () {
                    this.dragInProgress = false;
                }.bind(this), 0);

                let path = "configuration.layout.panels[" + id + "]";
                this.mutate(path + ".dimensions", this.rawPositions[id].dimensions);
                this.mutate(path + ".position", this.rawPositions[id].position);
            },
            mutate(path, value) {
                this.openmct.objects.mutate(this.newDomainObject, path, value);
            },
            handleDrop($event) {
                $event.preventDefault();
                $event.stopPropagation();

                let child = JSON.parse($event.dataTransfer.getData('domainObject'));
                let duplicates = [];
                let composition = this.newDomainObject.composition;
                composition.forEach((object) => {
                    if (this.openmct.objects.makeKeyString(JSON.parse(JSON.stringify(object))) ===
                        this.openmct.objects.makeKeyString(child.identifier)) {
                        duplicates.push(object);
                    }
                });

                // Disallow adding a duplicate object to the composition
                if (duplicates.length !== 0) {
                    return;
                }

                let elementRect = this.$el.getBoundingClientRect();
                this.droppedObjectPosition = {
                    x: $event.pageX - elementRect.left,
                    y: $event.pageY - elementRect.top
                }
                // TODO: use the composition API to add child once the default composition
                // provider supports it instead of mutating the composition directly.
                // this.composition.add(child).
                composition.push(child.identifier);
                this.mutate('composition', composition);
            },
            handleDragOver($event){
                $event.preventDefault();
            },
            removeListeners() {
                if (this.listeners) {
                    this.listeners.forEach(function (l) {
                        l();
                    })
                }
                this.listeners = [];
            }
        },
        mounted() {
            this.openmct.selection.on('change', this.setSelection);
        },
        destroyed: function () {
            this.composition.off('add', this.onAddComposition);
            this.composition.off('remove', this.onRemoveComposition);
            this.openmct.off('change', this.selection);
            this.unlisten();
            this.removeListeners();
        }
    }
    
</script>
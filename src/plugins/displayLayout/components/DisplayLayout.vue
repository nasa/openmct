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
            <layout-item v-for="(item, index) in layoutItems"
                          class="l-layout__frame"
                          :key="index"
                          :item="item"
                          :gridSize="gridSize"
                          @drilledIn="updateDrilledInState"
                          @dragInProgress="updatePosition"
                          @endDrag="endDrag">
            </layout-item>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .l-layout {
        @include abs();
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

    .l-shell__main-container {
        > .l-layout {
            [s-selected] {
                border: $browseBorderSelected;
            }
        }
    }

    // Styles moved to _global.scss;
</style>


<script>
    import LayoutItem from './LayoutItem.vue';
    import TelemetryViewConfiguration from './../TelemetryViewConfiguration.js'
    import SubobjectViewConfiguration from './../SubobjectViewConfiguration.js'

    const DEFAULT_GRID_SIZE = [32, 32],
          DEFAULT_DIMENSIONS = [12, 8],
          DEFAULT_TELEMETRY_DIMENSIONS = [2, 1],
          DEFAULT_POSITION = [0, 0],
          MINIMUM_FRAME_SIZE = [320, 180],
          DEFAULT_HIDDEN_FRAME_TYPES = [
            'hyperlink'
          ];

    export default {
        data() {
            return {
                gridSize: [],
                layoutItems: [],
                drilledIn: undefined
            }
        },          
        inject: ['openmct'],
        props: ['domainObject'],
        components: {
            LayoutItem
        },
        created: function () {
            this.newDomainObject = this.domainObject;
            this.gridSize = this.newDomainObject.layoutGrid ||  DEFAULT_GRID_SIZE;

            // Read layout configuration
            this.getPanels();
            this.getAlphanumerics();

            this.unlisten = this.openmct.objects.observe(this.newDomainObject, '*', function (obj) {
                this.newDomainObject = JSON.parse(JSON.stringify(obj));
                this.gridSize = this.newDomainObject.layoutGrid || DEFAULT_GRID_SIZE;;
            }.bind(this));
        },
        methods: {
            getPanels() {
                let panels = this.newDomainObject.configuration.panels;

                for (const id in panels) {
                    let panel = panels[id];
                    this.openmct.objects.get(id).then(domainObject => {
                        panel.domainObject = domainObject;
                        panel.position = panel.position || DEFAULT_POSITION;
                        panel.dimensions = panel.dimensions || this.getSubobjectDefaultDimensions();
                        panel.hasFrame = panel.hasOwnProperty('hasFrame') ?
                            panel.hasFrame :
                            this.hasFrameByDefault(domainObject.type);
                        this.makeFrameItem(panel, false);    
                    });
                };
            },
            getAlphanumerics() {
                let alphanumerics = this.newDomainObject.configuration.alphanumerics || [];
                alphanumerics.forEach((alphanumeric, index) => {
                    alphanumeric.index = index;
                    this.makeTelemetryItem(alphanumeric, false);
                });
            },
            makeFrameItem(panel, initSelect) {
                let rawPosition = {
                    position: panel.position,
                    dimensions: panel.dimensions
                };
                let style = this.convertPosition(rawPosition);
                let id = this.openmct.objects.makeKeyString(panel.domainObject.identifier);
                let config = new SubobjectViewConfiguration(
                    this.newDomainObject, id, panel.hasFrame, rawPosition, openmct);

                this.layoutItems.push({
                    id: id,
                    domainObject: panel.domainObject,
                    style: style,
                    drilledIn: this.isItemDrilledIn(id),
                    initSelect: initSelect,
                    type: 'subobject-view',
                    config: config
                });
            },
            makeTelemetryItem(alphanumeric, initSelect) {
                let rawPosition = {
                    position: alphanumeric.position,
                    dimensions: alphanumeric.dimensions
                };
                let style = this.convertPosition(rawPosition);
                let id = this.openmct.objects.makeKeyString(alphanumeric.identifier);

                this.openmct.objects.get(id).then(domainObject => {
                    let config = new TelemetryViewConfiguration(
                        this.newDomainObject, alphanumeric, rawPosition, openmct);

                    this.layoutItems.push({
                        id: id,
                        domainObject: domainObject,
                        style: style,
                        initSelect: initSelect,
                        alphanumeric: alphanumeric,
                        type: 'telemetry-view',
                        config: config
                    });
                });
            },
            getSubobjectDefaultDimensions() {
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

                this.updateDrilledInState();
            },
            updateDrilledInState(id) {
                this.drilledIn = id;
                this.layoutItems.forEach(function (item) {
                    if (item.type === 'subobject-view') {
                        item.drilledIn = item.id === id;
                    }
                });
            },
            isItemDrilledIn(id) {
                return this.drilledIn === id;
            },
            updatePosition(item, newPosition) {
                let id = item.id;
                let newStyle = this.convertPosition(newPosition);
                item.config.rawPosition = newPosition;
                item.style = newStyle;
            },
            bypassSelection($event) {
                if (this.dragInProgress) {
                    if ($event) {
                        $event.stopImmediatePropagation();
                    }
                    return;
                }
            },
            endDrag(item) {
                this.dragInProgress = true;
                setTimeout(function () {
                    this.dragInProgress = false;
                }.bind(this), 0);

                item.config.mutatePosition();
            },
            mutate(path, value) {
                this.openmct.objects.mutate(this.newDomainObject, path, value);
            },
            handleDrop($event) {
                $event.preventDefault();

                let domainObject = JSON.parse($event.dataTransfer.getData('domainObject'));
                let elementRect = this.$el.getBoundingClientRect();
                let droppedObjectPosition = {
                    x: $event.pageX - elementRect.left,
                    y: $event.pageY - elementRect.top
                }

                if (this.isTelemetry(domainObject)) {
                    this.addAlphanumeric(domainObject, droppedObjectPosition);
                } else {
                    this.addPanel(domainObject, droppedObjectPosition);
                }
            },
            addPanel(domainObject, position) {
                let id = this.openmct.objects.makeKeyString(domainObject.identifier);
                this.openmct.composition.get(this.newDomainObject).load()
                    .then(composition => {
                        const result = composition.filter(object => 
                            id === this.openmct.objects.makeKeyString(object.identifier)
                        );

                        // Do not add the object if it's already in the composition.
                        if (result.length > 0) {
                            return;
                        }

                        let panel = {
                            position: [
                                Math.floor(position.x / this.gridSize[0]),
                                Math.floor(position.y / this.gridSize[1])
                            ],
                            dimensions: this.getSubobjectDefaultDimensions(),
                            hasFrame: this.hasFrameByDefault(domainObject.type)
                        };
                        let path = "configuration.panels[" + id + "]";
                        this.mutate(path, panel);
                        panel.domainObject = domainObject;
                        this.makeFrameItem(panel, true);
                    });
            },
            addAlphanumeric(domainObject, position) {
                let alphanumeric = {
                    identifier: domainObject.identifier,
                    position: [
                        Math.floor(position.x / this.gridSize[0]),
                        Math.floor(position.y / this.gridSize[1])
                    ],
                    dimensions: DEFAULT_TELEMETRY_DIMENSIONS,
                    displayMode: 'all',
                    value: 'sin',
                    stroke: "transparent",
                    fill: "",
                    color: "",
                    size: "13px",
                };
                let alphanumerics = this.newDomainObject.configuration.alphanumerics || [];
                alphanumeric.index = alphanumerics.push(alphanumeric) - 1;
                this.mutate("configuration.alphanumerics", alphanumerics);
                this.makeTelemetryItem(alphanumeric, true);
            },
            handleDragOver($event){
                $event.preventDefault();
            },
            isTelemetry(domainObject) {
                if (this.openmct.telemetry.isTelemetryObject(domainObject)
                    && domainObject.type !== 'summary-widget') {
                    return true;
                } else {
                    return false;
                }
            }
        },
        mounted() {
            this.openmct.selection.on('change', this.setSelection);
        },
        destroyed: function () {
            this.openmct.off('change', this.setSelection);
            this.unlisten();
        }
    }
    
</script>
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
            this.composition = this.openmct.composition.get(this.newDomainObject);
            this.Listeners = [];

            if (this.composition) {
                this.composition.load();
                this.composition.on('add', this.onAddComposition);
                this.composition.on('remove', this.onRemoveComposition);
            }

            // Read configuration
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
                        panel.dimensions = panel.dimensions || this.defaultDimensions();
                        panel.hasFrame = panel.hasOwnProperty('hasFrame') ?
                            panel.hasFrame :
                            this.hasFrameByDefault(domainObject.type);
                        this.makeFrameItem(panel, false);    
                    });
                };
            },
            getAlphanumerics() {
                console.log("configuration", {...this.newDomainObject.configuration});
                let alphanumerics = this.newDomainObject.configuration.alphanumerics || [];
                alphanumerics.forEach((alpha, i) => {
                    alpha.index = i;
                    this.makeTelemetryItem(alpha, false);
                });
            },
            makeFrameItem(panel, initSelect) {
                let rawPosition = {
                    position: panel.position,
                    dimensions: panel.dimensions
                };
                let style = this.convertPosition(rawPosition);
                let id = this.openmct.objects.makeKeyString(panel.domainObject.identifier);
                let subobjectViewConfiguration = new SubobjectViewConfiguration(
                    this.newDomainObject,
                    id,
                    rawPosition,
                    style,
                    openmct
                );
                this.layoutItems.push({
                    id: id,
                    hasFrame: panel.hasFrame,
                    domainObject: panel.domainObject,
                    style: style,
                    drilledIn: this.isDrilledIn(id),
                    initSelect: initSelect,
                    rawPosition: rawPosition,
                    type: 'subobject-view',
                    config: subobjectViewConfiguration
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
                    let telemetryViewConfiguration = new TelemetryViewConfiguration(
                        this.newDomainObject,
                        alphanumeric,
                        rawPosition,
                        style,
                        openmct
                    );
                    this.layoutItems.push({
                        id: id,
                        domainObject: domainObject,
                        style: style,
                        initSelect: initSelect,
                        rawPosition: rawPosition,
                        alphanumeric: alphanumeric,
                        type: 'telemetry-view',
                        config: telemetryViewConfiguration
                    });
                });
            },
            onAddComposition(domainObject) {

            },
            onRemoveComposition(identifier) {

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

                this.removeListeners();
                let view = selection[0].context.view;

                if (selection[1] && view) {
                    if (view.type === 'telemetry-view' ) {
                        this.attachAlphanumericListeners(view);
                    } else if (view.type === 'subobject-view') {
                        this.attachPanelListeners(view);
                    }
                    // TODO: Replace with view.config.attachListeners();
                }

                this.updateDrilledInState();
            },
            attachPanelListeners(item) {
                let path = "configuration.panels[" + item.id + "]";
                this.listeners.push(this.openmct.objects.observe(this.newDomainObject, path + ".hasFrame", function (newValue) {
                    item.hasFrame = newValue;
                    // TODO: should update item.config.hasFrame?
                }.bind(this)));
            },
            attachAlphanumericListeners(item) {
                // TODO: listen for displayMode and value changes
            },
            updateDrilledInState(id) {
                this.drilledIn = id;
                this.layoutItems.forEach(function (item) {
                    item.drilledIn = item.id === id;
                });
            },
            isDrilledIn(id) {
                return this.drilledIn === id;
            },
            updatePosition(item, newPosition) {
                console.log("updatePosition");
                let id = item.id;
                let newStyle = this.convertPosition(newPosition);
                item.config.style = newStyle;
                item.config.rawPosition = newPosition;
                item.style = newStyle;
                item.rawPosition = newPosition;
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
                this.droppedObjectPosition = {
                    x: $event.pageX - elementRect.left,
                    y: $event.pageY - elementRect.top
                }

                if (this.isTelemetry(domainObject)) {
                    this.addNewAlphanumeric(domainObject);
                } else {
                    this.addNewPanel(domainObject);
                }
            },
            addNewPanel(domainObject) {
                // TODO: check if object exists in composition.

                let id = this.openmct.objects.makeKeyString(domainObject.identifier);
                let position = [
                        Math.floor(this.droppedObjectPosition.x / this.gridSize[0]),
                        Math.floor(this.droppedObjectPosition.y / this.gridSize[1])
                ];
                let newPanel = {};
                newPanel.position = position;
                newPanel.dimensions = this.defaultDimensions();
                newPanel.hasFrame = this.hasFrameByDefault(domainObject.type);

                let path = "configuration.panels[" + id + "]";
                this.mutate(path, newPanel);

                newPanel.domainObject = domainObject;
                this.makeFrameItem(newPanel, true);
            },
            addNewAlphanumeric(domainObject) {
                let position = [
                    Math.floor(this.droppedObjectPosition.x / this.gridSize[0]),
                    Math.floor(this.droppedObjectPosition.y / this.gridSize[1])
                ];
                let newAlpha = {}; 
                newAlpha.identifier = domainObject.identifier;
                newAlpha.position = position;
                newAlpha.dimensions = this.defaultDimensions();
                newAlpha.displayMode = 'all'; // Default mode
                newAlpha.value = 'sine'; // Default value

                let alphanumerics = this.newDomainObject.configuration.alphanumerics || [];
                newAlpha.index = alphanumerics.push(newAlpha) - 1;

                this.mutate("configuration.alphanumerics", alphanumerics);
                this.makeTelemetryItem(newAlpha, true);
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
            },
            isTelemetry(domainObject) {
                let type = domainObject.type;
                let typeDef = this.openmct.types.get(type).definition;

                if (this.openmct.telemetry.isTelemetryObject(domainObject)
                    && type !== 'summary-widget') {
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
            if (this.composition) {
                this.composition.off('add', this.onAddComposition);
                this.composition.off('remove', this.onRemoveComposition);    
            }

            this.openmct.off('change', this.setSelection);
            this.unlisten();
            this.removeListeners();
        }
    }
    
</script>
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
    import ElementViewConfiguration from './../ElementViewConfiguration.js'

    const DEFAULT_GRID_SIZE = [10, 10];

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
        methods: {
            getAlphanumerics() {
                let alphanumerics = this.newDomainObject.configuration.alphanumerics || [];
                alphanumerics.forEach((alphanumeric, index) => {
                    alphanumeric.index = index;
                    this.makeTelemetryItem(alphanumeric, false);
                });
            },
            getElements() {
                let elements = this.newDomainObject.configuration.elements || [];
                elements.forEach((element, index) => {
                    element.index = index;
                    this.makeElementItem(element, false);
                });
            },
            makeSubobjectItem(panel, initSelect) {
                let id = this.openmct.objects.makeKeyString(panel.domainObject.identifier);
                let config = new SubobjectViewConfiguration({
                    domainObject: this.newDomainObject,
                    panel: panel,
                    id: id,
                    openmct: openmct,
                    gridSize: this.gridSize
                });
                this.layoutItems.push({
                    id: id,
                    domainObject: panel.domainObject,
                    drilledIn: this.isItemDrilledIn(id),
                    initSelect: initSelect,
                    type: 'subobject-view',
                    config: config
                });
            },
            makeTelemetryItem(alphanumeric, initSelect) {
                let id = this.openmct.objects.makeKeyString(alphanumeric.identifier);
                this.openmct.objects.get(id).then(domainObject => {
                    let config = new TelemetryViewConfiguration({
                        domainObject: this.newDomainObject,
                        alphanumeric: alphanumeric,
                        openmct: openmct,
                        gridSize: this.gridSize
                    });
                    this.layoutItems.push({
                        id: id,
                        domainObject: domainObject,
                        initSelect: initSelect,
                        type: 'telemetry-view',
                        config: config
                    });
                });
            },
            makeElementItem(element, initSelect) {
                let config = new ElementViewConfiguration({
                    domainObject: this.newDomainObject,
                    element: element,
                    openmct: openmct,
                    gridSize: this.gridSize
                });
                this.layoutItems.push({
                    initSelect: initSelect,
                    type: element.type + '-view',
                    config: config
                });
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
                item.config.newPosition = newPosition;
                item.config.updateStyle(newPosition);
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
                // TODO: emit "finishResizing" for view components to mutate position?
                item.config.mutatePosition();
            },
            mutate(path, value) {
                this.openmct.objects.mutate(this.newDomainObject, path, value);
            },
            handleDrop($event) {
                $event.preventDefault();

                let domainObject = JSON.parse($event.dataTransfer.getData('domainObject'));
                let elementRect = this.$el.getBoundingClientRect();
                this.droppedObjectPosition = [
                    Math.floor(($event.pageX - elementRect.left) / this.gridSize[0]),
                    Math.floor(($event.pageY - elementRect.top) / this.gridSize[1])
                ];

                if (this.isTelemetry(domainObject)) {
                    this.addAlphanumeric(domainObject, this.droppedObjectPosition);
                } else {
                    this.checkForDuplicatePanel(domainObject);
                }
            },
            checkForDuplicatePanel(domainObject) {
                let id = this.openmct.objects.makeKeyString(domainObject.identifier);
                let panels = this.newDomainObject.configuration.panels;

                if (panels && panels[id]) {
                    let prompt = this.openmct.overlays.dialog({
                        iconClass: 'alert',
                        message: "This item is already in layout and will not be added again.",
                        buttons: [
                            {
                                label: 'OK',
                                callback: function () {
                                    prompt.dismiss();
                                }
                            }
                        ]
                    });
                }
            },
            addAlphanumeric(domainObject, position) {
                let alphanumerics = this.newDomainObject.configuration.alphanumerics || [];
                let alphanumeric = TelemetryViewConfiguration.create(domainObject, position, this.openmct);
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
            },
            addSubobject(domainObject) {
                if (!this.isTelemetry(domainObject)) {
                    let panels = this.newDomainObject.configuration.panels,
                        id = this.openmct.objects.makeKeyString(domainObject.identifier),
                        panel = panels[id],
                        mutateObject = false,
                        initSelect = false;

                    // If the panel doesn't exist, create one and mutate the configuration
                    if (!panel) {
                        panel = SubobjectViewConfiguration.create(domainObject, this.gridSize, this.droppedObjectPosition);
                        initSelect = true;
                        this.mutate("configuration.panels[" + id + "]", panel);
                        delete this.droppedObjectPosition;
                    }

                    panel.domainObject = domainObject;
                    this.makeSubobjectItem(panel, initSelect);
                }
            },
            removeSubobject() {
                // Not yet implemented
            },
            addElement(type) {
                let elements = this.newDomainObject.configuration.elements || [];
                Promise.resolve(ElementViewConfiguration.create(type, this.openmct))
                    .then(element => {
                        element.index = elements.push(element) - 1;
                        this.mutate("configuration.elements", elements);
                        this.makeElementItem(element, true);
                    });
            }
        },
        mounted() {
            this.newDomainObject = this.domainObject;
            this.gridSize = this.newDomainObject.layoutGrid ||  DEFAULT_GRID_SIZE;

            this.unlisten = this.openmct.objects.observe(this.newDomainObject, '*', function (obj) {
                this.newDomainObject = JSON.parse(JSON.stringify(obj));
                this.gridSize = this.newDomainObject.layoutGrid || DEFAULT_GRID_SIZE;;
            }.bind(this));

            this.openmct.selection.on('change', this.setSelection);

            this.composition = this.openmct.composition.get(this.newDomainObject);
            this.composition.on('add', this.addSubobject);
            this.composition.on('remove', this.removeSubobject);
            this.composition.load();
            this.getAlphanumerics();
            this.getElements();
        },
        destroyed: function () {
            this.openmct.off('change', this.setSelection);
            this.composition.off('add', this.addSubobject);
            this.composition.off('remove', this.removeSubobject);
            this.unlisten();
        }
    }
    
</script>
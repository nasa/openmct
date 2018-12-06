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
            getConfigurationItems() {
                this.subobjectViewsById = new Map();
                this.telemetryViewsById = new Map();
                let items = this.newDomainObject.configuration.items;
                items.forEach((item, index) => {
                    if (item.type === 'subobject') {
                        this.subobjectViewsById.set(this.openmct.objects.makeKeyString(item.identifier), true); 
                    } else if (item.type === 'telemetry') {
                        this.telemetryViewsById.set(this.openmct.objects.makeKeyString(item.identifier), true);
                    }

                    item.index = index;
                    this.makeLayoutItem(item, false);
                });
            },
            makeLayoutItem(item, initSelect) {
                if (item.type === 'telemetry') {
                    this.makeTelemetryItem(item, initSelect);
                } else if (item.type === 'subobject') {
                    this.makeSubobjectItem(item, initSelect);
                } else {
                    this.makeElementItem(item, initSelect);
                }
            },
            makeTelemetryItem(item, initSelect) {
                let id = this.openmct.objects.makeKeyString(item.identifier);
                this.openmct.objects.get(id).then(domainObject => {
                    let config = new TelemetryViewConfiguration({
                        domainObject: this.newDomainObject,
                        alphanumeric: item,
                        openmct: openmct,
                        gridSize: this.gridSize
                    });
                    this.layoutItems.push({
                        id: id,
                        domainObject: domainObject,
                        initSelect: initSelect,
                        type: item.type + '-view',
                        config: config
                    });
                });
            },
            makeSubobjectItem(item, initSelect) {
                let id = this.openmct.objects.makeKeyString(item.identifier);
                this.openmct.objects.get(id).then(domainObject => {
                    let config = new SubobjectViewConfiguration({
                        domainObject: this.newDomainObject,
                        panel: item,
                        openmct: openmct,
                        gridSize: this.gridSize
                    });
                    this.layoutItems.push({
                        id: id,
                        domainObject: domainObject,
                        initSelect: initSelect,
                        type: item.type + '-view',
                        config: config,
                        drilledIn: this.isItemDrilledIn(id)
                    });
                });
            },
            makeElementItem(item, initSelect) {
                let config = new ElementViewConfiguration({
                    domainObject: this.newDomainObject,
                    element: item,
                    openmct: openmct,
                    gridSize: this.gridSize
                });
                this.layoutItems.push({
                    initSelect: initSelect,
                    type: item.type + '-view',
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
                    this.addTelemetryObject(domainObject, this.droppedObjectPosition);
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
            addItem(item) {
                let items = this.newDomainObject.configuration.items || [];
                item.index = items.push(item) - 1;
                this.mutate("configuration.items", items);
                this.makeLayoutItem(item, true);
            },
            addTelemetryObject(domainObject, position) {
                let item = TelemetryViewConfiguration.create(domainObject, position, this.openmct);
                this.addItem(item);
                this.telemetryViewsById.set(this.openmct.objects.makeKeyString(domainObject.identifier), true);
            },
            addElement(type) {
                Promise.resolve(ElementViewConfiguration.create(type, this.openmct))
                    .then(item => {
                        this.addItem(item);
                    });
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
                let id = this.openmct.objects.makeKeyString(domainObject.identifier);

                if (this.isTelemetry(domainObject)) {
                    if (!this.telemetryViewsById.has(id)) {
                        this.addTelemetryObject(domainObject);
                    }
                } else {
                    if (!this.subobjectViewsById.has(id)) {
                        let item = SubobjectViewConfiguration.create(domainObject, this.gridSize, this.droppedObjectPosition);
                        this.subobjectViewsById.set(id, true);
                        this.addItem(item, true);
                        delete this.droppedObjectPosition;
                    }
                }
            },
            removeSubobject() {
                // Not yet implemented
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
            this.getConfigurationItems();

            this.composition = this.openmct.composition.get(this.newDomainObject);
            this.composition.on('add', this.addSubobject);
            this.composition.on('remove', this.removeSubobject);
            this.composition.load();
        },
        destroyed: function () {
            this.openmct.off('change', this.setSelection);
            this.composition.off('add', this.addSubobject);
            this.composition.off('remove', this.removeSubobject);
            this.unlisten();

            delete this.subobjectViewsById;
            delete this.telemetryViewsById;
        }
    }
    
</script>
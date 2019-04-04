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
         @click.capture="bypassSelection"
         @drop="handleDrop"
         :class="{
            'is-multi-selected': selectedLayoutItems.length > 1
            }">
        <!-- Background grid -->
        <div class="l-layout__grid-holder c-grid">
            <div class="c-grid__x l-grid l-grid-x"
                 v-if="gridSize[0] >= 3"
                 :style="[{ backgroundSize: gridSize[0] + 'px 100%' }]">
            </div>
            <div class="c-grid__y l-grid l-grid-y"
                 v-if="gridSize[1] >= 3"
                 :style="[{ backgroundSize: '100%' + gridSize[1] + 'px' }]"></div>
        </div>
        <component v-for="(item, index) in layoutItems"
                   :is="item.type"
                   :item="item"
                   :key="item.id"
                   :gridSize="gridSize"
                   :initSelect="initSelectIndex === index"
                   :index="index"
                   :multiSelect="selectedLayoutItems.length > 1"
                   @move="move"
                   @endMove="endMove"
                   @endLineResize='endLineResize'>
        </component>
        <edit-marquee v-if='showMarquee'
                      :gridSize="gridSize"
                      :selectedLayoutItems="selectedLayoutItems"
                      @endResize="endResize">
        </edit-marquee>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .l-layout {
        @include abs();
        display: flex;
        flex-direction: column;
        overflow: auto;

        &__grid-holder {
            display: none;
        }

        &__frame {
            position: absolute;
        }
    }

    .is-editing {
        .l-shell__main-container {
            &[s-selected],
            &[s-selected-parent] {
                // Display grid and allow edit marquee to display in main layout holder when editing
                > .l-layout {
                    background: $editUIGridColorBg;

                    > .c-frame-edit { display: block; } // All other frames
                    > .c-frame > .c-frame-edit { display: block; } // Line object frame

                    > [class*="__grid-holder"] {
                        display: block;
                    }
                }
            }
        }

        .l-layout__frame {
            &[s-selected-parent] {
                // Display grid and allow edit marquee to display in nested layouts when editing
                > * > * > .l-layout {
                    background: $editUIGridColorBg;
                    box-shadow: inset $editUIGridColorFg 0 0 2px 1px;

                    > .c-frame-edit { display: block; } // All other frames
                    > .c-frame > .c-frame-edit { display: block; } // Line object frame

                    > [class*='grid-holder'] {
                        display: block;
                    }
                }
            }
        }
    }
</style>


<script>
    import uuid from 'uuid';

    import SubobjectView from './SubobjectView.vue'
    import TelemetryView from './TelemetryView.vue'
    import BoxView from './BoxView.vue'
    import TextView from './TextView.vue'
    import LineView from './LineView.vue'
    import ImageView from './ImageView.vue'
    import EditMarquee from './EditMarquee.vue'

    const ITEM_TYPE_VIEW_MAP = {
        'subobject-view': SubobjectView,
        'telemetry-view': TelemetryView,
        'box-view': BoxView,
        'line-view': LineView,
        'text-view': TextView,
        'image-view': ImageView
    };
    const ORDERS = {
        top: Number.POSITIVE_INFINITY,
        up: 1,
        down: -1,
        bottom: Number.NEGATIVE_INFINITY
    };
    const DRAG_OBJECT_TRANSFER_PREFIX = 'openmct/domain-object/';

    let components = ITEM_TYPE_VIEW_MAP;
    components['edit-marquee'] = EditMarquee;

    function getItemDefinition(itemType, ...options) {
        let itemView = ITEM_TYPE_VIEW_MAP[itemType];

        if (!itemView) {
            throw `Invalid itemType: ${itemType}`;
        }

        return itemView.makeDefinition(...options);
    }

    export default {
        data() {
            let domainObject = JSON.parse(JSON.stringify(this.domainObject));
            return {
                internalDomainObject: domainObject,
                initSelectIndex: undefined,
                selection: []
            };
        },
        computed: {
            gridSize() {
                return this.internalDomainObject.configuration.layoutGrid;
            },
            layoutItems() {
                return this.internalDomainObject.configuration.items;
            },
            selectedLayoutItems() {
                return this.layoutItems.filter(item => {
                    return this.itemIsInCurrentSelection(item);
                });
            },
            showMarquee() {
                let selectionPath = this.selection[0];
                let singleSelectedLine = this.selection.length === 1 &&
                    selectionPath[0].context.layoutItem && selectionPath[0].context.layoutItem.type === 'line-view';
                return selectionPath && selectionPath.length > 1 && !singleSelectedLine;
            }
        },
        inject: ['openmct', 'options'],
        props: ['domainObject'],
        components: components,
        methods: {
            addElement(itemType, element) {
                this.addItem(itemType + '-view', element);
            },
            setSelection(selection) {
                this.selection = selection;
            },
            itemIsInCurrentSelection(item) {
                return this.selection.some(selectionPath =>
                    selectionPath[0].context.layoutItem && selectionPath[0].context.layoutItem.id === item.id);
            },
            bypassSelection($event) {
                if (this.dragInProgress) {
                    if ($event) {
                        $event.stopImmediatePropagation();
                    }
                    this.dragInProgress = false;
                    return;
                }
            },
            endLineResize(item, updates) {
                this.dragInProgress = true;
                let index = this.layoutItems.indexOf(item);
                Object.assign(item, updates);
                this.mutate(`configuration.items[${index}]`, item);
            },
            endResize(scaleWidth, scaleHeight, marqueeStart, marqueeEnd, marqueeOffset) {
                this.dragInProgress = true;
                this.layoutItems.forEach(item => {
                    if (this.itemIsInCurrentSelection(item)) {
                        let itemXInMarqueeSpace = item.x - marqueeStart.x1;
                        let itemXInMarqueeSpaceAfterScale = Math.round(itemXInMarqueeSpace * scaleWidth);
                        item.x = itemXInMarqueeSpaceAfterScale + marqueeOffset.x1 + marqueeStart.x1;

                        let itemYInMarqueeSpace = item.y - marqueeStart.y1;
                        let itemYInMarqueeSpaceAfterScale = Math.round(itemYInMarqueeSpace * scaleHeight);
                        item.y = itemYInMarqueeSpaceAfterScale + marqueeOffset.y1 + marqueeStart.y1;

                        if (item.x2) {
                            let itemX2InMarqueeSpace = item.x2 - marqueeStart.x1;
                            let itemX2InMarqueeSpaceAfterScale = Math.round(itemX2InMarqueeSpace * scaleWidth);
                            item.x2 = itemX2InMarqueeSpaceAfterScale + marqueeOffset.x1 + marqueeStart.x1;
                        } else {
                            item.width = Math.round(item.width * scaleWidth);
                        }

                        if (item.y2) {
                            let itemY2InMarqueeSpace = item.y2 - marqueeStart.y1;
                            let itemY2InMarqueeSpaceAfterScale = Math.round(itemY2InMarqueeSpace * scaleHeight);
                            item.y2 = itemY2InMarqueeSpaceAfterScale + marqueeOffset.y1 + marqueeStart.y1;
                        } else {
                            item.height = Math.round(item.height * scaleHeight);
                        }
                    }
                });
                this.mutate("configuration.items", this.layoutItems);
            },
            move(gridDelta) {
                this.dragInProgress = true;

                if (!this.initialPositions) {
                    this.initialPositions = {};
                    _.cloneDeep(this.selectedLayoutItems).forEach(selectedItem => {
                        if (selectedItem.type === 'line-view') {
                            this.initialPositions[selectedItem.id] = [selectedItem.x, selectedItem.y, selectedItem.x2, selectedItem.y2];
                        } else {
                            this.initialPositions[selectedItem.id] = [selectedItem.x, selectedItem.y];
                        }
                    });
                }

                let layoutItems = this.layoutItems.map(item => {
                    if (this.initialPositions[item.id]) {
                        let startingPosition = this.initialPositions[item.id];
                        let [startingX, startingY, startingX2, startingY2] = startingPosition;
                        item.x = startingX + gridDelta[0];
                        item.y = startingY + gridDelta[1];

                        if (item.x2) {
                            item.x2 = startingX2 + gridDelta[0];
                        }

                        if (item.y2) {
                            item.y2 = startingY2 + gridDelta[1];
                        }
                    }
                    return item;
                });
            },
            endMove() {
                this.mutate('configuration.items', this.layoutItems);
                this.initialPositions = undefined;
            },
            mutate(path, value) {
                this.openmct.objects.mutate(this.internalDomainObject, path, value);
            },
            handleDrop($event) {
                if (!$event.dataTransfer.types.includes('openmct/domain-object-path')) {
                    return;
                }

                $event.preventDefault();

                let domainObject = JSON.parse($event.dataTransfer.getData('openmct/domain-object-path'))[0];
                let elementRect = this.$el.getBoundingClientRect();
                let droppedObjectPosition = [
                    Math.floor(($event.pageX - elementRect.left) / this.gridSize[0]),
                    Math.floor(($event.pageY - elementRect.top) / this.gridSize[1])
                ];

                if (this.isTelemetry(domainObject)) {
                    this.addItem('telemetry-view', domainObject, droppedObjectPosition);
                } else {
                    let identifier = this.openmct.objects.makeKeyString(domainObject.identifier);

                    if (!this.objectViewMap[identifier]) {
                        this.addItem('subobject-view', domainObject, droppedObjectPosition);
                    } else {
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
                }
            },
            containsObject(identifier) {
                return _.get(this.internalDomainObject, 'composition')
                    .some(childId => this.openmct.objects.areIdsEqual(childId, identifier));
            },
            handleDragOver($event) {
                // Get the ID of the dragged object
                let draggedKeyString = $event.dataTransfer.types
                    .filter(type => type.startsWith(DRAG_OBJECT_TRANSFER_PREFIX))
                    .map(type => type.substring(DRAG_OBJECT_TRANSFER_PREFIX.length))[0];
                
                // If the layout already contains the given object, then shortcut the default dragover behavior and 
                // potentially allow drop. Display layouts allow drag drop of duplicate telemetry objects.
                if (this.containsObject(draggedKeyString)){
                    $event.preventDefault();
                }
            },
            isTelemetry(domainObject) {
                if (this.openmct.telemetry.isTelemetryObject(domainObject) && 
                    !this.options.showAsView.includes(domainObject.type)) {
                    return true;
                } else {
                    return false;
                }
            },
            addItem(itemType, ...options) {
                let item = getItemDefinition(itemType, this.openmct, this.gridSize, ...options);
                item.type = itemType;
                item.id = uuid();
                this.trackItem(item);
                this.layoutItems.push(item);
                this.openmct.objects.mutate(this.internalDomainObject, "configuration.items", this.layoutItems);
                this.initSelectIndex = this.layoutItems.length - 1;
            },
            trackItem(item) {
                if (!item.identifier) {
                    return;
                }

                let keyString = this.openmct.objects.makeKeyString(item.identifier);

                if (item.type === "telemetry-view") {
                    let count = this.telemetryViewMap[keyString] || 0;
                    this.telemetryViewMap[keyString] = ++count;
                } else if (item.type === "subobject-view") {
                    this.objectViewMap[keyString] = true;
                }
            },
            removeItem(selectedItems) {
                let indices = [];
                this.initSelectIndex = -1;
                selectedItems.forEach(selectedItem => {
                    indices.push(selectedItem[0].context.index);
                    this.untrackItem(selectedItem[0].context.layoutItem);
                });
                _.pullAt(this.layoutItems, indices);
                this.mutate("configuration.items", this.layoutItems);
                this.$el.click();
            },
            untrackItem(item) {
                if (!item.identifier) {
                    return;
                }

                let keyString = this.openmct.objects.makeKeyString(item.identifier);

                if (item.type === 'telemetry-view') {
                    let count = --this.telemetryViewMap[keyString];

                    if (count === 0) {
                        delete this.telemetryViewMap[keyString];
                        this.removeFromComposition(keyString);
                    }
                } else if (item.type === 'subobject-view') {
                    delete this.objectViewMap[keyString];
                    this.removeFromComposition(keyString);
                }
            },
            removeFromComposition(keyString) {
                let composition = _.get(this.internalDomainObject, 'composition');
                composition = composition.filter(identifier => {
                    return this.openmct.objects.makeKeyString(identifier) !== keyString;
                });
                this.mutate("composition", composition);
            },
            initializeItems() {
                this.telemetryViewMap = {};
                this.objectViewMap = {};
                this.layoutItems.forEach(this.trackItem);
            },
            addChild(child) {
                let identifier = this.openmct.objects.makeKeyString(child.identifier);
                if (this.isTelemetry(child)) {
                    if (!this.telemetryViewMap[identifier]) {
                        this.addItem('telemetry-view', child);
                    }
                } else if (!this.objectViewMap[identifier]) {
                    this.addItem('subobject-view', child);
                }
            },
            removeChild(identifier) {
                let keyString = this.openmct.objects.makeKeyString(identifier);

                if (this.objectViewMap[keyString]) {
                    delete this.objectViewMap[keyString];
                    this.removeFromConfiguration(keyString);
                } else if (this.telemetryViewMap[keyString]) {
                    delete this.telemetryViewMap[keyString];
                    this.removeFromConfiguration(keyString);
                }
            },
            removeFromConfiguration(keyString) {
                let layoutItems = this.layoutItems.filter(item => {
                    if (!item.identifier) {
                        return true;
                    } else {
                        return this.openmct.objects.makeKeyString(item.identifier) !== keyString;
                    }
                });
                this.mutate("configuration.items", layoutItems);
                this.$el.click();
            },
            orderItem(position, selectedItems) {
                let delta = ORDERS[position];
                let indices = [];
                let newIndices = [];
                let newIndex = -1;
                let items = [];

                Object.assign(items, this.layoutItems);
                selectedItems.forEach(selectionPath => {
                    indices.push(selectionPath[0].context.index);
                });
                indices.sort((a, b) => a - b);

                if (position === 'top' || position === 'up') {
                     indices.reverse();
                }

                if (position === 'top' || position === 'bottom') {
                    newIndices = this.moveToTopOrBottom(position, indices, items, delta);
                } else {
                    newIndices = this.moveUpOrDown(position, indices, items, delta);
                }

                this.mutate('configuration.items', this.layoutItems);
            },
            moveUpOrDown(position, indices, items, delta) {
                let previousItemIndex = -1;
                let newIndex = -1;
                let newIndices = [];

                indices.forEach((itemIndex, index) => {
                    let isAdjacentItemSelected = position === 'up' ?
                        itemIndex + 1 === previousItemIndex :
                        itemIndex - 1 === previousItemIndex;

                    if (index > 0 && isAdjacentItemSelected) {
                        if (position === 'up') {
                            newIndex -= 1;
                        } else {
                            newIndex += 1;
                        }
                    } else {
                        newIndex = Math.max(Math.min(itemIndex + delta, this.layoutItems.length - 1), 0);
                    }

                    previousItemIndex = itemIndex;
                    newIndices.push(newIndex);
                    this.updateItemOrder(newIndex, itemIndex, items);
                });
                return newIndices;
            },
            moveToTopOrBottom(position, indices, items, delta) {
                let newIndices = [];
                let newIndex = -1;

                indices.forEach((itemIndex, index) => {
                    if (index === 0) {
                        newIndex = Math.max(Math.min(itemIndex + delta, this.layoutItems.length - 1), 0);
                    } else {
                        if (position === 'top') {
                            newIndex -= 1;
                        } else {
                            newIndex += 1;
                        }
                    }

                    newIndices.push(newIndex);
                    this.updateItemOrder(newIndex, itemIndex, items);
                });
                return newIndices;
            },
            updateItemOrder(newIndex, itemIndex, items) {
                if (newIndex !== itemIndex) {
                    this.layoutItems.splice(itemIndex, 1);
                    this.layoutItems.splice(newIndex, 0, items[itemIndex]);
                }
            }
        },
        mounted() {
            this.unlisten = this.openmct.objects.observe(this.internalDomainObject, '*', function (obj) {
                this.internalDomainObject = JSON.parse(JSON.stringify(obj));
            }.bind(this));
            this.openmct.selection.on('change', this.setSelection);
            this.initializeItems();
            this.composition = this.openmct.composition.get(this.internalDomainObject);
            this.composition.on('add', this.addChild);
            this.composition.on('remove', this.removeChild);
            this.composition.load();
        },
        destroyed: function () {
            this.openmct.selection.off('change', this.setSelection);
            this.composition.off('add', this.addChild);
            this.composition.off('remove', this.removeChild);
            this.unlisten();
        }
    }
</script>

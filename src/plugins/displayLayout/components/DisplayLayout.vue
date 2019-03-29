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
                   :gridSize="item.useGrid ? gridSize : [1, 1]"
                   :initSelect="initSelectIndex === index"
                   :index="index"
                   @endDrag="endDrag"
        >
        </component>
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
                // Display grid in main layout holder when editing
                > .l-layout {
                    background: $editUIGridColorBg;

                    > [class*="__grid-holder"] {
                        display: block;
                    }
                }
            }
        }

        .l-layout__frame {
            &[s-selected],
            &[s-selected-parent] {
                // Display grid in nested layouts when editing
                > * > * > .l-layout {
                    background: $editUIGridColorBg;
                    box-shadow: inset $editUIGridColorFg 0 0 2px 1px;

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
                initSelectIndex: undefined
            };
        },
        computed: {
            gridSize() {
                return this.internalDomainObject.configuration.layoutGrid;
            },
            layoutItems() {
                return this.internalDomainObject.configuration.items;
            }
        },
        inject: ['openmct', 'options'],
        props: ['domainObject'],
        components: ITEM_TYPE_VIEW_MAP,
        methods: {
            addElement(itemType, element) {
                this.addItem(itemType + '-view', element);
            },
            setSelection(selection) {
                if (selection.length === 0) {
                    return;
                }

                if (this.removeSelectionListener) {
                    this.removeSelectionListener();
                }

                let itemIndex = selection[0].context.index;

                if (itemIndex !== undefined) {
                    this.attachSelectionListener(itemIndex);
                }
            },
            attachSelectionListener(index) {
                let path = `configuration.items[${index}].useGrid`;
                this.removeSelectionListener = this.openmct.objects.observe(this.internalDomainObject, path, function (value) {
                    let item = this.layoutItems[index];

                    if (value) {
                        item.x = Math.round(item.x / this.gridSize[0]);
                        item.y = Math.round(item.y / this.gridSize[1]);
                        item.width = Math.round(item.width / this.gridSize[0]);
                        item.height = Math.round(item.height / this.gridSize[1]);

                        if (item.x2) {
                            item.x2 = Math.round(item.x2 / this.gridSize[0]);
                        }
                        if (item.y2) {
                            item.y2 = Math.round(item.y2 / this.gridSize[1]);
                        }
                    } else {
                        item.x = this.gridSize[0] * item.x;
                        item.y = this.gridSize[1] * item.y;
                        item.width = this.gridSize[0] * item.width;
                        item.height = this.gridSize[1] * item.height;

                        if (item.x2) {
                            item.x2 = this.gridSize[0] * item.x2;
                        }
                        if (item.y2) {
                            item.y2 = this.gridSize[1] * item.y2;
                        }
                    }
                    item.useGrid = value;
                    this.mutate(`configuration.items[${index}]`, item);
                }.bind(this));
            },
            bypassSelection($event) {
                if (this.dragInProgress) {
                    if ($event) {
                        $event.stopImmediatePropagation();
                    }
                    return;
                }
            },
            endDrag(item, updates) {
                this.dragInProgress = true;
                setTimeout(function () {
                    this.dragInProgress = false;
                }.bind(this), 0);

                let index = this.layoutItems.indexOf(item);
                Object.assign(item, updates);
                this.mutate(`configuration.items[${index}]`, item);
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
            removeItem(item, index) {
                this.initSelectIndex = -1;
                this.layoutItems.splice(index, 1);
                this.mutate("configuration.items", this.layoutItems);
                this.untrackItem(item);
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
            orderItem(position, index) {
                let delta = ORDERS[position];
                let newIndex = Math.max(Math.min(index + delta, this.layoutItems.length - 1), 0);
                let item = this.layoutItems[index];

                if (newIndex !== index) {
                    this.layoutItems.splice(index, 1);
                    this.layoutItems.splice(newIndex, 0, item);
                    this.mutate('configuration.items', this.layoutItems);

                    if (this.removeSelectionListener) {
                        this.removeSelectionListener();
                        this.attachSelectionListener(newIndex);
                    }
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
            this.openmct.off('change', this.setSelection);
            this.composition.off('add', this.addChild);
            this.composition.off('remove', this.removeChild);
            this.unlisten();

            if (this.removeSelectionListener) {
                this.removeSelectionListener();
            }
        }
    }
</script>

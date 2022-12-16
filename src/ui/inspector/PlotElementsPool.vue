/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
<div class="c-elements-pool">
    <Search
        class="c-elements-pool__search"
        :value="currentSearch"
        @input="applySearch"
        @clear="applySearch"
    />
    <div
        class="c-elements-pool__elements"
    >
        <ul
            v-if="hasElements"
            id="inspector-elements-tree"
            class="c-tree c-elements-pool__tree"
        >
            <element-item-group
                v-for="(yAxis, index) in yAxes"
                :key="index"
                :parent-object="parentObject"
                :allow-drop="allowDrop"
                :label="`Y Axis ${yAxis.id}`"
                @drop-group="moveTo($event, 0, yAxis.id)"
            >
                <li
                    class="js-first-place"
                    @drop="moveTo($event, 0, yAxis.id)"
                ></li>
                <element-item
                    v-for="(element, elemIndex) in yAxis.elements"
                    :key="element.identifier.key"
                    :index="elemIndex"
                    :element-object="element"
                    :parent-object="parentObject"
                    :allow-drop="allowDrop"
                    @dragstart-custom="moveFrom($event, yAxis.id)"
                    @drop-custom="moveTo($event, index, yAxis.id)"
                />
                <li
                    v-if="yAxis.elements.length > 0"
                    class="js-last-place"
                    @drop="moveTo($event, yAxis.elements.length, yAxis.id)"
                ></li>
            </element-item-group>
        </ul>
        <div
            v-if="!hasElements"
        >
            No contained elements
        </div>
    </div>
</div>
</template>

<script>
import _ from 'lodash';
import Search from '../components/search.vue';
import ElementItem from './ElementItem.vue';
import ElementItemGroup from './ElementItemGroup.vue';
import configStore from '../../plugins/plot/configuration/ConfigStore';

const Y_AXIS_1 = 1;
const Y_AXIS_2 = 2;
const Y_AXIS_3 = 3;

export default {
    components: {
        Search,
        ElementItemGroup,
        ElementItem
    },
    inject: ['openmct'],
    data() {
        return {
            yAxes: [],
            yAxis1: [],
            yAxis2: [],
            yAxis3: [],
            isEditing: this.openmct.editor.isEditing(),
            parentObject: undefined,
            currentSearch: '',
            selection: [],
            contextClickTracker: {},
            allowDrop: false
        };
    },
    computed: {
        hasElements() {
            for (let yAxis of this.yAxes) {
                if (yAxis.elements.length > 0) {
                    return true;
                }
            }

            return false;
        }
    },
    created() {
        this.Y_AXIS_1 = Y_AXIS_1;
        this.Y_AXIS_2 = Y_AXIS_2;
        this.Y_AXIS_3 = Y_AXIS_3;
    },
    mounted() {
        const selection = this.openmct.selection.get();
        if (selection && selection.length > 0) {
            this.showSelection(selection);
        }

        this.openmct.selection.on('change', this.showSelection);
        this.openmct.editor.on('isEditing', this.setEditState);
    },
    destroyed() {
        this.openmct.editor.off('isEditing', this.setEditState);
        this.openmct.selection.off('change', this.showSelection);

        this.unlistenComposition();
    },
    methods: {
        setEditState(isEditing) {
            this.isEditing = isEditing;
            this.showSelection(this.openmct.selection.get());
        },
        showSelection(selection) {
            if (_.isEqual(this.selection, selection)) {
                return;
            }

            this.selection = selection;
            this.elementsCache = {};
            this.listeners = [];
            this.parentObject = selection && selection[0] && selection[0][0].context.item;
            this.setYAxisIds();

            this.unlistenComposition();

            if (this.parentObject) {
                this.composition = this.openmct.composition.get(this.parentObject);

                if (this.composition) {
                    this.composition.load();
                    this.registerCompositionListeners();
                }
            }
        },
        unlistenComposition() {
            if (this.compositionUnlistener) {
                this.compositionUnlistener();
            }
        },
        registerCompositionListeners() {
            this.composition.on('add', this.addElement);
            this.composition.on('remove', this.removeElement);
            this.composition.on('reorder', this.reorderElements);

            this.compositionUnlistener = () => {
                this.composition.off('add', this.addElement);
                this.composition.off('remove', this.removeElement);
                this.composition.off('reorder', this.reorderElements);
                delete this.compositionUnlistener;
            };
        },
        setYAxisIds() {
            const configId = this.openmct.objects.makeKeyString(this.parentObject.identifier);
            this.config = configStore.get(configId);
            this.yAxes.push({
                id: this.config.yAxis.id,
                elements: this.parentObject.configuration.series.filter(
                    series => series.yAxisId === this.config.yAxis.id
                )
            });
            if (this.config.additionalYAxes) {
                this.config.additionalYAxes.forEach(yAxis => {
                    this.yAxes.push({
                        id: yAxis.id,
                        elements: this.parentObject.configuration.series.filter(
                            series => series.yAxisId === yAxis.id
                        )
                    });
                });
            }
        },
        addElement(element) {
            // Get the index of the corresponding element in the series list
            const index = this.parentObject.configuration.series.findIndex(
                series => series.identifier.key === element.identifier.key
            );
            let yAxisId = this.parentObject.configuration.series[index].yAxisId;
            if (yAxisId === undefined) {
                yAxisId = Y_AXIS_1;
                this.composition.reorder(index, this.yAxis1.length);
            }

            const keyString = this.openmct.objects.makeKeyString(element.identifier);

            // Store the element in the cache and set its yAxisId
            this.elementsCache[keyString] =
            JSON.parse(JSON.stringify(element));
            if (this.elementsCache[keyString].yAxisId !== yAxisId) {
                this.elementsCache[keyString].yAxisId = yAxisId;
                // Mutate the YAxisId on the domainObject itself
                this.mutateYAxisId(element, yAxisId);
            }

            this.applySearch(this.currentSearch);
        },
        reorderElements() {
            this.applySearch(this.currentSearch);
        },
        removeElement(identifier) {
            const keyString = this.openmct.objects.makeKeyString(identifier);
            delete this.elementsCache[keyString];
            this.applySearch(this.currentSearch);
        },
        applySearch(input) {
            this.currentSearch = input;
            this.yAxes.forEach(yAxis => {
                yAxis.elements = this.filterForSearchAndAxis(input, yAxis.id);
            });
        },
        filterForSearchAndAxis(input, yAxisId) {
            return this.parentObject.composition.map((id) =>
                this.elementsCache[this.openmct.objects.makeKeyString(id)]
            ).filter((element) => {
                return element !== undefined
                    && element.name.toLowerCase().search(input) !== -1
                    && element.yAxisId === yAxisId;
            });
        },
        moveFrom(elementIndex, groupIndex) {
            this.allowDrop = true;
            this.moveFromIndex = elementIndex;
            this.moveFromYAxisId = groupIndex;
        },
        moveTo(event, moveToIndex, moveToYAxisId) {
            // FIXME: If the user starts the drag by clicking outside of the <object-label/> element,
            // domain object information will not be set on the dataTransfer data. To prevent errors,
            // we simply short-circuit here if the data is not set.
            const serializedDomainObject = event.dataTransfer.getData('openmct/composable-domain-object');
            if (!serializedDomainObject) {
                return;
            }

            const domainObject = JSON.parse(serializedDomainObject);
            this.mutateYAxisId(domainObject, moveToYAxisId);

            const moveFromIndex = this.moveFromIndex;
            this.moveToIndex = moveToIndex;

            this.moveAndReorderElement(moveFromIndex, moveToIndex, moveToYAxisId);
        },
        mutateYAxisId(domainObject, yAxisId) {
            const index = this.parentObject.configuration.series.findIndex(
                series => series.identifier.key === domainObject.identifier.key
            );
            const keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
            this.elementsCache[keyString].yAxisId = yAxisId;
            this.openmct.objects.mutate(
                this.parentObject,
                `configuration.series[${index}].yAxisId`,
                yAxisId
            );
        },
        moveAndReorderElement(moveFromIndex, moveToIndex, moveToYAxisId) {
            if (!this.allowDrop) {
                return;
            }

            // Calculate the index of the element in the composition array
            // based on the moveFrom / moveTo indexes and the YAxisId
            if (this.moveFromYAxisId === Y_AXIS_2) {
                moveFromIndex = moveFromIndex + this.yAxis1.length;
            } else if (this.moveFromYAxisId === Y_AXIS_3) {
                moveFromIndex = moveFromIndex + this.yAxis1.length + this.yAxis2.length;
            }

            if (moveToYAxisId === Y_AXIS_2) {
                moveToIndex = moveToIndex + this.yAxis1.length;
            } else if (moveToYAxisId === Y_AXIS_3) {
                moveToIndex = moveToIndex + this.yAxis1.length + this.yAxis2.length;
            }

            // Adjust the index if we're moving from one bucket to another
            if (this.moveFromYAxisId !== moveToYAxisId && moveToIndex > 0) {
                moveToIndex--;
            }

            // Reorder the composition array according to the calculated indexes
            this.composition.reorder(moveFromIndex, moveToIndex);

            this.allowDrop = false;
        }
    }
};
</script>

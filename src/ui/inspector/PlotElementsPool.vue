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
            v-if="axis1.length > 0
                || axis2.length > 0
                || axis3.length > 0"
            id="inspector-elements-tree"
            class="c-tree c-elements-pool__tree"
        >
            <element-item-group
                :parent-object="parentObject"
                :allow-drop="allowDrop"
                label="Y Axis 1"
                @drop-group="drop($event, 0)"
            >
                <element-item
                    v-for="(element, elementIndex) in axis1"
                    :key="element.identifier.key"
                    :index="elementIndex"
                    :element-object="element"
                    :parent-object="parentObject"
                    :allow-drop="allowDrop"
                    @dragstart-custom="moveFrom($event, 0)"
                    @drop-custom="moveTo(elementIndex)"
                />
            </element-item-group>
            <element-item-group
                :parent-object="parentObject"
                :allow-drop="allowDrop"
                label="Y Axis 2"
                @drop-group="drop($event, 1)"
            >
                <element-item
                    v-for="(element, elementIndex) in axis2"
                    :key="element.identifier.key"
                    :index="elementIndex"
                    :element-object="element"
                    :parent-object="parentObject"
                    :allow-drop="allowDrop"
                    @dragstart-custom="moveFrom($event, 1)"
                    @drop-custom="moveTo(elementIndex)"
                />
            </element-item-group>
            <element-item-group
                :parent-object="parentObject"
                :allow-drop="allowDrop"
                label="Y Axis 3"
                @drop-group="drop($event, 2)"
            >
                <element-item
                    v-for="(element, elementIndex) in axis3"
                    :key="element.identifier.key"
                    :index="elementIndex"
                    :element-object="element"
                    :parent-object="parentObject"
                    :allow-drop="allowDrop"
                    @dragstart-custom="moveFrom($event, 2)"
                    @drop-custom="moveTo(elementIndex)"
                />
            </element-item-group>
            <li
                class="js-last-place"
                @drop="moveToIndex(axis1.length)"
            ></li>
        </ul>
        <div
            v-if="axis1.length === 0
                && axis2.length === 0
                && axis3.length === 0"
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
import configStore from "../../plugins/plot/configuration/ConfigStore";

export default {
    components: {
        Search,
        ElementItemGroup,
        ElementItem
    },
    inject: ['openmct'],
    data() {
        return {
            axis1: [],
            axis2: [],
            axis3: [],
            isEditing: this.openmct.editor.isEditing(),
            parentObject: undefined,
            currentSearch: '',
            selection: [],
            contextClickTracker: {},
            allowDrop: false
        };
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

        if (this.compositionUnlistener) {
            this.compositionUnlistener();
        }
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
            this.elements = [];
            this.elementsCache = {};
            this.yAxisSeriesCache = {};
            this.listeners = [];
            this.parentObject = selection && selection[0] && selection[0][0].context.item;

            if (this.compositionUnlistener) {
                this.compositionUnlistener();
            }

            if (this.parentObject) {
                this.composition = this.openmct.composition.get(this.parentObject);
                const configId = this.openmct.objects.makeKeyString(this.parentObject.identifier);
                let config = configStore.get(configId);
                console.log('config', config);

                if (this.composition) {
                    this.composition.load();

                    this.composition.on('add', this.addElement);
                    this.composition.on('remove', this.removeElement);
                    this.composition.on('reorder', this.reorderElements);

                    this.compositionUnlistener = () => {
                        this.composition.off('add', this.addElement);
                        this.composition.off('remove', this.removeElement);
                        this.composition.off('reorder', this.reorderElements);
                        delete this.compositionUnlistener;
                    };
                }
            }
        },
        addElement(element) {
            const keyString = this.openmct.objects.makeKeyString(element.identifier);
            this.elementsCache[keyString] =
                JSON.parse(JSON.stringify(element));
            this.applySearch(this.currentSearch);
        },
        reorderElements() {
            // this.applySearch(this.currentSearch);
        },
        removeElement(identifier) {
            const keyString = this.openmct.objects.makeKeyString(identifier);
            delete this.elementsCache[keyString];
            this.applySearch(this.currentSearch);
        },
        applySearch(input) {
            this.currentSearch = input;
            this.axis1 = this.parentObject.composition.map((id) =>
                this.elementsCache[this.openmct.objects.makeKeyString(id)]
            ).filter((element) => {
                return element !== undefined
                    && element.name.toLowerCase().search(this.currentSearch) !== -1;
            });
        },
        moveFrom(options, groupIndex) {
            this.allowDrop = true;
            console.log('moveFrom ', options.index);
            this.moveFromIndex = options.index;
            this.moveFromGroup = groupIndex;
            console.log(options.event.dataTransfer.getData("text"));
        },
        moveTo(index) {
            if (this.allowDrop) {
                console.log('moveTo ', index);
                this.composition.reorder(this.moveFromIndex, index);
                this.allowDrop = false;
            }
        },
        drop(event, axisNumber) {
            const domainObject = JSON.parse(event.dataTransfer.getData('openmct/composable-domain-object'));
            switch (this.moveFromGroup) {
            case 0:
                this.axis1.splice(this.moveFromIndex, 1);
                break;
            case 1:
                this.axis2.splice(this.moveFromIndex, 1);
                break;
            case 2:
                this.axis3.splice(this.moveFromIndex, 1);
                break;
            }

            switch (axisNumber) {
            case 0:
                this.axis1.splice(0, 0, domainObject);
                break;
            case 1:
                this.axis2.splice(0, 0, domainObject);
                break;
            case 2:
                this.axis3.splice(0, 0, domainObject);
                break;
            }

            console.log('this.axis1', this.axis1);
            console.log('this.axis2', this.axis2);
            console.log('this.axis3', this.axis3);
        }
    }
};
</script>

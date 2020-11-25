/*****************************************************************************
* Open MCT, Copyright (c) 2014-2020, United States Government
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
<div class="u-contents">
    <div class="c-overlay__top-bar">
        <div class="c-overlay__dialog-title">Select Condition Set</div>
    </div>
    <div class="c-overlay__contents-main c-selector c-tree-and-search">
        <div class="c-tree-and-search__search">
            <search ref="shell-search"
                    class="c-search"
                    :value="searchValue"
                    @input="searchTree"
                    @clear="searchTree"
            />
        </div>

        <!-- loading -->
        <div v-if="isLoading"
             class="c-tree-and-search__loading loading"
        ></div>
        <!-- end loading -->

        <div v-if="(allTreeItems.length === 0) || (searchValue && filteredTreeItems.length === 0)"
             class="c-tree-and-search__no-results"
        >
            No results found
        </div>

        <!-- main tree -->
        <ul v-if="!isLoading"
            v-show="!searchValue"
            class="c-tree-and-search__tree c-tree"
        >
            <condition-set-dialog-tree-item
                v-for="treeItem in allTreeItems"
                :key="treeItem.id"
                :node="treeItem"
                :selected-item="selectedItem"
                :handle-item-selected="handleItemSelection"
            />
        </ul>
        <!-- end main tree -->

        <!-- search tree -->
        <ul v-if="searchValue"
            class="c-tree-and-search__tree c-tree"
        >
            <condition-set-dialog-tree-item
                v-for="treeItem in filteredTreeItems"
                :key="treeItem.id"
                :node="treeItem"
                :selected-item="selectedItem"
                :handle-item-selected="handleItemSelection"
            />
        </ul>
        <!-- end search tree -->
    </div>
</div>
</template>

<script>
import search from '@/ui/components/search.vue';
import ConditionSetDialogTreeItem from './ConditionSetDialogTreeItem.vue';

export default {
    inject: ['openmct'],
    name: 'ConditionSetSelectorDialog',
    components: {
        search,
        ConditionSetDialogTreeItem
    },
    data() {
        return {
            expanded: false,
            searchValue: '',
            allTreeItems: [],
            filteredTreeItems: [],
            isLoading: false,
            selectedItem: undefined
        };
    },
    mounted() {
        this.searchService = this.openmct.$injector.get('searchService');
        this.getAllChildren();
    },
    methods: {
        getAllChildren() {
            this.isLoading = true;
            this.openmct.objects.get('ROOT')
                .then(root => {
                    return this.openmct.composition.get(root).load();
                })
                .then(children => {
                    this.isLoading = false;
                    this.allTreeItems = children.map(c => {
                        return {
                            id: this.openmct.objects.makeKeyString(c.identifier),
                            object: c,
                            objectPath: [c],
                            navigateToParent: '/browse'
                        };
                    });
                });
        },
        getFilteredChildren() {
            this.searchService.query(this.searchValue).then(children => {
                this.filteredTreeItems = children.hits.map(child => {

                    let context = child.object.getCapability('context');
                    let object = child.object.useCapability('adapter');
                    let objectPath = [];
                    let navigateToParent;

                    if (context) {
                        objectPath = context.getPath().slice(1)
                            .map(oldObject => oldObject.useCapability('adapter'))
                            .reverse();
                        navigateToParent = '/browse/' + objectPath.slice(1)
                            .map((parent) => this.openmct.objects.makeKeyString(parent.identifier))
                            .join('/');
                    }

                    return {
                        id: this.openmct.objects.makeKeyString(object.identifier),
                        object,
                        objectPath,
                        navigateToParent
                    };
                });
            });
        },
        searchTree(value) {
            this.searchValue = value;

            if (this.searchValue !== '') {
                this.getFilteredChildren();
            }
        },
        handleItemSelection(item, node) {
            if (item && item.type === 'conditionSet') {
                const parentId = (node.objectPath && node.objectPath.length > 1) ? node.objectPath[1].identifier : undefined;
                this.selectedItem = {
                    itemId: item.identifier,
                    parentId
                };
                this.$emit('conditionSetSelected', item);
            }
        }
    }
};
</script>

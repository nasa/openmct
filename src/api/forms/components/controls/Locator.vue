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
<div>
    <span
        v-if="canAddFolder"
        :class="newFolderAction.cssClass"
        @click="addNewFolder"
    >Add New Folder</span>
    <mct-tree
        :is-selector-tree="true"
        :initial-selection="model.parent"
        @tree-item-selection="handleItemSelection"
    />
</div>
</template>

<script>
import MctTree from '@/ui/layout/mct-tree.vue';

export default {
    components: {
        MctTree
    },
    inject: ['openmct'],
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            selectedItem: {},
            canAddFolder: false,
            newFolderAction: this.openmct.actions.getAction('newFolder')
        };
    },
    methods: {
        addNewFolder() {
            this.newFolderAction.invoke(this.selectedItem.objectPath);
        },
        handleItemSelection(item) {
            this.selectedItem = item;
            this.canAddFolder = this.newFolderAction.appliesTo(this.selectedItem.objectPath);
            console.log('can add folder', this.canAddFolder);
            const data = {
                model: this.model,
                value: this.selectedItem.objectPath
            };

            this.$emit('onChange', data);
        }
    }
};
</script>

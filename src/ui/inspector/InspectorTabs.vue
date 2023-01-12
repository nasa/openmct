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
<div
    class="c-inspector__tabs c-tabs"
>
    <div
        v-for="tab in visibleTabs"
        :key="tab"
        class="c-inspector__tab c-tab"
        :class="{'is-current': isSelected(tab)}"
        @click="selectTab(tab)"
    >
        {{ tab }}
    </div>

</div>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        isEditing: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            tabs: [],
            selectedTab: undefined,
            selection: []
        };
    },
    computed: {
        visibleTabs() {
            return this.tabs
                .filter(tab => !tab.hideTab || tab.hideTab(this.isEditing))
                .map(tab => tab.name);
        }
    },
    mounted() {
        this.openmct.selection.on('change', this.updateSelection);
        this.updateSelection(this.openmct.selection.get());
    },
    destroyed() {
        this.openmct.selection.off('change', this.updateSelection);
    },
    methods: {
        updateSelection(selection) {
            const inspectorViews = this.openmct.inspectorViews.get(selection);

            this.tabs = inspectorViews.map(view => {
                return {
                    name: view.name,
                    hideTab: view.hideTab
                };
            });
        },
        isSelected(tab) {
            return this.selectedTab === tab;
        },
        selectTab(tab) {
            this.selectedTab = tab;
            this.$emit('select-tab', tab);
        }
    }
};
</script>

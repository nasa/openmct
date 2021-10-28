<!--
 Open MCT, Copyright (c) 2014-2020, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
<ul class="c-tree c-bar-graph-options">
    <h2 title="Display properties for this object">Bar Graph Series</h2>
    <li v-for="series in domainObject.composition"
        :key="series.key"
    >
        <series-options :item="series"
                        :color-palette="colorPalette"
        />
    </li>
</ul>
</template>

<script>
import SeriesOptions from "./SeriesOptions.vue";
import ColorPalette from '@/ui/color/ColorPalette';

export default {
    components: {
        SeriesOptions
    },
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            isEditing: this.openmct.editor.isEditing(),
            colorPalette: this.colorPalette
        };
    },
    computed: {
        canEdit() {
            return this.isEditing && !this.domainObject.locked;
        }
    },
    beforeMount() {
        this.colorPalette = new ColorPalette();
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.setEditState);
    },
    beforeDestroy() {
        this.openmct.editor.off('isEditing', this.setEditState);
    },
    methods: {
        setEditState(isEditing) {
            this.isEditing = isEditing;
        }
    }
};
</script>

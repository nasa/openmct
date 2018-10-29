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
    <div class="row">
        <object-view
            class="c-object-view" 
            v-if="row.domainObject"
            ref="dragObject"
            draggable="true" 
            :object="row.domainObject">
        </object-view>
        <div class="drop-container add"
             @drop="dropHandler">
            +
        </div>
    </div>
</template>

<style lang="scss">

    .row{
        min-width: 100%;
        min-height: 100%;

        .drop-container {
            min-height: 40px;
            min-width: 100%;
        }
    }
</style>

<script>
import ObjectView from '../../../ui/components/layout/ObjectView.vue';

export default {
    props: ['row', 'index'],
    components: {
        ObjectView
    },
    methods: {
        dragstart(event) {
            this.$emit('object-drag-from', this.index);
        },
        dropHandler(event){
            event.stopPropagation();

            this.$emit('object-drop-to', this.index, event);
        }
    },
    mounted() {
        if (this.$refs.dragObject) {
            this.$refs.dragObject.$el.addEventListener('dragstart', this.dragstart);
        }
    }
}
</script>

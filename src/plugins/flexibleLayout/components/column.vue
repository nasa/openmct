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
    <div class="column"
         :style="[{'min-width': minWidth}]">

        <row-component 
            v-for="(row, index) in rows"
            :key="index"
            :style="{ 
                'min-height': row.height || `${100/rows.length}%`
                }"
            :row="row"
            :index="index"
            @object-drag-from="dragFrom"
            @object-drop-to="dropTo">
        </row-component>
    </div>
</template>

<style lang="scss">

.column{
    min-height: 100%;
    min-width: 100%;

    .add{
        display: flex;
        flex-direction: columm;
        font-size: 100%;
        align-items: center;
        justify-content: center;
        min-width: 100%;
        background: #009bd140;
        border: 3px solid #009bd1;
        border-width: 3px 1.5px;
        cursor: pointer;

        .large{
            min-height: 100%;
        }
    }

    &:hover{
        .allow-drop {
            background: red;
        }
    }
}

</style>

<script>
import RowComponent from './row.vue';
import Row from '../utils/row'

export default {
    props: ['minWidth', 'rows', 'index'],
    components: {
        RowComponent
    },
    data() {

    },
    methods: {
        dragFrom(rowIndex) {
           this.$emit('object-drag-from', this.index, rowIndex);
        },
        dropTo(rowIndex, event) {
            let domainObject = JSON.parse(event.dataTransfer.getData('domainObject')),
                rowObject;

            if (domainObject) {
                rowObject = new Row(domainObject);
            }

            this.$emit('object-drop-to', this.index, rowIndex, rowObject);
        }
    }
}
</script>

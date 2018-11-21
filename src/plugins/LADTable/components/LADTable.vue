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
    <table>
        <thead>
            <td>Name</td>
            <td>Timestamp</td>
            <td>Value</td>
        </thead>
        <tbody>
            <LADRow 
                v-for="item in items"
                :key="item.identifier.key"
                :dObject="item">
            </LADRow>
        </tbody>
    </table>
     
 </template>

 <style lang="scss">
 
 </style>
 
 <script>
 import LADRow from './LADRow.vue';

 export default {
    inject: ['openmct', 'domainObject', 'composition'],
    components: {
        LADRow
    },
    data() {
        return {
            items: []
        }
    },
    mounted() {
        this.composition.on('add', this.addItem);
        this.composition.load();
    },
    destroyed() {
        this.composition.off('add', this.addItem);
    },
    methods: {
        addItem(dObject) {
            this.items.push(dObject);
        }
    }
 }
 </script>
 
 
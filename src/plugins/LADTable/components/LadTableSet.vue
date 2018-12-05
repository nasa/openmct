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
    <table class="c-table" style="table-layout: fixed;">
        <thead>
            <tr>
                <th>Name</th>
                <th>Timestamp</th>
                <th>Value</th>
            </tr>
        </thead>
        <tbody>
            <template
                v-for="primary in primaryCollection">

                <tr
                    :key="primary.identifier.key">
                    <th colsize="100">{{primary.name}}</th>
                </tr>
                
                <lad-row
                    v-for="secondary in secondaryCollection[primary.identifier.key]"
                    :key="secondary.identifier.key"
                    :domainObject="secondary">
                </lad-row>
            </template>
        </tbody>
    </table>
    
</template>

<style lang="scss">

</style>

<script>
    import LadRow from './LadRow.vue';

    export default {
    inject: ['openmct', 'domainObject'],
    components: {
        LadRow
    },
    data() {
        return {
            primaryCollection: [],
            secondaryCollection: {},
            compositions: []
        }
    },
    methods: {
        getComposition(domainObject) {
            this.$set(this.secondaryCollection, domainObject.identifier.key, []);
            this.primaryCollection.push(domainObject);

            let composition = openmct.composition.get(domainObject),
                callback = this.addSecondary(domainObject);
                composition.on('add', callback);
                composition.load();

            this.compositions.push({composition, callback});
        },
        addSecondary(primary) {
            return (secondary) => {
                let array = this.secondaryCollection[primary.identifier.key];
                    array.push(secondary);
                this.$set(this.secondaryCollection, primary.identifier.key, array);
            }
        }
    },
    mounted() {
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.getComposition);
        this.composition.load();
    },
    destroyed() {
        this.composition.off('add', this.getComposition);
        this.compositions.forEach(c => {
            c.composition.off('add', c.callback);
        });
    }
}
</script>
 
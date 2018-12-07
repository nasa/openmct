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
                    :key="primary.key">
                    <th colsize="100">{{primary.domainObject.name}}</th>
                </tr>
                
                <lad-row
                    v-for="secondary in secondaryCollection[primary.key]"
                    :key="secondary.key"
                    :domainObject="secondary.domainObject">
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
        indexOf(object, array) {
            let index = -1;

            array.forEach((o,i) => {
                if(o.domainObject.identifier.key === object.key) {
                    index = i;
                    return;
                }
            });

            return index;
        },
        addPrimary(domainObject) {
            let primary = {};
            primary.domainObject = domainObject;
            primary.key = this.openmct.objects.makeKeyString(domainObject.identifier);

            this.$set(this.secondaryCollection, primary.key, []);
            this.primaryCollection.push(primary);

            let composition = openmct.composition.get(primary.domainObject),
                addCallback = this.addSecondary(primary),
                removeCallback = this.removeSecondary(primary);

            composition.on('add', addCallback);
            composition.on('remove', removeCallback);
            composition.load();

            this.compositions.push({composition, addCallback, removeCallback});
        },
        removePrimary(identifier) {
            let index = this.indexOf(identifier, this.primaryCollection),
                primary = this.primaryCollection[index];
            
            this.$set(this.secondaryCollection, primary.key, undefined);
            this.primaryCollection.splice(index,1);
            primary = undefined;
        },
        addSecondary(primary) {
            return (domainObject) => {
                let secondary = {};
                secondary.key = this.openmct.objects.makeKeyString(domainObject.identifier);
                secondary.domainObject = domainObject;

                let array = this.secondaryCollection[primary.key];
                array.push(secondary);
    
                this.$set(this.secondaryCollection, primary.key, array);
            }
        },
        removeSecondary(primary) {
            return (identifier) => {
                let array = this.secondaryCollection[primary.key],
                    index = this.indexOf(identifier, array);

                array.splice(index, 1);

                this.$set(this.secondaryCollection, primary.key, array);
            }
        }
    },
    mounted() {
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addPrimary);
        this.composition.on('remove', this.removePrimary);
        this.composition.load();
    },
    destroyed() {
        this.composition.off('add', this.addPrimary);
        this.composition.off('remove', this.removePrimary);
        this.compositions.forEach(c => {
            c.composition.off('add', c.addCallback);
            c.composition.off('remove', c.removeCallback);
        });
    }
}
</script>
  
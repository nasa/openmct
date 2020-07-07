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
<table class="c-table c-lad-table">
    <thead>
        <tr>
            <th>Name</th>
            <th>Timestamp</th>
            <th>Value</th>
        </tr>
    </thead>
    <tbody>
        <template
            v-for="primary in primaryTelemetryObjects"
        >
            <tr
                :key="primary.key"
                class="c-table__group-header js-lad-table-set__table-headers"
            >
                <td colspan="10">
                    {{ primary.domainObject.name }}
                </td>
            </tr>
            <lad-row
                v-for="secondary in secondaryTelemetryObjects[primary.key]"
                :key="secondary.key"
                :domain-object="secondary.domainObject"
            />
        </template>
    </tbody>
</table>
</template>

<script>
import LadRow from './LADRow.vue';

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        LadRow
    },
    data() {
        return {
            primaryTelemetryObjects: [],
            secondaryTelemetryObjects: {},
            compositions: []
        }
    },
    mounted() {
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addPrimary);
        this.composition.on('remove', this.removePrimary);
        this.composition.on('reorder', this.reorderPrimary);
        this.composition.load();
    },
    destroyed() {
        this.composition.off('add', this.addPrimary);
        this.composition.off('remove', this.removePrimary);
        this.composition.off('reorder', this.reorderPrimary);
        this.compositions.forEach(c => {
            c.composition.off('add', c.addCallback);
            c.composition.off('remove', c.removeCallback);
        });
    },
    methods: {
        addPrimary(domainObject) {
            let primary = {};
            primary.domainObject = domainObject;
            primary.key = this.openmct.objects.makeKeyString(domainObject.identifier);

            this.$set(this.secondaryTelemetryObjects, primary.key, []);
            this.primaryTelemetryObjects.push(primary);

            let composition = this.openmct.composition.get(primary.domainObject);
            let addCallback = this.addSecondary(primary);
            let removeCallback = this.removeSecondary(primary);

            composition.on('add', addCallback);
            composition.on('remove', removeCallback);
            composition.load();

            this.compositions.push({composition, addCallback, removeCallback});
        },
        removePrimary(identifier) {
            let index = this.primaryTelemetryObjects.findIndex(primary => this.openmct.objects.makeKeyString(identifier) === primary.key);
            let primary = this.primaryTelemetryObjects[index];

            this.$set(this.secondaryTelemetryObjects, primary.key, undefined);
            this.primaryTelemetryObjects.splice(index,1);
            primary = undefined;
        },
        reorderPrimary(reorderPlan) {
            let oldComposition = this.primaryTelemetryObjects.slice();
            reorderPlan.forEach(reorderEvent => {
                this.$set(this.primaryTelemetryObjects, reorderEvent.newIndex, oldComposition[reorderEvent.oldIndex]);
            });
        },
        addSecondary(primary) {
            return (domainObject) => {
                let secondary = {};
                secondary.key = this.openmct.objects.makeKeyString(domainObject.identifier);
                secondary.domainObject = domainObject;

                let array = this.secondaryTelemetryObjects[primary.key];
                array.push(secondary);

                this.$set(this.secondaryTelemetryObjects, primary.key, array);
            }
        },
        removeSecondary(primary) {
            return (identifier) => {
                let array = this.secondaryTelemetryObjects[primary.key];
                let index = array.findIndex(secondary => this.openmct.objects.makeKeyString(identifier) === secondary.key);

                array.splice(index, 1);

                this.$set(this.secondaryTelemetryObjects, primary.key, array);
            }
        }
    }
}
</script>

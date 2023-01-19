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
    class="c-lad-table-wrapper u-style-receiver js-style-receiver"
    :class="staleClass"
>
    <table class="c-table c-lad-table">
        <thead>
            <tr>
                <th>Name</th>
                <th>Timestamp</th>
                <th>Value</th>
                <th v-if="hasUnits">Unit</th>
            </tr>
        </thead>
        <tbody>
            <lad-row
                v-for="ladRow in items"
                :key="ladRow.key"
                :domain-object="ladRow.domainObject"
                :path-to-table="objectPath"
                :has-units="hasUnits"
                :is-stale="staleObjects.includes(ladRow.key)"
                @rowContextClick="updateViewContext"
            />
        </tbody>
    </table>
</div>
</template>

<script>

import LadRow from './LADRow.vue';
import StalenessUtils from '@/utils/staleness';

export default {
    components: {
        LadRow
    },
    inject: ['openmct', 'currentView'],
    props: {
        domainObject: {
            type: Object,
            required: true
        },
        objectPath: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            items: [],
            viewContext: {},
            staleObjects: []
        };
    },
    computed: {
        hasUnits() {
            let itemsWithUnits = this.items.filter((item) => {
                let metadata = this.openmct.telemetry.getMetadata(item.domainObject);
                const valueMetadatas = metadata ? metadata.valueMetadatas : [];

                return this.metadataHasUnits(valueMetadatas);

            });

            return itemsWithUnits.length !== 0;
        },
        staleClass() {
            if (this.staleObjects.length !== 0) {
                return 'is-stale';
            }

            return '';
        }
    },
    mounted() {
        this.stalenessUtils = new StalenessUtils(this.openmct);

        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addItem);
        this.composition.on('remove', this.removeItem);
        this.composition.on('reorder', this.reorder);
        this.composition.load();
        this.unsubscribeFromStaleness = {};
    },
    destroyed() {
        this.composition.off('add', this.addItem);
        this.composition.off('remove', this.removeItem);
        this.composition.off('reorder', this.reorder);

        this.stalenessUtils.destroy();
        Object.values(this.unsubscribeFromStaleness).forEach(unsubscribeFromStaleness => unsubscribeFromStaleness());
    },
    methods: {
        addItem(domainObject) {
            let item = {};
            item.domainObject = domainObject;
            item.key = this.openmct.objects.makeKeyString(domainObject.identifier);

            this.items.push(item);

            this.openmct.telemetry.isStale(domainObject).then((stalenessResponse) => {
                this.handleStaleness(item.key, stalenessResponse);
            });
            const unsubscribeFromStaleness = this.openmct.telemetry.subscribeToStaleness(domainObject, (stalenessResponse) => {
                this.handleStaleness(item.key, stalenessResponse);
            });

            this.unsubscribeFromStaleness[item.key] = unsubscribeFromStaleness;
        },
        removeItem(identifier) {
            const keystring = this.openmct.objects.makeKeyString(identifier);
            const index = this.items.findIndex(item => keystring === item.key);

            this.items.splice(index, 1);

            this.unsubscribeFromStaleness[keystring]();
            this.handleStaleness(keystring, false);
        },
        reorder(reorderPlan) {
            const oldItems = this.items.slice();
            reorderPlan.forEach((reorderEvent) => {
                this.$set(this.items, reorderEvent.newIndex, oldItems[reorderEvent.oldIndex]);
            });
        },
        metadataHasUnits(valueMetadatas) {
            const metadataWithUnits = valueMetadatas.filter(metadatum => metadatum.unit);

            return metadataWithUnits.length > 0;
        },
        handleStaleness(id, stalenessResponse) {
            if (this.stalenessUtils.shouldUpdateStaleness(stalenessResponse, id)) {
                const index = this.staleObjects.indexOf(id);
                if (stalenessResponse.isStale) {
                    if (index === -1) {
                        this.staleObjects.push(id);
                    }
                } else {
                    if (index !== -1) {
                        this.staleObjects.splice(index, 1);
                    }
                }
            }
        },
        updateViewContext(rowContext) {
            this.viewContext.row = rowContext;
        },
        getViewContext() {
            return this.viewContext;
        }
    }
};
</script>

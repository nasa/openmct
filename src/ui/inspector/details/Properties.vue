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
<div class="c-inspector__properties c-inspect-properties">
    <div class="c-inspect-properties__header">
        Details
    </div>
    <ul
        v-if="hasDetails"
        class="c-inspect-properties__section"
    >
        <Component
            :is="getComponent(detail)"
            v-for="detail in details"
            :key="detail.name"
            :detail="detail"
        />

    </ul>
    <div
        v-else
        class="c-inspect-properties__row--span-all"
    >
        {{ noDetailsMessage }}
    </div>
</div>
</template>

<script>
import Moment from 'moment';
import DetailText from './DetailText.vue';

export default {
    components: {
        DetailText
    },
    inject: ['openmct'],
    data() {
        return {
            selection: undefined
        };
    },
    computed: {
        details() {
            return this.customDetails ? this.customDetails : this.domainObjectDetails;
        },
        customDetails() {
            if (this.context === undefined) {
                return;
            }

            return this.context.details;
        },
        domainObject() {
            if (this.context === undefined) {
                return;
            }

            return this.context.item;
        },
        type() {
            if (this.domainObject === undefined) {
                return;
            }

            return this.openmct.types.get(this.domainObject.type);
        },
        domainObjectDetails() {
            if (this.domainObject === undefined) {
                return;
            }

            const title = this.domainObject.name;
            const typeName = this.type ? this.type.definition.name : `Unknown: ${this.domainObject.type}`;
            const timestampLabel = this.domainObject.modified ? 'Modified' : 'Created';
            const timestamp = this.domainObject.modified ? this.domainObject.modified : this.domainObject.created;
            const notes = this.domainObject.notes;

            const details = [
                {
                    name: 'Title',
                    value: title
                },
                {
                    name: 'Type',
                    value: typeName
                }
            ];

            if (notes) {
                details.push({
                    name: 'Notes',
                    value: notes
                });
            }

            if (timestamp !== undefined) {
                const formattedTimestamp = Moment.utc(timestamp)
                    .format('YYYY-MM-DD[\n]HH:mm:ss')
                    + ' UTC';

                details.push(
                    {
                        name: timestampLabel,
                        value: formattedTimestamp
                    }
                );
            }

            return [...details, ...this.typeProperties];
        },
        context() {
            if (
                !this.selection
                || !this.selection.length
                || !this.selection[0].length
            ) {
                return;
            }

            return this.selection[0][0].context;
        },
        hasDetails() {
            return Boolean(
                this.details
                && this.details.length
                && !this.multiSelection
            );
        },
        multiSelection() {
            return this.selection && this.selection.length > 1;
        },
        noDetailsMessage() {
            return this.multiSelection
                ? 'No properties to display for multiple items'
                : 'No properties to display for this item';
        },
        typeProperties() {
            if (!this.type) {
                return [];
            }

            let definition = this.type.definition;
            if (!definition.form || definition.form.length === 0) {
                return [];
            }

            return definition.form
                .map((field) => {
                    let path = field.property;
                    if (typeof path === 'string') {
                        path = [path];
                    }

                    if (field.control === 'file-input') {
                        path = [...path, 'name'];
                    }

                    return {
                        name: field.name,
                        path
                    };
                })
                .filter(field => Array.isArray(field.path))
                .map((field) => {
                    return {
                        name: field.name,
                        value: field.path.reduce((object, key) => {
                            if (object === undefined) {
                                return object;
                            }

                            return object[key];
                        }, this.domainObject)
                    };
                });
        }
    },
    mounted() {
        this.openmct.selection.on('change', this.updateSelection);
        this.updateSelection(this.openmct.selection.get());
    },
    beforeDestroy() {
        this.openmct.selection.off('change', this.updateSelection);
    },
    methods: {
        getComponent(detail) {
            const component = detail.component ? detail.component : 'text';

            return `detail-${component}`;
        },
        updateSelection(selection) {
            this.selection = selection;
        }
    }
};
</script>

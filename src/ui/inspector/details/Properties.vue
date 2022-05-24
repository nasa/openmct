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
        <ObjectView
            style="min-height:300px;"
            :default-object="defaultObject"
            :show-edit-view="showEditView"
            :object-view-key="objectViewKey"
        />
</div>
</template>

<script>
import Moment from 'moment';
import ObjectView from '../../components/ObjectView.vue';

export default {
    components: {
        ObjectView
    },
    inject: ['openmct'],
    data() {
        const STACKED_PLOT_TYPE_KEY = 'telemetry.plot.stacked';
        const stackedPlotType = this.openmct.types.get(STACKED_PLOT_TYPE_KEY);
        const composition = [
            'b66a22b6-7f12-4358-bd95-a9092486ddd3',
            '0072d390-12b6-4ecc-93e5-2598df36b6d7'
        ];
        const tempStackedPlot = {
            identifier: {
                namespace: '',
                key: 'temporary-stacked-plot'
            },
            name: 'Data Pivot',
            type: STACKED_PLOT_TYPE_KEY
        };

        stackedPlotType.definition.initialize(tempStackedPlot);
        tempStackedPlot.configuration = {
            useIndependentTime: true,
            timeOptions: {
                mode: {
                    key: "fixed" //'local'
                },
                fixedOffsets: {
                    start: 1653334980000, //timestamp
                    end: 1653335080000
                }
            }
        };
        tempStackedPlot.composition.push(...composition);

        return {
            selection: undefined,
            defaultObject: tempStackedPlot,
            showEditView: false,
            objectViewKey: 'plot-stacked'
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
                .filter(field => !field.hideFromInspector)
                .map(field => {
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

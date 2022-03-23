
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
<tr
    class="js-lad-table__body__row"
    @contextmenu.prevent="showContextMenu"
>
    <td class="js-first-data">{{ domainObject.name }}</td>
    <td class="js-second-data">{{ formattedTimestamp }}</td>
    <td
        class="js-third-data"
        :class="valueClass"
    >{{ value }}</td>
    <td
        v-if="hasUnits"
        class="js-units"
    >
        {{ unit }}
    </td>
</tr>
</template>

<script>

const CONTEXT_MENU_ACTIONS = [
    'viewDatumAction',
    'viewHistoricalData',
    'remove'
];
const BLANK_VALUE = '---';

export default {
    inject: ['openmct', 'currentView'],
    props: {
        domainObject: {
            type: Object,
            required: true
        },
        pathToTable: {
            type: Array,
            required: true
        },
        hasUnits: {
            type: Boolean,
            requred: true
        }
    },
    data() {
        return {
            datum: undefined,
            timestamp: undefined,
            timestampKey: undefined,
            unit: ''
        };
    },
    computed: {
        value() {
            if (!this.datum) {
                return BLANK_VALUE;
            }

            return this.formats[this.valueKey].format(this.datum);
        },
        valueClass() {
            if (!this.datum) {
                return '';
            }

            const limit = this.limitEvaluator.evaluate(this.datum, this.valueMetadata);

            return limit ? limit.cssClass : '';

        },
        formattedTimestamp() {
            if (!this.timestamp) {
                return BLANK_VALUE;
            }

            return this.timeSystemFormat.format(this.timestamp);
        },
        timeSystemFormat() {
            if (!this.formats[this.timestampKey]) {
                console.warn(`No formatter for ${this.timestampKey} time system for ${this.domainObject.name}.`);
            }

            return this.formats[this.timestampKey];
        },
        objectPath() {
            return [this.domainObject, ...this.pathToTable];
        }
    },
    mounted() {
        this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);
        this.formats = this.openmct.telemetry.getFormatMap(this.metadata);
        this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        this.bounds = this.openmct.time.bounds();

        this.limitEvaluator = this.openmct
            .telemetry
            .limitEvaluator(this.domainObject);

        this.openmct.time.on('timeSystem', this.updateTimeSystem);
        this.openmct.time.on('bounds', this.updateBounds);

        this.timestampKey = this.openmct.time.timeSystem().key;

        this.valueMetadata = undefined;

        if (this.metadata) {
            this.valueMetadata = this
                .metadata
                .valuesForHints(['range'])[0] || this.firstNonDomainAttribute(this.metadata);
        }

        this.valueKey = this.valueMetadata ? this.valueMetadata.key : undefined;

        this.unsubscribe = this.openmct
            .telemetry
            .subscribe(this.domainObject, this.setLatestValues);

        this.requestHistory();

        if (this.hasUnits) {
            this.setUnit();
        }
    },
    destroyed() {
        this.unsubscribe();
        this.openmct.time.off('timeSystem', this.updateTimeSystem);
        this.openmct.time.off('bounds', this.updateBounds);
    },
    methods: {
        updateView() {
            if (!this.updatingView) {
                this.updatingView = true;
                requestAnimationFrame(() => {
                    let newTimestamp = this.getParsedTimestamp(this.latestDatum);

                    if (this.shouldUpdate(newTimestamp)) {
                        this.timestamp = newTimestamp;
                        this.datum = this.latestDatum;
                    }

                    this.updatingView = false;
                });
            }
        },
        setLatestValues(datum) {
            this.latestDatum = datum;

            this.updateView();
        },
        shouldUpdate(newTimestamp) {
            return this.inBounds(newTimestamp)
                && (this.timestamp === undefined || newTimestamp > this.timestamp);
        },
        requestHistory() {
            this.openmct
                .telemetry
                .request(this.domainObject, {
                    start: this.bounds.start,
                    end: this.bounds.end,
                    size: 1,
                    strategy: 'latest'
                })
                .then((array) => this.setLatestValues(array[array.length - 1]))
                .catch((error) => {
                    console.warn('Error fetching data', error);
                });
        },
        updateBounds(bounds, isTick) {
            this.bounds = bounds;
            if (!isTick) {
                this.resetValues();
                this.requestHistory();
            }
        },
        inBounds(timestamp) {
            return timestamp >= this.bounds.start && timestamp <= this.bounds.end;
        },
        updateTimeSystem(timeSystem) {
            this.resetValues();
            this.timestampKey = timeSystem.key;
        },
        updateViewContext() {
            this.$emit('rowContextClick', {
                viewHistoricalData: true,
                viewDatumAction: true,
                getDatum: () => {
                    return this.datum;
                }
            });
        },
        showContextMenu(event) {
            this.updateViewContext();

            const actions = CONTEXT_MENU_ACTIONS.map(key => this.openmct.actions.getAction(key));
            const menuItems = this.openmct.menus.actionsToMenuItems(actions, this.objectPath, this.currentView);
            if (menuItems.length) {
                this.openmct.menus.showMenu(event.x, event.y, menuItems);
            }
        },
        resetValues() {
            this.timestamp = undefined;
            this.datum = undefined;
        },
        getParsedTimestamp(timestamp) {
            if (this.timeSystemFormat) {
                return this.timeSystemFormat.parse(timestamp);
            }
        },
        setUnit() {
            this.unit = this.valueMetadata.unit || '';
        },
        firstNonDomainAttribute(metadata) {
            return metadata
                .values()
                .find(metadatum => metadatum.hints.domain === undefined && metadatum.key !== 'name');
        }
    }
};
</script>


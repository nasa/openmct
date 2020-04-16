
/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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
<tr @contextmenu.prevent="showContextMenu">
    <td>{{ name }}</td>
    <td>{{ timestamp }}</td>
    <td :class="valueClass">
        {{ value }}
    </td>
</tr>
</template>

<script>

const CONTEXT_MENU_ACTIONS = [
    'viewHistoricalData',
    'remove'
];

export default {
    inject: ['openmct', 'objectPath'],
    props: {
        domainObject: {
            type: Object,
            required: true
        }
    },
    data() {
        let currentObjectPath = this.objectPath.slice();
        currentObjectPath.unshift(this.domainObject);

        return {
            name: this.domainObject.name,
            timestamp: '---',
            value: '---',
            valueClass: '',
            currentObjectPath
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

        this.stopWatchingMutation = this.openmct
            .objects
            .observe(
                this.domainObject,
                '*',
                this.updateName
            );

        this.openmct.time.on('timeSystem', this.updateTimeSystem);
        this.openmct.time.on('bounds', this.updateBounds);

        this.timestampKey = this.openmct.time.timeSystem().key;

        this.valueMetadata = this
            .metadata
            .valuesForHints(['range'])[0];

        this.valueKey = this.valueMetadata.key

        this.unsubscribe = this.openmct
            .telemetry
            .subscribe(this.domainObject, this.updateValues);

        this.requestHistory(false);

        // this.openmct
        //     .telemetry
        //     .request(this.domainObject, {strategy: 'latest'})
        //     .then((array) => this.updateValues(array[array.length - 1]));
    },
    destroyed() {
        this.stopWatchingMutation();
        this.unsubscribe();
        this.openmct.time.off('timeSystem', this.updateTimeSystem);
        this.openmct.time.off('bounds', this.updateBounds);
    },
    methods: {
        updateValues(datum) {
            let newTimestamp = datum[this.timestampKey];

            if(this.inBounds(newTimestamp)) {

                // if current datum, else assign new current
                if(this.currentDatum) {
                    let existingTimestamp = this.currentDatum[this.timestampKey];
                    // if existing is in bounds, if not assign new current
                    if(this.inBounds(existingTimestamp)) {
                        // race condition check
                        if(newTimestamp >= existingTimestamp) {
                            this.currentDatum = datum;
                        }
                    } else {
                        this.currentDatum = datum;
                    }
                } else {
                    this.currentDatum = datum;
                }

                this.timestamp = this.formats[this.timestampKey].format(this.currentDatum);
                this.value = this.formats[this.valueKey].format(this.currentDatum);

                var limit = this.limitEvaluator.evaluate(this.currentDatum, this.valueMetadata);

                if (limit) {
                    this.valueClass = limit.cssClass;
                } else {
                    this.valueClass = '';
                }
            }
        },
        requestHistory(isTick) {
            if(!isTick) {
                this.openmct
                    .telemetry
                    .request(this.domainObject, {
                        start: this.bounds.start,
                        end: this.bounds.end,
                        strategy: 'latest'
                    })
                    .then((array) => this.updateValues(array[array.length - 1]));
            }
        },
        updateName(name) {
            this.name = name;
        },
        updateBounds(bounds, isTick) {
            this.bounds = bounds;
            this.requestHistory(isTick);
        },
        inBounds(timestamp) {
            return timestamp >= this.bounds.start && timestamp <= this.bounds.end;
        },
        updateTimeSystem(timeSystem) {
            this.value = '---';
            this.timestamp = '---';
            this.valueClass = '';
            this.timestampKey = timeSystem.key;
        },
        showContextMenu(event) {
            this.openmct.contextMenu._showContextMenuForObjectPath(this.currentObjectPath, event.x, event.y, CONTEXT_MENU_ACTIONS);
        }
    }
}
</script>


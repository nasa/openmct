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
    <tr>
        <td>{{dObject.name}}</td>
        <td>{{timestamp}}</td>
        <td>{{value}}</td>
    </tr>
</template>

<style lang="scss">

</style>

<script>
export default {
    inject: ['openmct'],
    props: ['dObject'],
    data() {
        return {
            name: this.dObject.name,
            timestamp: '---',
            value: '---',
            valueClass: ''
        }
    },
    methods: {
        updateValues(datum) {
            this.timestamp = this.formats[this.timestampKey].format(datum);
            this.value = this.formats[this.valueKey].format(datum);
            var limit = this.limitEvaluator.evaluate(datum, this.valueKey);
            if (limit) {
                this.valueClass = limit.cssClass;
            } else {
                this.valueClass = '';
            }
        }
    },
    mounted() {
        this.metadata = this.openmct.telemetry.getMetadata(this.dObject);
        this.formats = this.openmct.telemetry.getFormatMap(this.metadata);

        this.limitEvaluator = openmct
            .telemetry
            .limitEvaluator(this.dObject);

        this.stopWatchingMutation = openmct
            .objects
            .observe(
                this.dObject,
                '*',
                this.updateName
            );

         this.openmct.time.on('timeSystem', this.updateTimeSystem, this);

         this.timestampKey = this.openmct.time.timeSystem().key;

         this.valueKey = this
            .metadata
            .valuesForHints(['range'])[0].key;

         this.unsubscribe = this.openmct
            .telemetry
            .subscribe(this.dObject, this.updateValues.bind(this), {});

         this.openmct
            .telemetry
            .request(this.dObject, {strategy: 'latest'})
            .then((values) => values.forEach(this.updateValues));
    },
    destroyed() {
        this.stopWatchingMutation();
        this.unsubscribe();
    }
}
</script>


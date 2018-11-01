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
    <div class="c-telemetry-view">
        <span v-if="showLabel"
              class="c-telemetry-view__label">{{ item.domainObject.name }}</span>
        <span v-if="showValue"
              class="c-telemetry-view__value"
              :class="[telemetryClass]">{{ telemetryValue }}</span>
    </div>    
 </template>

<style lang="scss">
    @import '~styles/sass-base';

    .c-telemetry-view {
        display: flex;
        > * + * {
            margin-left: $interiorMargin;
        }

        > * {
            @include ellipsize();
            flex: 1 1 auto;
        }
    }
</style>

 <script>
    export default {
        inject: ['openmct'],
        props: {
            item: Object
        },
        computed: {
            showLabel: function () {
                let displayMode = this.item.config.alphanumeric.displayMode;
                return (displayMode === 'all' || displayMode === 'label') ? true : false;
            },
            showValue: function () {
                let displayMode = this.item.config.alphanumeric.displayMode;
                return displayMode === 'value' || displayMode == 'all' ? true : false;
            }
        },
        data() {
            return {
                telemetryValue: '',
                telemetryClass: ''
            }
        },
        methods: {
            getTelemetry(domainObject) {
                return Promise.resolve(domainObject)
                    .then(this.fetchHistoricalData)
                    .then(this.subscribeToObject);
            },
            fetchHistoricalData(object) {
                let bounds = this.openmct.time.bounds();
                this.openmct.telemetry.request(object, {start: bounds.start, end: bounds.end, size: 1})
                    .then(function (data) {
                        if (data.length > 0) {
                            this.updateView(object, data[data.length - 1]);
                        }
                    }.bind(this));

                return object;
            },
            subscribeToObject(object) {
                let id = this.openmct.objects.makeKeyString(object.identifier);
                let self = this;
                this.subscription = this.openmct.telemetry.subscribe(object, function (datum) {
                    if (self.openmct.time.clock() !== undefined) {
                        self.updateView(object, datum);
                    }
                }, {});

                return object;
            },
            updateView(telemetryObject, datum) {
                let metadata = this.openmct.telemetry.getMetadata(telemetryObject);
                let valueMetadata = metadata.values().filter(function (value) {
                    return value.key === this.item.config.alphanumeric.value;
                }.bind(this))[0];

                if (valueMetadata === undefined) {
                    return;
                }

                let formatter = this.openmct.telemetry.getValueFormatter(valueMetadata);
                this.telemetryValue = formatter && formatter.format(datum);

                let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
                let alarm = limitEvaluator && limitEvaluator.evaluate(datum, valueMetadata);
                this.telemetryClass = alarm && alarm.cssClass;
            },
            removeSubscription() {
                if (this.subscription) {
                    this.subscription();
                    this.subscription = undefined;
                }
            }
        },
        mounted() {
            this.getTelemetry(this.item.domainObject);
            this.item.config.attachListeners();
        },
        destroyed() {
            this.removeSubscription();
            this.item.config.destroy();
        }
    }

 </script>
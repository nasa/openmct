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
    <div class="c-telemetry-view"
         :style="styleObject">
        <div v-if="showLabel"
              class="c-telemetry-view__label">
            <div class="c-telemetry-view__label-text">{{ item.domainObject.name }}</div>
        </div>

        <div v-if="showValue"
              :title="fieldName"
              class="c-telemetry-view__value"
              :class="[telemetryClass]">
            <div class="c-telemetry-view__value-text">{{ telemetryValue }}</div>
        </div>
    </div>    
 </template>

<style lang="scss">
    @import '~styles/sass-base';

    .c-telemetry-view {
        display: flex;
        align-items: stretch;

        > * {
            // Label and value holders
            flex: 1 1 auto;
            display: flex;
            flex-direction: row;
           // justify-content: center;
            align-items: center;
            overflow: hidden;
            padding: $interiorMargin;

            > * {
                // Text elements
                @include ellipsize();
            }
        }

        > * + * {
            margin-left: $interiorMargin;
        }

        .c-frame & {
            @include abs();
            border: 1px solid transparent;
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
            showLabel() {
                let displayMode = this.item.config.alphanumeric.displayMode;
                return displayMode === 'all' || displayMode === 'label';
            },
            showValue() {
                let displayMode = this.item.config.alphanumeric.displayMode;
                return displayMode === 'all' || displayMode === 'value';
            },
            styleObject() {
                let alphanumeric = this.item.config.alphanumeric;
                return {
                    backgroundColor: alphanumeric.fill,
                    borderColor: alphanumeric.stroke,
                    color: alphanumeric.color,
                    fontSize: alphanumeric.size
                }
            },
            fieldName() {
                return this.valueMetadata.name;
            },
            valueMetadata() {
                return this.metadata.value(this.item.config.alphanumeric.value);
            },
            valueFormatter() {
                return this.formats[this.item.config.alphanumeric.value];
            },
            telemetryValue() {
                if (!this.datum) {
                    return;
                }

                return this.valueFormatter && this.valueFormatter.format(this.datum);
            },
            telemetryClass() {
                if (!this.datum) {
                    return;
                }

                let alarm = this.limitEvaluator && this.limitEvaluator.evaluate(this.datum, this.valueMetadata);
                return alarm && alarm.cssClass;
            }
        },
        data() {
            return {
                datum: {},
                formats: {}
            }
        },
        methods: {
            requestHistoricalData() {
                let bounds = this.openmct.time.bounds();
                let options = {
                    start: bounds.start,
                    end: bounds.end,
                    size: 1
                };
                this.openmct.telemetry.request(this.item.domainObject, options)
                    .then(data => {
                        if (data.length > 0) {
                            this.updateView(data[data.length - 1]);
                        }
                    });
            },
            subscribeToObject() {
                this.subscription = this.openmct.telemetry.subscribe(this.item.domainObject, function (datum) {
                    if (this.openmct.time.clock() !== undefined) {
                        this.updateView(datum);
                    }
                }.bind(this));
            },
            updateView(datum) {
                this.datum = datum;
            },
            removeSubscription() {
                if (this.subscription) {
                    this.subscription();
                    this.subscription = undefined;
                }
            },
            refreshData(bounds, isTick) {
                if (!isTick) {
                    this.datum = undefined;
                    this.requestHistoricalData(this.item.domainObject);
                }
            }
        },
        mounted() {
            this.limitEvaluator = this.openmct.telemetry.limitEvaluator(this.item.domainObject);
            this.metadata = this.openmct.telemetry.getMetadata(this.item.domainObject);
            this.formats = this.openmct.telemetry.getFormatMap(this.metadata);

            this.requestHistoricalData();
            this.subscribeToObject();

            this.item.config.attachListeners();
            this.openmct.time.on("bounds", this.refreshData);
        },
        destroyed() {
            this.removeSubscription();
            this.item.config.removeListeners();
            this.openmct.time.off("bounds", this.refreshData);
        }
    }

 </script>
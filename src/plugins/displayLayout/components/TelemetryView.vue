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
    <div>
        <span>{{ item.domainObject.name }}</span>
        <span :class=[telemetryClass]>{{ telemetryValue }}</span>
    </div>    
 </template>

 <script>
    export default {
        inject: ['openmct'],
        props: {
            item: Object
        },
        computed: {
            telemetryLabel: function () {
                return this.item.domainObject.name;
            }
        },
        data() {
            return {
                telemetryValue: '',
                telemetryClass: ''
            }
        },
        created: function () {
            this.getTelemetry(this.item.domainObject);
        },
        methods: {
            getTelemetry(domainObject) {
                this.removeSubscription();

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
                let valueMetadata = this.chooseValueMetadataToDisplay(metadata);
                // console.log("valueMetadata", valueMetadata);
                this.telemetryValue = this.getFormattedTelemetryValueForKey(valueMetadata, datum);

                let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
                let alarm = limitEvaluator && limitEvaluator.evaluate(datum, valueMetadata);                
                this.telemetryClass = alarm && alarm.cssClass;
            },
            getFormattedTelemetryValueForKey(valueMetadata, datum) {
                let formatter = this.openmct.telemetry.getValueFormatter(valueMetadata);
                return formatter.format(datum);
            },
            chooseValueMetadataToDisplay(metadata) {
                // If there is a range value, show that preferentially
                let valueMetadata = metadata.valuesForHints(['range'])[0];

                // If no range is defined, default to the highest priority non time-domain data.
                if (valueMetadata === undefined) {
                    let valuesOrderedByPriority = metadata.values();
                    valueMetadata = valuesOrderedByPriority.filter(function (values) {
                        return !(values.hints.domain);
                    })[0];
                }

                return valueMetadata;
            },
            removeSubscription() {
                if (this.subscription) {
                    this.subscription();
                    this.subscription = undefined;
                }
            }
        },
        destroyed() {
            this.removeSubscription();
        }
    }

 </script>
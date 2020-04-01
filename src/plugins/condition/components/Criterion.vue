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
<div class="u-contents">
    <div class="c-cdef__separator c-row-separator"></div>
    <span class="c-cdef__label">{{ setRowLabel }}</span>
    <span class="c-cdef__controls">
        <span class="c-cdef__control">
            <select ref="telemetrySelect"
                    v-model="criterion.telemetry"
                    @change="updateMetadataOptions"
            >
                <option value="">- Select Telemetry -</option>
                <option value="all">all telemetry</option>
                <option value="any">any telemetry</option>
                <option v-for="telemetryOption in telemetry"
                        :key="telemetryOption.identifier.key"
                        :value="telemetryOption.identifier"
                >
                    {{ telemetryOption.name }}
                </option>
            </select>
        </span>
        <span v-if="criterion.telemetry"
              class="c-cdef__control"
        >
            <select ref="metadataSelect"
                    v-model="criterion.metadata"
                    @change="updateOperations"
            >
                <option value="">- Select Field -</option>
                <option v-for="option in telemetryMetadataOptions"
                        :key="option.key"
                        :value="option.key"
                >
                    {{ option.name }}
                </option>
            </select>
        </span>
        <span v-if="criterion.telemetry && criterion.metadata"
              class="c-cdef__control"
        >
            <select v-model="criterion.operation"
                    @change="updateInputVisibilityAndValues"
            >
                <option value="">- Select Comparison -</option>
                <option v-for="option in filteredOps"
                        :key="option.name"
                        :value="option.name"
                >
                    {{ option.text }}
                </option>
            </select>
            <template v-if="!enumerations.length">
                <span v-for="(item, inputIndex) in inputCount"
                      :key="inputIndex"
                      class="c-cdef__control__inputs"
                >
                    <input v-model="criterion.input[inputIndex]"
                           class="c-cdef__control__input"
                           :type="setInputType"
                           @blur="persist"
                    >
                    <span v-if="inputIndex < inputCount-1">and</span>
                </span>
            </template>
            <span v-else>
                <span v-if="inputCount"
                      class="c-cdef__control"
                >
                    <select v-model="criterion.input[0]"
                            @change="persist"
                    >
                        <option v-for="option in enumerations"
                                :key="option.string"
                                :value="option.value.toString()"
                        >
                            {{ option.string }}
                        </option>
                    </select>
                </span>
            </span>
        </span>
    </span>
</div>
</template>

<script>
import { OPERATIONS } from '../utils/operations';
import { INPUT_TYPES } from '../utils/operations';

export default {
    inject: ['openmct'],
    props: {
        criterion: {
            type: Object,
            required: true
        },
        telemetry: {
            type: Array,
            required: true,
            default: () => []
        },
        index: {
            type: Number,
            required: true
        },
        trigger: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            telemetryMetadataOptions: [],
            operations: OPERATIONS,
            rowLabel: '',
            operationFormat: '',
            enumerations: [],
            inputTypes: INPUT_TYPES
        }
    },
    computed: {
        setRowLabel: function () {
            let operator = this.trigger === 'all' ? 'and ': 'or ';
            return (this.index !== 0 ? operator : '') + 'when';
        },
        filteredOps: function () {
            return this.operations.filter(op => op.appliesTo.indexOf(this.operationFormat) !== -1);
        },
        setInputType: function () {
            let type = '';
            for (let i = 0; i < this.filteredOps.length; i++) {
                if (this.criterion.operation === this.filteredOps[i].name) {
                    if (this.filteredOps[i].appliesTo.length) {
                        type = this.inputTypes[this.filteredOps[i].appliesTo[0]];
                    } else {
                        type = 'text'
                    }
                    break;
                }
            }
            return type;
        },
        inputCount: function () {
            let inputCount = 0;
            if (this.criterion.operation) {
                for (let i = 0; i < this.filteredOps.length; i++) {
                    if (this.criterion.operation === this.filteredOps[i].name) {
                        inputCount = this.filteredOps[i].inputCount;
                        break;
                    }
                }
            }
            return inputCount;
        }
    },
    watch: {
        telemetry: {
            handler(newTelemetry, oldTelemetry) {
                this.checkTelemetry();
            },
            deep: true
        }
    },
    mounted() {
        this.updateMetadataOptions();
    },
    methods: {
        checkTelemetry() {
            if(this.criterion.telemetry) {
                if (this.criterion.telemetry === 'any' || this.criterion.telemetry === 'all') {
                    this.updateMetadataOptions();
                } else {
                    if (!this.telemetry.find((telemetryObj) => this.openmct.objects.areIdsEqual(this.criterion.telemetry, telemetryObj.identifier))) {
                        //telemetry being used was removed. So reset this criterion.
                        this.criterion.telemetry = '';
                        this.criterion.metadata = '';
                        this.criterion.input = [];
                        this.criterion.operation = '';
                        this.persist();
                    }
                }
            }
        },
        updateOperationFormat() {
            this.enumerations = [];
            let foundMetadata = this.telemetryMetadataOptions.find((value) => {
                return value.key === this.criterion.metadata;
            });
            if (foundMetadata) {
                if (foundMetadata.enumerations !== undefined) {
                    this.operationFormat = 'enum';
                    this.enumerations = foundMetadata.enumerations;
                } else if (foundMetadata.hints.hasOwnProperty('range')) {
                    this.operationFormat = 'number';
                } else if (foundMetadata.hints.hasOwnProperty('domain')) {
                    this.operationFormat = 'number';
                } else if (foundMetadata.key === 'name') {
                    this.operationFormat = 'string';
                } else {
                    this.operationFormat = 'string';
                }
            }
            this.updateInputVisibilityAndValues();
        },
        updateMetadataOptions(ev) {
            if (ev) {
                this.clearDependentFields(ev.target);
                this.persist();
            }
            if (this.criterion.telemetry) {
                const telemetry = (this.criterion.telemetry === 'all' || this.criterion.telemetry === 'any') ? this.telemetry : [{
                    identifier: this.criterion.telemetry
                }];

                let telemetryPromises = telemetry.map((telemetryObject) => this.openmct.objects.get(telemetryObject.identifier));
                Promise.all(telemetryPromises).then(telemetryObjects => {
                    this.telemetryMetadataOptions = [];
                    telemetryObjects.forEach(telemetryObject => {
                        let telemetryMetadata = this.openmct.telemetry.getMetadata(telemetryObject);
                        this.addMetaDataOptions(telemetryMetadata.values());
                    });
                    this.updateOperations();
                });
            }
        },
        addMetaDataOptions(options) {
            if (!this.telemetryMetadataOptions) {
                this.telemetryMetadataOptions = options;
            }
            options.forEach((option) => {
                const found = this.telemetryMetadataOptions.find((metadataOption) => {
                    return (metadataOption.key && (metadataOption.key === option.key)) && (metadataOption.name && (metadataOption.name === option.name))
                });
                if (!found) {
                    this.telemetryMetadataOptions.push(option);
                }
            });
        },
        updateOperations(ev) {
            this.updateOperationFormat();
            if (ev) {
                this.clearDependentFields(ev.target);
                this.persist();
            }
        },
        updateInputVisibilityAndValues(ev) {
            if (ev) {
                this.clearDependentFields();
                this.persist();
            }
        },
        clearDependentFields(el) {
            if (el === this.$refs.telemetrySelect) {
                this.criterion.metadata = '';
            } else if (el === this.$refs.metadataSelect) {
                if (!this.filteredOps.find(operation => operation.name === this.criterion.operation)) {
                    this.criterion.operation = '';
                    this.criterion.input = this.enumerations.length ? [this.enumerations[0].value.toString()] : [];
                }
            } else {
                if (this.enumerations.length && !this.criterion.input.length) {
                    this.criterion.input = [this.enumerations[0].value.toString()];
                }
            }
        },
        persist() {
            this.$emit('persist', this.criterion);
        }
    }
};
</script>

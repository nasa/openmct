/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
<template>
<div
    ref="timeConductorOptionsHolder"
    class="c-compact-tc"
    :class="[
        isFixed ? 'is-fixed-mode' : independentTCEnabled ? 'is-realtime-mode' : 'is-fixed-mode',
        { 'is-expanded' : independentTCEnabled }
    ]"
>
    <toggle-switch
        id="independentTCToggle"
        class="c-toggle-switch--mini"
        :checked="independentTCEnabled"
        :title="toggleTitle"
        @change="toggleIndependentTC"
    />

    <ConductorModeIcon v-if="independentTCEnabled" />

    <conductor-inputs-fixed
        v-if="showInputs"
        class="c-compact-tc__bounds--fixed"
        :object-path="objectPath"
        :read-only="true"
        :compact="true"
    />

    <conductor-inputs-realtime
        v-if="showInputs"
        class="c-compact-tc__bounds--real-time"
        :object-path="objectPath"
        :read-only="true"
        :compact="true"
    />
    <div class="c-not-button c-not-button--compact c-compact-tc__gear icon-gear"></div>
</div>
</template>

<script>
import { TIME_CONTEXT_EVENTS, FIXED_MODE_KEY } from '../../../api/time/constants';
import ConductorInputsFixed from "../ConductorInputsFixed.vue";
import ConductorInputsRealtime from "../ConductorInputsRealtime.vue";
import ConductorModeIcon from "@/plugins/timeConductor/ConductorModeIcon.vue";
import ToggleSwitch from '../../../ui/components/ToggleSwitch.vue';
import independentTimeConductorPopUpManager from "./independentTimeConductorPopUpManager";

export default {
    components: {
        ConductorModeIcon,
        ConductorInputsRealtime,
        ConductorInputsFixed,
        ToggleSwitch
    },
    mixins: [independentTimeConductorPopUpManager],
    inject: ['openmct'],
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
        const bounds = this.openmct.time.getBounds();
        const isFixed = this.openmct.time.isFixed();

        return {
            timeOptions: this.domainObject.configuration.timeOptions || {
                clockOffsets: this.openmct.time.getClockOffsets(),
                fixedOffsets: this.openmct.time.getBounds()
            },
            isFixed,
            independentTCEnabled: this.domainObject.configuration.useIndependentTime === true,
            viewBounds: {
                start: bounds.start,
                end: bounds.end
            }
        };
    },
    computed: {
        toggleTitle() {
            return `${this.independentTCEnabled ? 'Disable' : 'Enable'} independent Time Conductor`;
        },
        showInputs() {
            return this.isFixed && this.independentTCEnabled;
        }
    },
    watch: {
        domainObject: {
            handler(domainObject) {
                const key = this.openmct.objects.makeKeyString(domainObject.identifier);
                if (key !== this.keyString) {
                    //domain object has changed
                    this.destroyIndependentTime();

                    this.independentTCEnabled = domainObject.configuration.useIndependentTime === true;
                    this.timeOptions = domainObject.configuration.timeOptions || {
                        clockOffsets: this.openmct.time.getClockOffsets(),
                        fixedOffsets: this.openmct.time.getBounds()
                    };

                    this.initialize();
                }
            },
            deep: true
        },
        objectPath: {
            handler() {
                //domain object or view has probably changed
                this.setTimeContext();
            },
            deep: true
        }
    },
    mounted() {
        this.initialize();
    },
    beforeDestroy() {
        this.stopFollowingTimeContext();
        this.destroyIndependentTime();
    },
    methods: {
        initialize() {
            this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            this.setTimeContext();

            if (this.timeOptions.mode) {
                this.mode = this.timeOptions.mode;
            } else {
                if (this.timeContext.getClock() === undefined) {
                    this.timeOptions.mode = this.mode = { key: FIXED_MODE_KEY };
                } else {
                    this.timeOptions.mode = this.mode = { key: Object.create(this.timeContext.getClock()).key};
                }
            }

            if (this.independentTCEnabled) {
                this.registerIndependentTimeOffsets();
            }
        },
        toggleIndependentTC() {
            this.independentTCEnabled = !this.independentTCEnabled;
            if (this.independentTCEnabled) {
                this.registerIndependentTimeOffsets();
            } else {
                this.removePopup();
                this.destroyIndependentTime();
            }

            this.$emit('stateChanged', this.independentTCEnabled); // no longer user this, but may be used elsewhere
            this.openmct.objects.mutate(this.domainObject, 'configuration.useIndependentTime', this.independentTCEnabled);
        },
        setTimeContext() {
            if (this.timeContext) {
                this.stopFollowingTimeContext();
            }

            this.timeContext = this.openmct.time.getContextForView(this.objectPath);
            this.timeContext.on(TIME_CONTEXT_EVENTS.clockChanged, this.setTimeOptions);
        },
        stopFollowingTimeContext() {
            this.timeContext.off(TIME_CONTEXT_EVENTS.clockChanged, this.setTimeOptions);
        },
        setTimeOptions(clock) {
            this.timeOptions.clockOffsets = this.timeOptions.clockOffsets || this.timeContext.getClockOffsets();
            this.timeOptions.fixedOffsets = this.timeOptions.fixedOffsets || this.timeContext.getBounds();

            if (!this.timeOptions.mode) {
                this.mode = this.timeContext.getClock() === undefined ? {key: FIXED_MODE_KEY} : {key: Object.create(this.timeContext.getClock()).key};
                this.registerIndependentTimeOffsets();
            }
        },
        saveFixedBounds(bounds) {
            const newOptions = Object.assign({}, this.timeOptions, {
                fixedOffsets: bounds
            });
            this.updateTimeOptions(newOptions);
        },
        saveClockOffsets(offsets) {
            const newOptions = Object.assign({}, this.timeOptions, {
                clockOffsets: offsets
            });

            this.updateTimeOptions(newOptions);
        },
        saveMode(mode) {
            this.mode = mode;
            const newOptions = Object.assign({}, this.timeOptions, {
                mode: this.mode
            });
            this.updateTimeOptions(newOptions);
        },
        updateTimeOptions(options) {
            this.timeOptions = options;
            if (!this.timeOptions.mode) {
                this.timeOptions.mode = this.mode;
            }

            this.registerIndependentTimeOffsets();
            this.$emit('updated', this.timeOptions); // no longer user this, but may be used elsewhere
            this.openmct.objects.mutate(this.domainObject, 'configuration.timeOptions', this.timeOptions);
        },
        registerIndependentTimeOffsets() {
            if (!this.timeOptions.mode) {
                return;
            }

            let offsets;

            if (this.isFixed) {
                offsets = this.timeOptions.fixedOffsets;
            } else {
                if (this.timeOptions.clockOffsets === undefined) {
                    this.timeOptions.clockOffsets = this.openmct.time.getClockOffsets();
                }

                offsets = this.timeOptions.clockOffsets;
            }

            const timeContext = this.openmct.time.getIndependentContext(this.keyString);
            if (!timeContext.hasOwnContext()) {
                this.unregisterIndependentTime = this.openmct.time.addIndependentContext(this.keyString, offsets, this.isFixed ? undefined : this.mode.key);
            } else {
                if (this.isFixed) {
                    timeContext.stopClock();
                    timeContext.setBounds(offsets);
                } else {
                    timeContext.setClock(this.mode.key, offsets);
                }
            }
        },
        destroyIndependentTime() {
            if (this.unregisterIndependentTime) {
                this.unregisterIndependentTime();
            }
        }
    }
};
</script>

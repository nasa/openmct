/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2021, United States Government
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
    class="c-conductor"
    :class="[
        isFixed ? 'is-fixed-mode' : independentTCEnabled ? 'is-realtime-mode' : 'is-fixed-mode'
    ]"
>
    <div class="c-conductor__time-bounds">
        <toggle-switch
            id="independentTCToggle"
            :checked="independentTCEnabled"
            :title="`${independentTCEnabled ? 'Disable' : 'Enable'} independent Time Conductor`"
            @change="toggleIndependentTC"
        />

        <ConductorModeIcon />

        <div v-if="timeOptions && independentTCEnabled"
             class="c-conductor__controls"
        >
            <Mode v-if="mode"
                  class="c-conductor__mode-select"
                  :key-string="domainObject.identifier.key"
                  :mode="timeOptions.mode"
                  :enabled="independentTCEnabled"
                  @modeChanged="saveMode"
            />

            <conductor-inputs-fixed v-if="isFixed"
                                    :key-string="domainObject.identifier.key"
                                    @updated="saveFixedOffsets"
            />

            <conductor-inputs-realtime v-else
                                       :key-string="domainObject.identifier.key"
                                       @updated="saveClockOffsets"
            />
        </div>
    </div>
</div>
</template>

<script>
import ConductorInputsFixed from "../ConductorInputsFixed.vue";
import ConductorInputsRealtime from "../ConductorInputsRealtime.vue";
import ConductorModeIcon from "@/plugins/timeConductor/ConductorModeIcon.vue";
import ToggleSwitch from '../../../ui/components/ToggleSwitch.vue';
import Mode from "./Mode.vue";

export default {
    components: {
        Mode,
        ConductorModeIcon,
        ConductorInputsRealtime,
        ConductorInputsFixed,
        ToggleSwitch
    },
    inject: ['openmct'],
    props: {
        domainObject: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            timeOptions: this.domainObject.configuration.timeOptions || {
                clockOffsets: this.openmct.time.clockOffsets(),
                fixedOffsets: this.openmct.time.bounds()
            },
            mode: undefined,
            independentTCEnabled: this.domainObject.configuration.useIndependentTime === true
        };
    },
    computed: {
        isFixed() {
            if (!this.mode || !this.mode.key) {
                return this.openmct.time.clock() === undefined;
            } else {
                return this.mode.key === 'fixed';
            }
        }
    },
    watch: {
        domainObject: {
            handler(domainObject) {
                if (!domainObject.configuration.timeOptions || !this.independentTCEnabled) {
                    return;
                }

                if (this.timeOptions.start !== domainObject.configuration.timeOptions.start
                    || this.timeOptions.end !== domainObject.configuration.timeOptions.end) {
                    this.timeOptions = domainObject.configuration.timeOptions;
                    this.destroyIndependentTime();
                    this.registerIndependentTimeOffsets();
                }
            },
            deep: true
        }
    },
    mounted() {
        this.setTimeContext();

        if (this.timeOptions.mode) {
            this.mode = this.timeOptions.mode;
        } else {
            this.timeOptions.mode = this.mode = this.timeContext.clock() === undefined ? { key: 'fixed' } : { key: Object.create(this.timeContext.clock()).key};
        }

        if (this.independentTCEnabled) {
            this.registerIndependentTimeOffsets();
        }
    },
    beforeDestroy() {
        this.stopFollowingTimeContext();
        this.destroyIndependentTime();
    },
    methods: {
        toggleIndependentTC() {
            this.independentTCEnabled = !this.independentTCEnabled;
            if (this.independentTCEnabled) {
                this.registerIndependentTimeOffsets();
            } else {
                this.destroyIndependentTime();
            }

            this.$emit('stateChanged', this.independentTCEnabled);
        },
        setTimeContext() {
            this.stopFollowingTimeContext();
            this.timeContext = this.openmct.time.getContextForView([this.domainObject]);
            this.timeContext.on('timeContext', this.setTimeContext);
            this.timeContext.on('clock', this.setTimeOptions);
        },
        stopFollowingTimeContext() {
            if (this.timeContext) {
                this.timeContext.off('timeContext', this.setTimeContext);
                this.timeContext.off('clock', this.setTimeOptions);
            }
        },
        setTimeOptions(clock) {
            this.timeOptions.clockOffsets = this.timeOptions.clockOffsets || this.timeContext.clockOffsets();
            this.timeOptions.fixedOffsets = this.timeOptions.fixedOffsets || this.timeContext.bounds();

            if (!this.timeOptions.mode) {
                this.mode = this.timeContext.clock() === undefined ? {key: 'fixed'} : {key: Object.create(this.timeContext.clock()).key};
                this.registerIndependentTimeOffsets();
            }
        },
        saveFixedOffsets(offsets) {
            const newOptions = Object.assign({}, this.timeOptions, {
                fixedOffsets: offsets
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
            this.$emit('updated', this.timeOptions);
        },
        registerIndependentTimeOffsets() {
            if (!this.timeOptions.mode) {
                return;
            }

            let offsets;

            if (this.isFixed) {
                offsets = this.timeOptions.fixedOffsets;
            } else {
                offsets = this.timeOptions.clockOffsets;
            }

            const key = this.openmct.objects.makeKeyString(this.domainObject.identifier);
            this.unregisterIndependentTime = this.openmct.time.addIndependentContext(key, offsets, this.isFixed ? undefined : this.mode.key);
        },
        destroyIndependentTime() {
            if (this.unregisterIndependentTime) {
                this.unregisterIndependentTime();
            }
        }
    }
};
</script>

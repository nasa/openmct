<!--
 Open MCT, Copyright (c) 2014-2021, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->

<template>
<div
    class="c-timer u-style-receiver js-style-receiver"
    :class="[`is-${timerState}`]"
>
    <div class="c-timer__controls">
        <button
            title="Reset"
            class="c-timer__ctrl-reset c-icon-button c-icon-button--major icon-reset"
            :class="[{'hide': timerState === 'stopped' }]"
            @click="restartTimer"
        ></button>
        <button :title="timerStateButtonText"
                class="c-timer__ctrl-pause-play c-icon-button c-icon-button--major"
                :class="[timerStateButtonIcon]"
                @click="toggleStateButton"
        ></button>
    </div>
    <div
        class="c-timer__direction"
        :class="[{'hide': !timerSign }, `icon-${timerSign}`]"
    ></div>
    <div class="c-timer__value">{{ timeTextValue || "--:--:--" }}</div>
</div>
</template>

<script>
import moment from 'moment';

export default {
    inject: ['openmct', 'currentView', 'objectPath'],
    props: {
        domainObject: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            timerState: 'started',
            lastTimestamp: null,
            relativeTimestamp: null,
            timerFormat: 'long',
            active: true
        };
    },
    computed: {
        configuration() {
            return this.domainObject.configuration;
        },
        timezone() {
            return this.configuration.timezone;
        },
        timeDelta() {
            return this.lastTimestamp - this.relativeTimestamp;
        },
        format() {
            let format;
            if (this.timerFormat === 'long') {
                format = 'd[D] HH:mm:ss';
            }

            if (this.timerFormat === 'short') {
                format = 'HH:mm:ss';
            }

            return format;
        },
        timeTextValue() {
            if (isNaN(this.timeDelta)) {
                return null;
            }

            const toWholeSeconds = Math.abs(Math.floor(this.timeDelta / 1000) * 1000);

            return moment.duration(toWholeSeconds, 'ms').format(this.format, { trim: false });
        },
        timerType() {
            let timerType = null;
            if (isNaN(this.timeDelta)) {
                return timerType;
            }

            if (this.timeDelta < 0) {
                timerType = 'countDown';
            } else if (this.timeDelta >= 1000) {
                timerType = 'countUp';
            }

            return timerType;
        },
        timerSign() {
            let timerSign = null;
            if (this.timerType === 'countUp') {
                timerSign = 'plus';
            } else if (this.timerType === 'countDown') {
                timerSign = 'minus';
            }

            return timerSign;
        },
        timerStateButtonText() {
            let buttonText = 'Pause';
            if (['paused', 'stopped'].includes(this.timerState)) {
                buttonText = 'Start';
            }

            return buttonText;
        },
        timerStateButtonIcon() {
            let buttonIcon = 'icon-pause';
            if (['paused', 'stopped'].includes(this.timerState)) {
                buttonIcon = 'icon-play';
            }

            return buttonIcon;
        }
    },
    mounted() {
        if (this.configuration) {
            console.log(this.configuration);
            const { timerState, timestamp, timerFormat, pausedTime } = this.configuration;
            this.timerState = timerState;

            if (timestamp) {
                this.relativeTimestamp = moment(timestamp).toDate();
            }

            this.timerFormat = timerFormat;

            if (pausedTime) {
                this.pausedTime = moment(pausedTime).toDate();
            }
        }

        this.openmct.objects.observe(this.domainObject, 'configuration', (changedConfiguration) => {
            const { timerState, timestamp, timerFormat, pausedTime } = changedConfiguration;
            if (timerState) {
                this.timerState = timerState;
            }

            if (pausedTime) {
                this.pausedTime = moment(pausedTime).toDate();
            } else {
                this.pausedTime = undefined;
            }

            if (timerFormat) {
                this.timerFormat = timerFormat;
            }

            if (timestamp) {
                this.relativeTimestamp = moment(timestamp).toDate();
            } else {
                this.relativeTimestamp = undefined;
            }

            console.log('timerState: ', timerState);
            console.log('pausedTime: ', pausedTime);
            console.log('timerFormat: ', timerFormat);
            console.log('timestamp: ', timestamp);
        });

        window.requestAnimationFrame(this.tick);
    },
    destroyed() {
        this.active = false;
    },
    methods: {
        tick() {
            const isTimerRunning = !['paused', 'stopped'].includes(this.timerState);
            if (isTimerRunning) {
                this.lastTimestamp = new Date();
            }

            if (this.timerState === undefined && this.domainObject) {
                const hasTimeStamp = this.configuration && this.configuration.timestamp;
                this.timerState = !hasTimeStamp ? 'stopped' : 'started';
            }

            if (this.timerState === 'paused' && !this.lastTimestamp) {
                const { pausedTime } = this.configuration;
                this.lastTimestamp = pausedTime;
            }

            if (this.active) {
                window.requestAnimationFrame(this.tick);
            }
        },
        restartTimer() {
            this.triggerAction('timer.restart');
        },
        toggleStateButton() {
            if (this.timerState === 'started') {
                this.triggerAction('timer.pause');
            } else if (['paused', 'stopped'].includes(this.timerState)) {
                this.triggerAction('timer.start');
            }
        },
        triggerAction(actionKey) {
            const action = this.openmct.actions.getAction(actionKey);
            action.invoke(this.objectPath, this.currentView);
        }
    }
};
</script>

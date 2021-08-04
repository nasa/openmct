<!--
 Open MCT, Copyright (c) 2014-2020, United States Government
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
<div class="c-clock l-time-display u-style-receiver js-style-receiver">
    <div class="c-clock__timezone">
        {{ timeZone }}
    </div>
    <div class="c-clock__value">
        {{ timeValue }}
    </div>
    <div class="c-clock__ampm">
        {{ timeAmPm }}
    </div>
</div>
</template>

<script>
import moment from 'moment';
import momentTimezone from 'moment-timezone';
import TickerService from './services/TickerService';

export default {
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            zoneName: null,
            use24: false,
            lastTimestamp: null,
            timeFormat: null,
            timeZoneAbbr: null,
            timeTextValue: null,
            timeAmPmValue: null,
            unlisten: null
        };
    },
    computed: {
        timeZone() {
            return this.timeZoneAbbr;
        },
        timeValue() {
            return this.timeTextValue;
        },
        timeAmPm() {
            return this.use24 ? '' : this.timeAmPmValue;
        },
        clockFormat() {
            return this.domainObject.clockFormat;
        },
        timezone() {
            return this.domainObject.timezone;
        },
        configuration() {
            return this.domainObject.configuration;
        }
    },
    watch: {
        clockFormat() {
            this.updateModel();
        },
        timezone() {
            this.updateModel();
        },
        configuration() {
            this.updateModel();
        }
    },
    mounted() {
        this.updateModel();
        this.unlisten = new TickerService(this.timeout, this.getDate).listen(this.tick);
    },
    beforeDestroy() {
        this.unlisten();
    },
    methods: {
        update() {
            const m = this.zoneName
                ? moment.utc(this.lastTimestamp).tz(this.zoneName) : moment.utc(this.lastTimestamp);
            this.timeZoneAbbr = m.zoneAbbr();
            this.timeTextValue = this.timeFormat && m.format(this.timeFormat);
            this.timeAmPmValue = m.format("A"); // Just the AM or PM part
        },
        updateModel() {
            let baseFormat;
            if (!this.domainObject) {
                return;
            }

            if (this.clockFormat
                && this.clockFormat.length > 0
                && this.timezone) {
                baseFormat = this.configuration[0] || this.clockFormat[0];

                this.use24 = (this.configuration[1] || this.clockFormat[1]) === 'clock24';
                this.timeFormat = this.use24
                    ? baseFormat.replace('hh', "HH") : baseFormat;
                // If wrong timezone is provided, the UTC will be used
                this.zoneName = momentTimezone.tz.names().includes(this.timezone)
                    ? this.timezone : "UTC";
                this.update();
            }
        },
        tick(timestamp) {
            this.lastTimestamp = timestamp;
            this.update();
        },
        timeout(fn, delay) {
            setTimeout(fn, delay);
        },
        getDate() {
            return Date.now();
        }
    }
};
</script>

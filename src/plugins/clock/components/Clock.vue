<!--
 Open MCT, Copyright (c) 2014-2023, United States Government
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
  <div class="u-contents">
    <div class="c-clock l-time-display u-style-receiver js-style-receiver">
      <div class="c-clock__timezone">
        {{ timeZoneAbbr }}
      </div>
      <div class="c-clock__value">
        {{ timeTextValue }}
      </div>
      <div class="c-clock__ampm">
        {{ timeAmPm }}
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import momentTimezone from 'moment-timezone';
import raf from 'utils/raf';

export default {
  inject: ['openmct', 'domainObject'],
  data() {
    return {
      configuration: this.domainObject.configuration,
      lastTimestamp: this.openmct.time.now()
    };
  },
  computed: {
    baseFormat() {
      return this.configuration.baseFormat;
    },
    use24() {
      return this.configuration.use24 === 'clock24';
    },
    timezone() {
      return this.configuration.timezone;
    },
    timeFormat() {
      return this.use24 ? this.baseFormat.replace('hh', 'HH') : this.baseFormat;
    },
    zoneName() {
      return momentTimezone.tz.names().includes(this.timezone) ? this.timezone : 'UTC';
    },
    momentTime() {
      return this.zoneName
        ? moment.utc(this.lastTimestamp).tz(this.zoneName)
        : moment.utc(this.lastTimestamp);
    },
    timeZoneAbbr() {
      return this.momentTime.zoneAbbr();
    },
    timeTextValue() {
      return this.timeFormat && this.momentTime.format(this.timeFormat);
    },
    timeAmPm() {
      return this.use24 ? '' : this.momentTime.format('A');
    }
  },
  mounted() {
    this.unobserve = this.openmct.objects.observe(
      this.domainObject,
      'configuration',
      (configuration) => {
        this.configuration = configuration;
      }
    );
    this.tick = raf(this.tick);
    this.openmct.time.on('tick', this.tick);
  },
  beforeUnmount() {
    if (this.unobserve) {
      this.unobserve();
    }

    this.openmct.time.off('tick', this.tick);
  },
  methods: {
    tick(timestamp) {
      this.lastTimestamp = timestamp;
    }
  }
};
</script>

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
<div class="c-indicator t-indicator-clock icon-clock no-minify c-indicator--not-clickable">
    <span class="label c-indicator__label">
        {{ timeTextValue }}
    </span>
</div>
</template>

<script>
import moment from 'moment';
import TickerService from '../services/TickerService';

export default {
    inject: ['openmct'],
    props: {
        indicatorFormat: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            timeTextValue: null,
            unlisten: null
        };
    },
    mounted() {
        console.log('mounted');
        console.log(this.indicatorFormat);
        this.unlisten = new TickerService(this.timeout, this.getDate).listen(this.tick);
    },
    beforeDestroy() {
        this.unlisten();
    },
    methods: {
        tick(timestamp) {
            this.timeTextValue = `${moment.utc(timestamp).format(this.indicatorFormat)} UTC`;
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

/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2018, United States Government
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
<span class="menus-up">
    <a class="ui-symbol icon icon-calendar" ref="calendarButton" @click="togglePicker($event)"></a>
    <div class="l-datetime-picker s-datetime-picker s-menu" v-if="showPicker" ref="popup">
        <div class="holder">
            <div class="l-month-year-pager">
                <a class="pager prev" ng-click="changeMonth(-1)"></a>
                <span class="val">{{model.month}} {{model.year}}</span>
                <a class="pager next" ng-click="changeMonth(1)"></a>
            </div>
            <div class="l-calendar">
                <ul class="l-cal-row l-header">
                    <li v-for="day in ['Su','Mo','Tu','We','Th','Fr','Sa']" :key="day">{{day}}</li>
                </ul>
                <ul class="l-cal-row l-body" v-for="(row, index) in table" :key="index">
                    <li v-for="(cell, index) in row"
                        :key="index"
                        @click="select(cell)"
                        :class='{ "in-month": isInCurrentMonth(cell), selected: isSelected(cell) }'>
                        <div class="prime">{{cell.day}}</div>
                        <div class="sub">{{cell.dayOfYear}}</div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</span>
</template>

<style lang="scss">
</style>

<script>
import moment from 'moment';

const TIME_NAMES = {
        'hours': "Hour",
        'minutes': "Minute",
        'seconds': "Second"
    };
const MONTHS = moment.months();
const TIME_OPTIONS = (function makeRanges() {
    let arr = [];
    while (arr.length < 60) {
        arr.push(arr.length);
    }
    return {
        hours: arr.slice(0, 24),
        minutes: arr,
        seconds: arr
    };
}());

export default {
    inject: ['openmct'],
    props: {
        defaultDateTime: String,
        formatter: Object
    },
    data: function () {
        return {
            showPicker: false,
            picker: {
                year: undefined,
                month: undefined,
                interacted: false
            },
            model: {
                year: undefined,
                month: undefined,
            },
            table: undefined,
            date: undefined,
            time: undefined
        }
    },
    methods: {
        generateTable() {
            let m = moment.utc({ year: this.picker.year, month: this.picker.month }).day(0),
                table = [],
                row,
                col;

            for (row = 0; row < 6; row += 1) {
                table.push([]);
                for (col = 0; col < 7; col += 1) {
                    table[row].push({
                        year: m.year(),
                        month: m.month(),
                        day: m.date(),
                        dayOfYear: m.dayOfYear()
                    });
                    m.add(1, 'days'); // Next day!
                }
            }

            return table;
        },

        updateViewForMonth() {
            this.model.month = MONTHS[this.picker.month];
            this.model.year = this.picker.year;
            this.table = this.generateTable();
        },

        updateFromModel(defaultDateTime) {
            let m;

            m = moment.utc(defaultDateTime);

            this.date = {
                year: m.year(),
                month: m.month(),
                day: m.date()
            };
            this.time = {
                hours: m.hour(),
                minutes: m.minute(),
                seconds: m.second()
            };

            // Zoom to that date in the picker, but
            // only if the user hasn't interacted with it yet.
            if (!this.picker.interacted) {
                this.picker.year = m.year();
                this.picker.month = m.month();
                this.updateViewForMonth();
            }
        },

        updateFromView() {
            let m = moment.utc({
                year: this.date.year,
                month: this.date.month,
                day: this.date.day,
                hour: this.time.hours,
                minute: this.time.minutes,
                second: this.time.seconds
            });
            this.$emit('date-selected', m.valueOf());
        },

        isInCurrentMonth(cell) {
            return cell.month === this.picker.month;
        },

        isSelected(cell) {
            let date = this.date || {};
            return cell.day === date.day &&
                cell.month === date.month &&
                cell.year === date.year;
        },

        select(cell) {
            this.date = this.date || {};
            this.date.month = cell.month;
            this.date.year = cell.year;
            this.date.day = cell.day;
            this.updateFromView();
        },

        dateEquals(d1, d2) {
            return d1.year === d2.year &&
                d1.month === d2.month &&
                d1.day === d2.day;
        },

        changeMonth(delta) {
            picker.month += delta;
            if (picker.month > 11) {
                picker.month = 0;
                picker.year += 1;
            }
            if (picker.month < 0) {
                picker.month = 11;
                picker.year -= 1;
            }
            this.picker.interacted = true;
            this.updateViewForMonth();
        },

        nameFor(key) {
            return TIME_NAMES[key];
        },

        optionsFor(key) {
            return TIME_OPTIONS[key];
        },

        hidePicker(event) {
            if (event.srcElement !== this.$refs.calendarButton){
                this.showPicker = false;
            }
        },
        
        togglePicker(event) {
            this.showPicker = !this.showPicker;

            if (this.showPicker) {
                document.addEventListener('click', this.hidePicker, {
                    capture: true,
                    once: true,
                    passive: true
                });
                this.$nextTick().then(this.setPopupPosition);
            }
        },

        setPopupPosition() {
            this.$refs.popup.style.bottom = this.$refs.popup.offsetHeight + 20 + 'px';
        }
    },
    mounted: function () {
        this.updateFromModel(this.defaultDateTime);
        this.updateViewForMonth();
    },
    destroyed: function () {
    }

}
</script>

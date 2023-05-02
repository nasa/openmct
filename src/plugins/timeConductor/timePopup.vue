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
<div
    class="c-tc-input-popup"
    :class="{'c-tc-input-popup--bottom' : bottom === true}"
    @keydown.enter.prevent
    @keyup.enter.prevent="submit"
    @keydown.esc.prevent
    @keyup.esc.prevent="hide"
    @click.stop
>
    <slot></slot>
    <div
        v-if="false"
    >
        <div class="c-tc-input-popup__options c-tc-input-popup__options--real-time">
            Buttons here
        </div>

        <div class="c-tc-input-popup__input-grid">
            <div class="pr-time-label icon-line-horz">Hrs</div>
            <div class="pr-time-label">Mins</div>
            <div class="pr-time-label">Secs</div>
            <div class="pr-time-label"></div>
            <div class="pr-time-label icon-plus">Hrs</div>
            <div class="pr-time-label">Mins</div>
            <div class="pr-time-label">Secs</div>
            <div class="pr-time-label"></div>

            <div class="pr-time-input">
                <input
                    ref="inputHrs"
                    v-model="inputHrs"
                    class="pr-time-input__hrs"
                    step="1"
                    type="number"
                    min="0"
                    max="23"
                    title="Enter 0 - 23"
                    @change="validate()"
                    @keyup="validate()"
                    @focusin="selectAll($event)"
                    @focusout="format('inputHrs')"
                    @wheel="increment($event, 'inputHrs')"
                >
                :
            </div>
            <div class="pr-time-input">
                <input
                    ref="inputMins"
                    v-model="inputMins"
                    type="number"
                    class="pr-time-input__mins"
                    min="0"
                    max="59"
                    title="Enter 0 - 59"
                    step="1"
                    @change="validate()"
                    @keyup="validate()"
                    @focusin="selectAll($event)"
                    @focusout="format('inputMins')"
                    @wheel="increment($event, 'inputMins')"
                >
                :
            </div>
            <div class="pr-time-input">
                <input
                    ref="inputSecs"
                    v-model="inputSecs"
                    type="number"
                    class="pr-time-input__secs"
                    min="0"
                    max="59"
                    title="Enter 0 - 59"
                    step="1"
                    @change="validate()"
                    @keyup="validate()"
                    @focusin="selectAll($event)"
                    @focusout="format('inputSecs')"
                    @wheel="increment($event, 'inputSecs')"
                >
            </div>

            <div class="pr-time-input pr-time-input__start-end-sep icon-arrows-right-left"></div>

            <div class="pr-time-input">
                <input
                    ref="inputHrs"
                    v-model="inputHrs"
                    class="pr-time-input__hrs"
                    step="1"
                    type="number"
                    min="0"
                    max="23"
                    title="Enter 0 - 23"
                    @change="validate()"
                    @keyup="validate()"
                    @focusin="selectAll($event)"
                    @focusout="format('inputHrs')"
                    @wheel="increment($event, 'inputHrs')"
                >
                :
            </div>
            <div class="pr-time-input">
                <input
                    ref="inputMins"
                    v-model="inputMins"
                    type="number"
                    class="pr-time-input__mins"
                    min="0"
                    max="59"
                    title="Enter 0 - 59"
                    step="1"
                    @change="validate()"
                    @keyup="validate()"
                    @focusin="selectAll($event)"
                    @focusout="format('inputMins')"
                    @wheel="increment($event, 'inputMins')"
                >
                :
            </div>
            <div class="pr-time-input pr-time-input--buttons">
                <input
                    ref="inputSecs"
                    v-model="inputSecs"
                    type="number"
                    class="pr-time-input__secs"
                    min="0"
                    max="59"
                    title="Enter 0 - 59"
                    step="1"
                    @change="validate()"
                    @keyup="validate()"
                    @focusin="selectAll($event)"
                    @focusout="format('inputSecs')"
                    @wheel="increment($event, 'inputSecs')"
                >
            </div>

            <div class="pr-time-input pr-time-input--buttons">
                <button
                    class="c-button c-button--major icon-check"
                    :disabled="isDisabled"
                    @click.prevent="submit"
                ></button>
                <button
                    class="c-button icon-x"
                    @click.prevent="hide"
                ></button>
            </div>
        </div>
    </div>
</div>
</template>

<script>

import { REALTIME_MODE_KEY } from '../../api/time/constants';

export default {
    props: {
        bottom: {
            type: Boolean,
            default() {
                return false;
            }
        }
    },
    data() {
        return {
            inputHrs: '00',
            inputMins: '00',
            inputSecs: '00',
            isDisabled: false
        };
    },
    computed: {
        isRealtime() {
            return this.mode.indexOf(REALTIME_MODE_KEY) !== -1;
        }
    },
    mounted() {
        this.setOffset();
        document.addEventListener('click', this.hide);
    },
    beforeDestroy() {
        document.removeEventListener('click', this.hide);
    },
    methods: {
        format(ref) {
            const curVal = this[ref];
            this[ref] = curVal.padStart(2, '0');
        },
        validate() {
            let disabled = false;
            let refs = ['inputHrs', 'inputMins', 'inputSecs'];

            for (let ref of refs) {
                let min = Number(this.$refs[ref].min);
                let max = Number(this.$refs[ref].max);
                let value = Number(this.$refs[ref].value);

                if (value > max || value < min) {
                    disabled = true;
                    break;
                }
            }

            this.isDisabled = disabled;
        },
        submit() {
            this.$emit('update', {
                type: this.type,
                hours: this.inputHrs,
                minutes: this.inputMins,
                seconds: this.inputSecs
            });
        },
        hide() {
            this.$emit('hide');
        },
        increment($ev, ref) {
            $ev.preventDefault();
            const step = (ref === 'inputHrs') ? 1 : 5;
            const maxVal = (ref === 'inputHrs') ? 23 : 59;
            let cv = Math.round(parseInt(this[ref], 10) / step) * step;
            cv = Math.min(maxVal, Math.max(0, ($ev.deltaY < 0) ? cv + step : cv - step));
            this[ref] = cv.toString().padStart(2, '0');
            this.validate();
        },
        setOffset() {
            [this.inputHrs, this.inputMins, this.inputSecs] = this.offset.split(':');
            this.numberSelect('inputHrs');
        },
        numberSelect(input) {
            this.$refs[input].focus();

            // change to text, select, then change back to number
            // number inputs do not support select()
            this.$nextTick(() => {
                this.$refs[input].setAttribute('type', 'text');
                this.$refs[input].select();

                this.$nextTick(() => {
                    this.$refs[input].setAttribute('type', 'number');
                });
            });
        },
        selectAll($ev) {
            $ev.target.select();
        }
    }
};
</script>

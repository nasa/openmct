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
    <div class="c-tc-input-popup__options c-tc-input-popup__options--real-time">
        <button class="c-button c-button--menu icon-clock">
            <span class="c-button__label">Local Clock</span>
        </button>

        <button class="c-button c-button--menu">
            <span class="c-button__label">UTC</span>
        </button>

        <button class="c-button c-button--menu icon-history">
            <span class="c-button__label">History</span>
        </button>
    </div>

    <div class="c-tc-input-popup__input-grid">
        <div class="pr-time-label icon-minus">Hrs</div>
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
            <b>:</b>
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
            <b>:</b>
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
            <b>:</b>
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
            <b>:</b>
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
</template>

<script>
export default {
    props: {
        bottom: {
            type: Boolean,
            default() {
                return false;
            }
        },
        type: {
            type: String,
            required: true
        },
        offset: {
            type: String,
            required: true
        },
        mode: {
            type: String,
            required: true
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
            return this.mode.indexOf('realtime') !== -1;
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

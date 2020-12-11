<template>
<div
    class="pr-tc-input-menu"
    @keydown.enter.prevent
    @keyup.enter.prevent="submit"
    @click.stop=""
>
    <div class="pr-tim-labels">
        <div class="pr-time-label__hrs">Hrs</div>
        <div class="pr-time-label__mins">Mins</div>
        <div class="pr-time-label__secs">Secs</div>
    </div>
    <div class="pr-tim-inputs">
        <input
            ref="inputHrs"
            v-model="inputHrs"
            class="pr-time-input__hrs"
            step="1"
            type="number"
            min="0"
            max="999"
            @focusin="selectAll($event)"
            @focusout="format('inputHrs')"
            @wheel="increment($event, 'inputHrs')"
        >
        <span class="pr-tim-colon">:</span>
        <input
            ref="inputMins"
            v-model="inputMins"
            type="number"
            class="pr-time-input__mins"
            min="0"
            max="59"
            step="1"
            @focusin="selectAll($event)"
            @focusout="format('inputMins')"
            @wheel="increment($event, 'inputMins')"
        >
        <span class="pr-tim-colon">:</span>
        <input
            ref="inputSecs"
            v-model="inputSecs"
            type="number"
            class="pr-time-input__secs"
            min="0"
            max="59"
            step="1"
            @focusin="selectAll($event)"
            @focusout="format('inputSecs')"
            @wheel="increment($event, 'inputSecs')"
        >
    </div>
    <div class="pr-tim__buttons c-button-set c-button-set--strip-h">
        <button class="c-button icon-check"
                @click.prevent="submit"
        ></button>
        <button class="c-button icon-x"
                @click.prevent="hide"
        ></button>
    </div>
</div>
</template>

<script>

export default {
    props: {
        type: {
            type: String,
            required: true
        },
        offset: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            inputHrs: '000',
            inputMins: '00',
            inputSecs: '00'
        };
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
            const padAmt = (ref === 'inputHrs') ? 3 : 2;
            this[ref] = curVal.padStart(padAmt, '0');
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
            const padAmt = (ref === 'inputHrs') ? 3 : 2;
            const step = (ref === 'inputHrs') ? 1 : 5;
            const maxVal = (ref === 'inputHrs') ? 999 : 59;
            let cv = Math.round(parseInt(this[ref], 10) / step) * step;
            cv = Math.min(maxVal, Math.max(0, ($ev.deltaY < 0) ? cv + step : cv - step));
            this[ref] = cv.toString().padStart(padAmt, '0');
        },
        setOffset() {
            [this.inputHrs, this.inputMins, this.inputSecs] = this.offset.split(':');
            this.inputHrs = this.inputHrs.padStart(3, '0');
            this.$refs.inputHrs.focus();
        },
        selectAll($ev) {
            $ev.target.select();
        }
    }
};
</script>

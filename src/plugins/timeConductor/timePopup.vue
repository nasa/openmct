<template>
<div class="pr-tc-input-menu">
    <div class="pr-tim-labels">
        <div class="pr-time-label__hrs">Hrs</div>
        <div class="pr-time-label__mins">Mins</div>
        <div class="pr-time-label__secs">Secs</div>
    </div>
    <div class="pr-tim-inputs">
        <input
            ref="inputHrs"
            class="pr-time-input__hrs"
            step="1"
            type="number"
            value="000"
            min="0"
            max="999"
            @focusin="selectAll($event)"
            @focusout="format('inputHrs')"
            @wheel="increment('inputHrs')"
        >
        <span class="pr-tim-colon">:</span>
        <input
            ref="inputMins"
            type="number"
            class="pr-time-input__mins"
            value="00"
            min="0"
            max="59"
            step="1"
            @focusin="selectAll($event)"
            @focusout="format('inputMins')"
            @wheel="increment('inputMins')"
        >
        <span class="pr-tim-colon">:</span>
        <input
            ref="inputSecs"
            type="number"
            class="pr-time-input__secs"
            value="00"
            min="0"
            max="59"
            step="1"
            @focusin="selectAll($event)"
            @focusout="format('inputSecs')"
            @wheel="increment('inputSecs')"
        >
    </div>
    <div class="pr-tim__buttons c-button-set c-button-set--strip-h">
        <button class="c-button icon-check"
                @click="hide"
        ></button>
        <button class="c-button icon-x"
                @click="hide"
        ></button>
    </div>
</div>
</template>

<script>
export default {
    name: "PrTimePopupVue",
    methods: {
        format(ref) {
            const currentInput = this.$refs[ref];
            const curVal = currentInput.value;
            const padAmt = (ref === 'inputHrs') ? 3 : 2;
            // console.log(currentInput);
            currentInput.value = curVal.padStart(padAmt, '0');
        },
        hide() {
            this.$emit('hide');
        },
        increment(ref) {
            const currentInput = this.$refs[ref];
            // console.log(currentInput);
            // console.log('increment');
        },
        selectAll($ev) {
            $ev.target.select();
        }
    }
};
</script>

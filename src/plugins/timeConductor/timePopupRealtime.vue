<template>
  <form ref="deltaInput">
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
          ref="startInputHrs"
          v-model="startInputHrs"
          class="pr-time-input__hrs"
          step="1"
          type="number"
          min="0"
          max="23"
          title="Enter 0 - 23"
          aria-label="Start offset hours"
          @change="validate()"
          @keyup="validate()"
          @focusin="selectAll($event)"
          @focusout="format('startInputHrs')"
          @wheel="increment($event, 'startInputHrs')"
        />
        <b>:</b>
      </div>
      <div class="pr-time-input">
        <input
          ref="startInputMins"
          v-model="startInputMins"
          type="number"
          class="pr-time-input__mins"
          min="0"
          max="59"
          title="Enter 0 - 59"
          step="1"
          aria-label="Start offset minutes"
          @change="validate()"
          @keyup="validate()"
          @focusin="selectAll($event)"
          @focusout="format('startInputMins')"
          @wheel="increment($event, 'startInputMins')"
        />
        <b>:</b>
      </div>
      <div class="pr-time-input">
        <input
          ref="startInputSecs"
          v-model="startInputSecs"
          type="number"
          class="pr-time-input__secs"
          min="0"
          max="59"
          title="Enter 0 - 59"
          step="1"
          aria-label="Start offset seconds"
          @change="validate()"
          @keyup="validate()"
          @focusin="selectAll($event)"
          @focusout="format('startInputSecs')"
          @wheel="increment($event, 'startInputSecs')"
        />
      </div>

      <div class="pr-time-input pr-time-input__start-end-sep icon-arrows-right-left"></div>

      <div class="pr-time-input">
        <input
          ref="endInputHrs"
          v-model="endInputHrs"
          class="pr-time-input__hrs"
          step="1"
          type="number"
          min="0"
          max="23"
          title="Enter 0 - 23"
          aria-label="End offset hours"
          @change="validate()"
          @keyup="validate()"
          @focusin="selectAll($event)"
          @focusout="format('endInputHrs')"
          @wheel="increment($event, 'endInputHrs')"
        />
        <b>:</b>
      </div>
      <div class="pr-time-input">
        <input
          ref="endInputMins"
          v-model="endInputMins"
          type="number"
          class="pr-time-input__mins"
          min="0"
          max="59"
          title="Enter 0 - 59"
          step="1"
          @change="validate()"
          @keyup="validate()"
          @focusin="selectAll($event)"
          @focusout="format('endInputMins')"
          @wheel="increment($event, 'endInputMins')"
        />
        <b>:</b>
      </div>
      <div class="pr-time-input">
        <input
          ref="endInputSecs"
          v-model="endInputSecs"
          type="number"
          class="pr-time-input__secs"
          min="0"
          max="59"
          title="Enter 0 - 59"
          step="1"
          aria-label="End offset seconds"
          @change="validate()"
          @keyup="validate()"
          @focusin="selectAll($event)"
          @focusout="format('endInputSecs')"
          @wheel="increment($event, 'endInputSecs')"
        />
      </div>

      <div class="pr-time-input pr-time-input--buttons">
        <button
          class="c-button c-button--major icon-check"
          :disabled="isDisabled"
          aria-label="Submit time offsets"
          @click.prevent="submit"
        ></button>
        <button
          class="c-button icon-x"
          aria-label="Discard time offsets"
          @click.prevent="hide"
        ></button>
      </div>
    </div>
  </form>
</template>

<script>
export default {
  props: {
    offsets: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      startInputHrs: '00',
      startInputMins: '00',
      startInputSecs: '00',
      endInputHrs: '00',
      endInputMins: '00',
      endInputSecs: '00',
      isDisabled: false
    };
  },
  watch: {
    offsets: {
      handler() {
        this.setOffsets();
      },
      deep: true
    }
  },
  mounted() {
    this.setOffsets();
    document.addEventListener('click', this.hide);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.hide);
  },
  methods: {
    format(ref) {
      const curVal = this[ref];
      this[ref] = curVal.toString().padStart(2, '0');
    },
    validate() {
      let disabled = false;
      let refs = [
        'startInputHrs',
        'startInputMins',
        'startInputSecs',
        'endInputHrs',
        'endInputMins',
        'endInputSecs'
      ];

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
        start: {
          hours: this.startInputHrs,
          minutes: this.startInputMins,
          seconds: this.startInputSecs
        },
        end: {
          hours: this.endInputHrs,
          minutes: this.endInputMins,
          seconds: this.endInputSecs
        }
      });
      this.$emit('dismiss');
    },
    hide($event) {
      if ($event.target.className.indexOf('c-button icon-x') > -1) {
        this.$emit('dismiss');
      }
    },
    increment($ev, ref) {
      $ev.preventDefault();
      const step = ref === 'startInputHrs' || ref === 'endInputHrs' ? 1 : 5;
      const maxVal = ref === 'startInputHrs' || ref === 'endInputHrs' ? 23 : 59;
      let cv = Math.round(parseInt(this[ref], 10) / step) * step;
      cv = Math.min(maxVal, Math.max(0, $ev.deltaY < 0 ? cv + step : cv - step));
      this[ref] = cv.toString().padStart(2, '0');
      this.validate();
    },
    setOffsets() {
      [this.startInputHrs, this.startInputMins, this.startInputSecs] =
        this.offsets.start.split(':');
      [this.endInputHrs, this.endInputMins, this.endInputSecs] = this.offsets.end.split(':');
      this.$nextTick(() => {
        this.numberSelect('startInputHrs');
      });
    },
    numberSelect(input) {
      if (this.$refs[input] === undefined || this.$refs[input] === null) {
        return;
      }
      this.$refs[input].focus();
      this.$refs[input].select();
    },
    selectAll($ev) {
      $ev.target.select();
    }
  }
};
</script>

<template>
  <div
    aria-label="Clock Indicator"
    class="c-indicator t-indicator-clock icon-clock no-minify c-indicator--not-clickable"
    role="complementary"
    aria-live="off"
  >
    <span class="label c-indicator__label">
      {{ timeTextValue }}
    </span>
  </div>

  <div
    aria-label="Toggle Clock Format"
    class="c-indicator t-indicator-timer icon-timer no-minify c-indicator--clickable c-icon-button"
    role="button"
    aria-live="off"
    tabindex="0"
    @click="toggleTimeStandard"
    @keydown.enter="toggleTimeStandard"
  >
    <span class="label c-indicator__label">
      {{ timeStandard === 'UTC' ? 'LT' : 'UTC' }}
    </span>
  </div>
</template>

<script>
import moment from 'moment';
import raf from 'utils/raf';

export default {
  inject: ['openmct'],
  props: {
    indicatorFormat: {
      type: String,
      default: 'YYYY/MM/DD HH:mm:ss'
    }
  },
  data() {
    const clock = this.openmct.time.getClock();
    return {
      timestamp: clock ? this.openmct.time.now() : undefined,
      timeStandard: 'UTC' // default to UTC, can start with LT if preferred
    };
  },
  computed: {
    timeTextValue() {
      const format = this.indicatorFormat;
      const timeSystemName = this.timeStandard === 'LT' ? 'LT' : 'UTC';

      if (this.timeStandard === 'LT') {
        return `${moment(this.timestamp).format(format)} ${timeSystemName}`;
      } else {
        return `${moment.utc(this.timestamp).format(format)} ${timeSystemName}`;
      }
    }
  },
  mounted() {
    this.tick = raf(this.tick);
    this.openmct.time.on('tick', this.tick);
    this.tick(this.openmct.time.now());
  },
  beforeUnmount() {
    this.openmct.time.off('tick', this.tick);
  },
  methods: {
    tick(now) {
      this.timestamp = now;
    },
    toggleTimeStandard() {
      this.timeStandard = this.timeStandard === 'UTC' ? 'LT' : 'UTC';
    }
  }
};
</script>

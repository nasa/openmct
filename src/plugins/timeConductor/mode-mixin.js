import { FIXED_MODE_KEY, REALTIME_MODE_KEY } from '../../api/time/constants';

export default {
  props: {
    buttonCssClass: {
      type: String,
      required: false,
      default() {
        return '';
      }
    }
  },
  methods: {
    loadModes() {
      this.modes = [FIXED_MODE_KEY, REALTIME_MODE_KEY].map(this.getModeMetadata);
    },
    loadClocks(menuOptions) {
      let clocks;

      if (menuOptions) {
        clocks = menuOptions
          .map((menuOption) => menuOption.clock)
          .filter(isDefinedAndUnique)
          .map(this.getClock);
      }

      this.clocks = clocks.map(this.getClockMetadata);

      function isDefinedAndUnique(key, index, array) {
        return key !== undefined && array.indexOf(key) === index;
      }
    },
    getActiveClock() {
      const activeClock = this.openmct.time.getClock();

      //Create copy of active clock so the time API does not get reactified.
      return Object.create(activeClock);
    },
    getClock(key) {
      return this.openmct.time.getAllClocks().find((clock) => clock.key === key);
    },
    getModeMetadata(mode, testIds = false) {
      let modeOptions;
      const key = mode;

      if (key === FIXED_MODE_KEY) {
        modeOptions = {
          key,
          name: 'Fixed Timespan',
          description: 'Query and explore data that falls between two fixed datetimes.',
          cssClass: 'icon-tabular',
          onItemClicked: () => this.setMode(key)
        };

        if (testIds) {
          modeOptions.testId = 'conductor-modeOption-fixed';
        }
      } else {
        modeOptions = {
          key,
          name: 'Real-Time',
          description:
            'Monitor streaming data in real-time. The Time Conductor and displays will automatically advance themselves based on the active clock.',
          cssClass: 'icon-clock',
          onItemClicked: () => this.setMode(key)
        };

        if (testIds) {
          modeOptions.testId = 'conductor-modeOption-realtime';
        }
      }

      return modeOptions;
    },
    getClockMetadata(clock) {
      const key = clock.key;
      const clockOptions = {
        key,
        name: clock.name,
        description:
          'Monitor streaming data in real-time. The Time ' +
          'Conductor and displays will automatically advance themselves based on this clock. ' +
          clock.description,
        cssClass: clock.cssClass || 'icon-clock',
        onItemClicked: () => this.setClock(key)
      };

      return clockOptions;
    }
  }
};

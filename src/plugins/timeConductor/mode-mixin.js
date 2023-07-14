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
    }
  }
};

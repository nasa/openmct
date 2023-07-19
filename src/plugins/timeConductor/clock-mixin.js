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
    loadClocks(menuOptions) {
      let clocks;

      if (menuOptions) {
        clocks = menuOptions
          .map((menuOption) => menuOption.clock)
          .filter(isDefinedAndUnique)
          .map(this.getClock);
      } else {
        clocks = this.openmct.time.getAllClocks();
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
    getClockMetadata(clock) {
      const key = clock.key;
      const clockOptions = {
        key,
        name: clock.name,
        description: 'Uses the system clock as the current time basis. ' + clock.description,
        cssClass: clock.cssClass || 'icon-clock',
        onItemClicked: () => this.setClock(key)
      };

      return clockOptions;
    }
  }
};

export default {
    destroyed: function () {
        this.stopFollowTimeConductor();
    },
    methods: {
        followTimeConductor() {
            this.openmct.time.on('clock', this.setViewFromClock);
        },
        stopFollowTimeConductor() {
            this.openmct.time.off('clock', this.setViewFromClock);
        },
        loadClocks(menuOptions) {
            const clocks = menuOptions
                .map(menuOption => menuOption.clock)
                .filter(isDefinedAndUnique)
                .map(this.getClock);

            /*
         * Populate the modes menu with metadata from the available clocks
         * "Fixed Mode" is always first, and has no defined clock
         */
            this.modes = [undefined]
                .concat(clocks)
                .map(this.getModeOptionForClock);

            function isDefinedAndUnique(key, index, array) {
                return key !== undefined && array.indexOf(key) === index;
            }
        },
        getClock(key) {
            return this.openmct.time.getAllClocks().filter(function (clock) {
                return clock.key === key;
            })[0];
        },
        getModeOptionForClock(clock, testIds = false) {
            let modeOptions;

            if (clock === undefined) {
                const key = 'fixed';

                modeOptions = {
                    key,
                    name: 'Fixed Timespan',
                    description: 'Query and explore data that falls between two fixed datetimes.',
                    cssClass: 'icon-tabular',
                    onItemClicked: () => this.setOption(key)
                };

                if (testIds) {
                    modeOptions.testId = 'conductor-modeOption-fixed';
                }
            } else {
                const key = clock.key;

                modeOptions = {
                    key,
                    name: clock.name,
                    description: "Monitor streaming data in real-time. The Time "
                    + "Conductor and displays will automatically advance themselves based on this clock. " + clock.description,
                    cssClass: clock.cssClass || 'icon-clock',
                    onItemClicked: () => this.setOption(key)
                };

                if (testIds) {
                    modeOptions.testId = 'conductor-modeOption-realtime';
                }
            }

            return modeOptions;
        },
    }
};

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
        loadModesAndClocks(menuOptions) {
            const clocks = menuOptions
                .map(menuOption => menuOption.clock)
                .filter(isDefinedAndUnique)
                .map(this.getClock);

            /*
            * Populate the modes menu with metadata from the available clocks
            * "Fixed Mode" is always first, and has no defined clock
            */
            this.modes = ['fixed', 'real-time'].map(this.getModeMetadata);
            this.clocks = clocks.map(this.getClockMetadata);

            function isDefinedAndUnique(key, index, array) {
                return key !== undefined && array.indexOf(key) === index;
            }
        },
        getActiveClock() {
            let activeClock = this.openmct.time.clock();
            if (activeClock !== undefined) {
                //Create copy of active clock so the time API does not get reactified.
                activeClock = Object.create(activeClock);
            }

            return activeClock;
        },
        getClock(key) {
            return this.openmct.time.getAllClocks().find(clock => clock.key === key);
        },
        getModeMetadata(mode, testIds = false) {
            let modeOptions;

            if (mode === undefined) {
                const key = 'fixed';

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
                const key = 'real-time';

                modeOptions = {
                    key,
                    name: 'Real-Time',
                    description: 'Monitor streaming data in real-time. The Time Conductor and displays will automatically advance themselves based on the active clock.',
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
                description: "Monitor streaming data in real-time. The Time "
                + "Conductor and displays will automatically advance themselves based on this clock. " + clock.description,
                cssClass: clock.cssClass || 'icon-clock',
                onItemClicked: () => this.setClock(key)
            };

            // console.log(clockOptions)
            return clockOptions;
        }
    }
};

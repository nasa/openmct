<template>
<span>
    <div class="s-menu-button">
		<span class="title-label">{{ngModel.selected.name}}</span>
    </div>
    <div class="menu super-menu mini l-mode-selector-menu"
         ng-show="modeController.isActive()">
        <div class="w-menu">
            <div class="col menu-items">
                <ul>
                    <li ng-repeat="metadata in options"
                        ng-click="select(metadata)">
                        <a ng-mouseover="activeMetadata = metadata"
                        ng-mouseleave="activeMetadata = undefined"
                        class="menu-item-a"
                        :class="metadata.cssClass">
                            {{metadata.name}}
                        </a>
                    </li>
                </ul>
            </div>
            <div class="col menu-item-description">
                <div class="desc-area ui-symbol icon type-icon" :class="activeMetadata.cssClass"></div>
                <div class="w-title-desc">
                    <div class="desc-area title">
                        {{activeMetadata.name}}
                    </div>
                    <div class="desc-area description">
                        {{activeMetadata.description}}
                    </div>
                </div>
            </div>
        </div>
    </div>
</span>
</template>

<style lang="scss">
</style>

<script>
export default {
    inject: ['openmct', 'configuration'],
    data: function () {
        return {
            options: [],
            timeSystemsForClocks: {}
        };
    },
    methods: {
        buildOptionsFromConfiguration: function () {
            /*
             * "Fixed Mode" is always the first available option.
             */
            this.options = [{
                key: 'fixed',
                name: 'Fixed Timespan Mode',
                description: 'Query and explore data that falls between two fixed datetimes.',
                cssClass: 'icon-calendar'
            }];
            let clocks = {};

            (config.menuOptions || []).forEach(menuOption => {
                let clockKey = menuOption.clock || 'fixed';
                let clock = this.getClock(clockKey);

                if (clock !== undefined) {
                    clocks[clock.key] = clock;
                }

                let timeSystem = this.timeSystems[menuOption.timeSystem];
                if (timeSystem !== undefined) {
                    this.timeSystemsForClocks[clockKey] = this.timeSystemsForClocks[clockKey] || [];
                    this.timeSystemsForClocks[clockKey].push(timeSystem);
                }
            });

            /*
             * Populate the clocks menu with metadata from the available clocks
             */
            Object.values(clocks).forEach(clock => {
                this.options.push({
                    key: clock.key,
                    name: clock.name,
                    description: "Monitor streaming data in real-time. The Time " +
                    "Conductor and displays will automatically advance themselves based on this clock. " + clock.description,
                    cssClass: clock.cssClass || 'icon-clock',
                    clock: clock
                });
            });
        },

        getClock: function (key) {
            return this.timeAPI.getAllClocks().filter(function (clock) {
                return clock.key === key;
            })[0];
        }
    },
    mounted: function () {
        this.buildOptionsFromConfiguration();
        this.setTimeSystem(this.openmct.time.timeSystem());
        this.openmct.time.on('timeSystem', this.setTimeSystem);
    },
    destroyed: function () {
        this.openmct.time.off('timeSystem', this.setTimeSystem);
    }

}
</script>



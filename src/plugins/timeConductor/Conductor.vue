<template>
<!-- Parent holder for time conductor. follow-mode | fixed-mode -->
<div class="holder grows flex-elem l-flex-row l-time-conductor" 
    :class="[isFixed ? 'fixed-mode' : 'realtime-mode', panning ? 'status-panning' : '']">
    <div class="flex-elem holder time-conductor-icon">
        <div class="hand-little"></div>
        <div class="hand-big"></div>
    </div>

    <div class="flex-elem holder grows l-flex-col l-time-conductor-inner">
        <!-- Holds inputs and ticks -->
        <div class="l-time-conductor-inputs-and-ticks l-row-elem flex-elem no-margin">
            <form class="l-time-conductor-inputs-holder"
                  @submit="isFixed ? setBoundsFromView(boundsModel) : setOffsetsFromView(boundsModel)">
                <span class="l-time-range-w start-w">
                    <span class="l-time-conductor-inputs">
                        <span class="l-time-range-input-w start-date">
                            <span class="title"></span>
                            <input type="text" :value="boundsModel.start">
                        </span>
                            <span class="l-time-range-input-w time-delta start-delta"
                              :class="{'hide': isFixed}">
                                -
                            <input type="text" :value="boundsModel.startOffset" @blur="setOffsetsFromView(boundsModel)">
                        </span>
                    </span>
                </span>
                <span class="l-time-range-w end-w">
                    <span class="l-time-conductor-inputs">
                        <span class="l-time-range-input-w end-date">
                            <span class="title"></span>
                            <input type="text" :value="boundsModel.end" @blur="setBoundsFromView(boundsModel)">
                        </span>
                        <span class="l-time-range-input-w time-delta end-delta"
                              :class="{'hide': isFixed}">
                                +
                            <input type="text" :value="boundsModel.endOffset">
                        </span>
                    </span>
                </span>
                <input type="submit" class="invisible">
            </form>
            <div>Axis goes here</div>
        </div>

        <!-- Holds time system and session selectors, and zoom control -->
        <div class="l-time-conductor-controls l-row-elem l-flex-row flex-elem">
            <div>Mode selector</div>
            <button>Menu Button</button>
            <!-- Zoom control -->
            <div v-if="zoom"
                 class="l-time-conductor-zoom-w grows flex-elem l-flex-row">
                {{currentZoom}}
                <span class="time-conductor-zoom-current-range flex-elem flex-fixed holder">{{timeUnits}}</span>
                <input class="time-conductor-zoom flex-elem" type="range"
                       @mouseUp="onZoomStop(currentZoom)"
                       @change="onZoom(currentZoom)"
                       min="0.01"
                       step="0.01"
                       max="0.99" />
            </div>
        </div>

    </div>
</div>
</template>

<style lang="scss">
</style>

<script>
export default {
    inject: ['openmct', 'configuration'],
    data: function () {
        let bounds = this.openmct.time.bounds();
        let offsets = this.openmct.time.clockOffsets();
        let timeSystem = this.openmct.time.timeSystem();
        let formatter = this.openmct.telemetry.getValueFormatter({
            format: timeSystem.timeFormat
        });

        return {
            timeFormatter: formatter,
            boundsModel: {
                start: formatter.format(bounds.start),
                startOffset: offsets.start,
                end: formatter.format(bounds.end),
                endOffset: offsets.end
            },
            isFixed: this.openmct.time.clock() === undefined,
            panning: false,
            currentZoom: undefined,
            zoom: false
        }
    },
    methods: {
        onBoundsChange: function (bounds) {
            this.boundsModel.start = this.timeFormatter.format(bounds.start);
            this.boundsModel.end = this.timeFormatter.format(bounds.end);
        },
        onTimeSystemChange: function (timeSystem) {
            this.timeFormatter = this.openmct.telemetry.getValueFormatter({
                format: timeSystem.timeFormat
            });
        },
        formatTime: function (time) {
            let timeSystem = this.openmct.time.timeSystem();
            let formatter = this.openmct.telemetry.getValueFormatter({
                format: timeSystem.timeFormat
            });
            return formatter.format(time);
        }
    },
    mounted: function () {
        this.openmct.time.on('bounds', this.onBoundsChange);
        this.openmct.time.on('timeSystem', this.onTimeSystemChange);

        this.onTimeSystemChange(this.openmct.time.timeSystem());
    },
    destroyed: function () {
        this.openmct.time.off('bounds', this.onBoundsChange);
        this.openmct.time.off('timeSystem', this.onTimeSystemChange);
    }

}
</script>



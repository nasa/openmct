<template>
<div
    class="c-compass__hud c-hud"
    :style="skewCompassHUDStyle"
>
    <div
        v-for="point in visibleCompassPoints"
        :key="point.direction"
        :class="point.class"
        :style="point.style"
    >
        {{ point.direction }}
    </div>
    <div
        v-if="isSunInRange"
        ref="sun"
        class="c-hud__sun"
        :style="sunPositionStyle"
    ></div>
    <div class="c-hud__range"></div>
</div>
</template>

<script>
import {
    normalizeDegrees,
    inRange,
    percentOfRange
} from './utils';

const COMPASS_POINTS = [
    {
        direction: 'N',
        class: 'c-hud__dir',
        degrees: 0
    },
    {
        direction: 'NE',
        class: 'c-hud__dir--sub',
        degrees: 45
    },
    {
        direction: 'E',
        class: 'c-hud__dir',
        degrees: 90
    },
    {
        direction: 'SE',
        class: 'c-hud__dir--sub',
        degrees: 135
    },
    {
        direction: 'S',
        class: 'c-hud__dir',
        degrees: 180
    },
    {
        direction: 'SW',
        class: 'c-hud__dir--sub',
        degrees: 225
    },
    {
        direction: 'W',
        class: 'c-hud__dir',
        degrees: 270
    },
    {
        direction: 'NW',
        class: 'c-hud__dir--sub',
        degrees: 315
    }
];

export default {
    props: {
        roverHeading: {
            type: Number,
            required: true
        },
        roverRoll: {
            type: Number,
            default: undefined
        },
        sunHeading: {
            type: Number,
            default: undefined
        },
        cameraFieldOfView: {
            type: Number,
            default: undefined
        },
        cameraPan: {
            type: Number,
            default: undefined
        }
    },
    computed: {
        skewCompassHUDStyle() {
            if (this.roverRoll === undefined || this.roverRoll === 0) {
                return;
            }

            const origin = this.roverRoll > 0 ? 'left bottom' : 'right top';

            return {
                'transform-origin': origin,
                transform: `skew(0, ${ this.roverRoll }deg`
            };
        },
        visibleCompassPoints() {
            return COMPASS_POINTS
                .filter(point => inRange(point.degrees, this.visibleRange))
                .map(point => {
                    const percentage = percentOfRange(point.degrees, this.visibleRange);
                    point.style = Object.assign(
                        { left: `${ percentage * 100 }%` }
                    );

                    return point;
                });
        },
        isSunInRange() {
            return inRange(this.normalizedSunHeading, this.visibleRange);
        },
        sunPositionStyle() {
            const percentage = percentOfRange(this.normalizedSunHeading, this.visibleRange);

            return {
                left: `${ percentage * 100 }%`
            };
        },
        normalizedSunHeading() {
            return normalizeDegrees(this.sunHeading);
        },
        normalizedRoverHeading() {
            return normalizeDegrees(this.roverHeading);
        },
        visibleRange() {
            const min = normalizeDegrees(this.normalizedRoverHeading + this.cameraPan - this.cameraFieldOfView / 2);
            const max = normalizeDegrees(this.normalizedRoverHeading + this.cameraPan + this.cameraFieldOfView / 2);

            return [
                min,
                max
            ];
        }
    }
};
</script>

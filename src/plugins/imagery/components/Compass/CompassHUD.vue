<template>
<div
    class="c-compass__hud c-hud"
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
        // degrees from north heading
        roverHeading: {
            type: Number,
            required: true
        },
        // degrees from north heading
        sunHeading: {
            type: Number,
            default: undefined
        },
        camFieldOfView: {
            type: Number,
            default: undefined
        }
    },
    computed: {
        visibleCompassPoints() {
            return COMPASS_POINTS
                .filter(point => inRange(point.degrees, this.visibleRange))
                .map(point => {
                    const percentage = percentOfRange(point.degrees, this.visibleRange);
                    point.style = {
                        left: `${ percentage * 100 }%`
                    };

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
            return [
                normalizeDegrees(this.normalizedRoverHeading - this.camFieldOfView / 2),
                normalizeDegrees(this.normalizedRoverHeading + this.camFieldOfView / 2)
            ];
        }
    },
    methods: {
        getPointPositionStyle(degrees) {

        }
    }
};
</script>

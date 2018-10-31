<template>
    <div class="c-gauge">
        <div class="c-gauge__wrapper">
            <svg class="c-gauge__range" viewBox="0 0 512 512">
                <text font-size="100" transform="translate(256 280)" text-anchor="middle">{{ this.curVal }}</text>
                <text font-size="35" transform="translate(105 455) rotate(-45)">{{ this.rangeLow }}</text>
                <text font-size="35" transform="translate(407 455) rotate(45)" text-anchor="end">{{ this.rangeHigh }}</text>
            </svg>

            <div class="c-dial">
                <svg class="c-dial__bg" viewBox="0 0 512 512">
                    <g>
                        <path d="M256,0C114.6,0,0,114.6,0,256S114.6,512,256,512,512,397.4,512,256,397.4,0,256,0Zm0,412A156,156,0,1,1,412,256,155.9,155.9,0,0,1,256,412Z"/>
                    </g>
                </svg>

                <svg class="c-dial__limit" viewBox="0 0 512 512"
                     v-if="degLimit < 270"
                     :class="{
                        'c-limit-clip--90': this.degLimit > 90,
                        'c-limit-clip--180': this.degLimit >= 180
                     }">
                    <path d="M100,256A156,156,0,1,1,366.3,366.3L437,437a255.2,255.2,0,0,0,75-181C512,114.6,397.4,0,256,0S0,114.6,0,256A255.2,255.2,0,0,0,75,437l70.7-70.7A155.5,155.5,0,0,1,100,256Z"
                          :style="`transform: rotate(${this.degLimit}deg)`"/>
                </svg>

                <svg class="c-dial__value" viewBox="0 0 512 512"
                     :class="{
                        'c-dial-clip--90': this.degValue < 90,
                        'c-dial-clip--180': this.degValue >= 90 && this.degValue < 180
                     }">
                    <path d="M256,31A224.4,224.4,0,0,0,96.9,96.9l48.8,48.8a156,156,0,1,1,0,220.6L96.9,415.1A224.4,224.4,0,0,0,256,481c124.3,0,225-100.7,225-225S380.3,31,256,31Z"
                          :style="`transform: rotate(${this.degValue}deg)`"/>
                </svg>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-gauge {
        &__wrapper {
            //@include test();
            position: absolute;
            width: 100%;
            padding-bottom: 100%;
            overflow: hidden;
        }

        &__value {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3vw;
        }

        &__range {
            $o: 21%;
            /*display: block; //inline-block;*/
           //font-size: 2.5vw;
            position: absolute;
            fill: rgba(#fff, 0.8);
        }
    }

    .c-dial {
        // Dial elements
        @include abs();
        clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 50%, 0 100%);

        svg,
        &__ticks,
        &__bg,
        &__limit,
        &__value {
           // @include test();
            @include abs();
        }

        svg {
            path {
                transform-origin: center;
            }
        }

        &__limit {
            &.c-limit-clip--90 {
                clip-path: polygon(0 0, 100% 0, 100% 100%);
            }

            &.c-limit-clip--180 {
                clip-path: polygon(100% 0, 100% 100%, 0 100%);
            }

            path {
                fill: rgba(orange, 0.4);
            }
        }

        &__value {
            &.c-dial-clip--90 {
                clip-path: polygon(0 0, 50% 50%, 0 100%);
            }

            &.c-dial-clip--180 {
                clip-path: polygon(0 0, 100% 0, 0 100%);
            }

            path {
                fill: rgba(#fff, 0.8);
            }
        }

        &__bg {
            g {
                fill: rgba(#fff, 0.1);
            }
        }
    }

</style>

<script>
    export default {
        name: "Gauge.vue",
        data() {
            this.rangeLow = -20;
            this.rangeHigh= 10;
            this.curVal = 9;
            this.limit1 = 9;
        },
        methods: {
            round: function(val, decimals) {
                let precision = Math.pow(10, decimals);
                return Math.round(val * precision)/precision;
            },
            valToPercent: function(vValue) {
                return (vValue / (this.rangeHigh - this.rangeLow)) * 100;
            },
            percentToDegrees: function(vPercent) {
                return this.round((vPercent/100)*270, 2);
            }
        },
        computed: {
            degValue: function() {
                let v = this.valToPercent(this.curVal);
                console.log(v);
                return this.percentToDegrees(v);
            },
            degLimit: function() {
                return this.percentToDegrees(this.valToPercent(this.limit1));
            }
        }
    }
</script>
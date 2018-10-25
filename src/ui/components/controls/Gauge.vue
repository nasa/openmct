<template>
    <div class="c-gauge">
        <div class="c-gauge__wrapper">
            <div class="c-gauge__value">
                Limit degrees: {{ this.degLimit }}<br />
                Value degrees: {{ this.degValue }}
            </div>

            <!-- Dial base -->
            <div class="c-dial">
                <svg class="c-dial__bg" viewBox="0 0 512 512">
                    <path d="M256,0C114.6,0,0,114.6,0,256S114.6,512,256,512,512,397.4,512,256,397.4,0,256,0Zm0,384A128,128,0,1,1,384,256,128,128,0,0,1,256,384Z"/>
                </svg>

                <svg class="c-dial__limit" viewBox="0 0 512 512"
                     v-if="degLimit < 270"
                     :class="{
                        'c-limit-clip--90': this.degLimit > 90,
                        'c-limit-clip--180': this.degLimit >= 180
                     }">
                    <path d="M256,0C114.6,0,0,114.6,0,256A255.2,255.2,0,0,0,75,437l90.5-90.5a128,128,0,1,1,181,0L437,437a255.2,255.2,0,0,0,75-181C512,114.6,397.4,0,256,0Z"
                          :style="`transform: rotate(${this.degLimit}deg)`"/>
                </svg>

                <svg class="c-dial__value" viewBox="0 0 512 512"
                     :class="{
                        'c-dial-clip--90': this.degValue < 90,
                        'c-dial-clip--180': this.degValue >= 90 && this.degValue < 180
                     }">
                    <path d="M481,256C481,131.7,380.3,31,256,31A224.4,224.4,0,0,0,96.9,96.9l68.6,68.6a128,128,0,1,1,0,181L96.9,415.1A224.4,224.4,0,0,0,256,481C380.3,481,481,380.3,481,256Z"
                          :style="`transform: rotate(${this.degValue}deg)`"/>
                </svg>
            </div>



        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-gauge {
        svg {
            @include abs();

            path {
                transform-origin: center;
            }
        }

        &__wrapper {
            position: absolute;
            width: 100%;
            padding-bottom: 100%;
            overflow: hidden;
        }

        &__value {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }
    }

    .c-dial {
        // Dial elements
        @include abs();
        clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 50%, 0 100%);

        &__limit,
        &__value {
           // @include test();
            @include abs();
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
                fill: rgba(green, 0.7);
            }
        }

        &__bg {
            path {
                fill: rgba(#fff, 0.1);
            }
        }
    }

</style>

<script>
    let curVal = 97.3;
    let limit1 = 97;

    export default {
        name: "Gauge.vue",
        props: {
            dialVal:  {
                type: Number,
                value: 10
            }
        },
        methods: {
            round: function(val, decimals) {
                let precision = Math.pow(10, decimals);
                return Math.round(val * precision)/precision;
            },
            percentToDegrees: function(vPercent) {
                return this.round((vPercent/100)*270, 2);
            }
        },
        computed: {
            degValue: function() {
                return this.percentToDegrees(curVal);
            },
            degLimit: function() {
                return this.percentToDegrees(limit1);
            }
        }
    }
</script>
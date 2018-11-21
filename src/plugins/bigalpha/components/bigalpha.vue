<template>
    <div class="c-bigalpha">
        <div class="c-bigalpha__wrapper">
            <svg class="c-bigalpha__vals" viewBox="0 0 512 512">
                <text class="c-bigalpha__int" transform="translate(320 180)" text-anchor="end">{{ this.curValInt }}</text>
                <text class="c-bigalpha__dec" transform="translate(320 110)" text-anchor="start">{{ this.curValDec }}</text>
                <text class="c-bigalpha__units" transform="translate(290 177)" style="font-size: 47px;" text-anchor="start">{{ this.units }}</text>
            </svg>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-bigalpha {
        @include abs();
        overflow: hidden;

        &__wrapper {
            position: absolute;
            width: 100%;
            padding-bottom: 50%;
            overflow: hidden;
        }

        &__int,
        &__dec,
        &__units {
            fill: #fff;
        }

        &__int,
        &__dec {
            font-family: $heroFont;
            letter-spacing: -0.15em;
        }

        &__int {
            font-size: 256px;
            opacity: 0.8;
        }

        &__dec {
            font-size: 155px;
            opacity: 0.4;
        }

        &__units {
            font-family: $headerFont;
            opacity: 0.2;
        }
    }

</style>

<script>
    export default {
        name: "bigalpha",
        inject: ['domainObject'],
        data: function () {
            let config = this.domainObject.configuration,
                rangeLow = config.min,
                rangeHigh = config.max,
                limit = config.limit;
            console.log(config);
            return {
                rangeLow,
                rangeHigh,
                limit1: limit,
                curValInt: 799,
                curValDec: 999,
                units: 'M/SEC'

            }
        },
        methods: {
            round: function(val, decimals) {
                let precision = Math.pow(10, decimals);
                return Math.round(val * precision)/precision;
            },
            valToPercent: function(vValue) {
                return ((vValue - this.rangeLow) / (this.rangeHigh - this.rangeLow)) * 100;
            },
            percentToDegrees: function(vPercent) {
                return this.round((vPercent/100)*270, 2);
            }
        },
        computed: {
            degValue: function() {
                return this.percentToDegrees(this.valToPercent(this.curVal));
            },
            degLimit: function() {
                return this.percentToDegrees(this.valToPercent(this.limit1));
            }
        }
    }
</script>
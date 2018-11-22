<template>
    <div class="c-bigalpha">
        <svg class="c-bigalpha__int" viewBox="0 0 52 31">
            <text textLength=100% lengthAdjust=spacingAndGlyphs x="0" y="31">{{ this.curValInt }}</text>
        </svg>
        <svg class="c-bigalpha__dec" viewBox="0 0 40 20">
            <text textLength=100% lengthAdjust=spacing x="0" y="20">.{{ this.curValDec }}</text>
        </svg>
        <svg class="c-bigalpha__units" viewBox="0 0 45 11">
            <text textLength=100% lengthAdjust=spacingAndGlyphs x="0" y="11">{{ this.units }}</text>
        </svg>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-bigalpha {
        $w1: 53%;

        @include abs();
        bottom: auto;
        padding-bottom: 32%;

        &__int,
        &__dec,
        &__units {
            position: absolute;
            fill: #fff;
        }

        &__int,
        &__dec {
            font-family: $heroFont;
        }

        &__int {
            font-size: 49px;
            opacity: 0.8;
            width: $w1;
        }

        &__dec {
            left: $w1;
            font-size: 32px;
            opacity: 0.4;
            width: 100% - $w1;
        }

        &__units {
            font-size: 9px;
            font-family: $headerFont;
            left: $w1;
            bottom: 0;
            opacity: 0.2;
            width: 99% - $w1; // Font has different char spacing, so use reduced width
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
                curValInt: 108,
                curValDec: '043',
                units: 'M/SEC2'

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
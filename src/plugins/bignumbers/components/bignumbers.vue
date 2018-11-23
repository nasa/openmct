<template>
    <div class="c-bignumbers">
        <svg class="c-bignumbers__int" viewBox="0 0 52 32">
            <text textLength=100% lengthAdjust=spacing x="0" y="32">{{ numToStr(this.curValInt, 3) }}</text>
        </svg>
        <svg class="c-bignumbers__dec" viewBox="0 0 40 20">
            <text textLength=100% lengthAdjust=spacing x="0" y="20">.{{ numToStr(this.curValDec, 3) }}</text>
        </svg>
        <svg class="c-bignumbers__units" viewBox="0 0 45 11">
            <text textLength=100% lengthAdjust=spacingAndGlyphs x="0" y="11">{{ this.units }}</text>
        </svg>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-bignumbers {
        $w1: 53%;

        @include abs();
        bottom: auto;
        padding-bottom: 33%;

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
            font-size: 51px;
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
        name: "bignumbers",
        inject: ['domainObject'],
        data: function () {
            let config = this.domainObject.configuration,
                units = config.units;
            console.log(config);
            return {
                curValInt: 10,
                curValDec: 70,
                units: units

            }
        },
        methods: {
            numToStr: function(val, length) {
                // Zero pads an integer and returns it as a string
                let s = val.toString();
                for (var i = 0; i <= (length - s.length); i++) {
                    s = '0' + s;
                }
                return s;
            }
        },
        computed: {
        }
    }
</script>
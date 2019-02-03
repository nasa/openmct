<template>
    <div class="c-bignumbers">
        <svg class="c-bignumbers__int" viewBox="0 0 52 32">
            <text textLength=100% lengthAdjust=spacingAndGlyphs x="0" y="32">{{ this.curValInt }}</text>
        </svg>
        <svg class="c-bignumbers__dec" viewBox="0 0 40 20">
            <text textLength=100% lengthAdjust=spacing x="0" y="20">.{{ this.curValDec }}</text>
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
        inject: ['openmct', 'domainObject', 'composition'],
        data: function () {
            let config = this.domainObject.configuration,
                units = config.units;
            console.log(config);
            return {
                curValInt: 0,
                curValDec: 0,
                units: units

            }
        },
        methods: {
            getInt: function(val, digits) {
                // Extract integer portion of val and zero-pad it if its length < digits
                return this.zeroPad(Math.floor(val), digits);
            },
            getDec: function(val, digits) {
                // Extract decimal portion of val to the specified number of digits
                return Number.parseFloat(val).toFixed(digits).split('.')[1];
            },
            zeroPad: function(val, length) {
                // Zero pads an integer and returns it as a string
                let s = Math.abs(val).toString();
                if (s.length < length) {
                    for (let i = 0; i <= (length - s.length); i++) {
                        s = '0' + s;
                    }
                }
                if (val < 0) {
                    s = '-' + s;
                }
                return s;
            },
            updateValue(datum) {
                let cv = this.formats[this.valueKey].format(datum);
                this.curValInt = this.getInt(cv, 3);
                this.curValDec = this.getDec(cv, 3);
            },
            subscribe(domainObject) {
                this.metadata = this.openmct.telemetry.getMetadata(domainObject);
                this.formats = this.openmct.telemetry.getFormatMap(this.metadata);

                this.valueKey = this
                    .metadata
                    .valuesForHints(['range'])[0].key;
                this.unsubscribe = this.openmct
                    .telemetry
                    .subscribe(domainObject, this.updateValue.bind(this), {});
                this.openmct
                    .telemetry
                    .request(domainObject, {strategy: 'latest'})
                    .then((values) => values.forEach(this.updateValue));
            }
        },
        computed: {
        },
        mounted() {
            this.composition.on('add', this.subscribe);
            this.composition.load();
        },
        destroyed() {
            this.composition.off('add', this.subscribe);
            this.unsubscribe();
        }
    }
</script>
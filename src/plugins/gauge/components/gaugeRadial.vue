<template>
<div class="c-gauge">
    <div class="c-gauge__wrapper">
        <svg class="c-gauge__range"
             viewBox="0 0 512 512"
        >
            <text class="c-gauge__curval"
                  transform="translate(256 290)"
                  text-anchor="middle"
                  font-size="100px"
            >{{ curVal }}</text>
            <text v-if="displayMinMax"
                  font-size="35"
                  transform="translate(105 455) rotate(-45)"
            >{{ rangeLow }}</text>
            <text v-if="displayMinMax"
                  font-size="35"
                  transform="translate(407 455) rotate(45)"
                  text-anchor="end"
            >{{ rangeHigh }}</text>
        </svg>

        <div class="c-dial">
            <svg class="c-dial__bg"
                 viewBox="0 0 512 512"
            >
                <g>
                    <path d="M256,0C114.6,0,0,114.6,0,256S114.6,512,256,512,512,397.4,512,256,397.4,0,256,0Zm0,412A156,156,0,1,1,412,256,155.9,155.9,0,0,1,256,412Z" />
                </g>
            </svg>

            <svg v-if="degLimit < 270"
                 class="c-dial__limit"
                 viewBox="0 0 512 512"
                 :class="{
                     'c-limit-clip--90': degLimit > 90,
                     'c-limit-clip--180': degLimit >= 180
                 }"
            >
                <path d="M100,256A156,156,0,1,1,366.3,366.3L437,437a255.2,255.2,0,0,0,75-181C512,114.6,397.4,0,256,0S0,114.6,0,256A255.2,255.2,0,0,0,75,437l70.7-70.7A155.5,155.5,0,0,1,100,256Z"
                      :style="`transform: rotate(${degLimit}deg)`"
                />
            </svg>

            <svg v-if="degValue > 0"
                 class="c-dial__value"
                 viewBox="0 0 512 512"
                 :class="{
                     'c-dial-clip--90': degValue < 90,
                     'c-dial-clip--180': degValue >= 90 && degValue < 180
                 }"
            >
                <path d="M256,31A224.3,224.3,0,0,0,98.3,95.5l48.4,49.2a156,156,0,1,1-1,221.6L96.9,415.1A224.4,224.4,0,0,0,256,481c124.3,0,225-100.7,225-225S380.3,31,256,31Z"
                      :style="`transform: rotate(${degValue}deg)`"
                />
            </svg>
        </div>
    </div>
</div>
</template>

<script>
export default {
    name: 'GaugeRadial',
    inject: ['openmct', 'domainObject', 'composition'],
    data() {
        let gaugeController = this.domainObject.configuration.gaugeController;

        return {
            curVal: 0,
            precision: gaugeController.precision,
            displayMinMax: gaugeController.isDisplayMinMax,
            limit: gaugeController.limit,
            rangeHigh: gaugeController.max,
            rangeLow: gaugeController.min
        };
    },
    computed: {
        degValue() {
            return this.percentToDegrees(this.valToPercent(this.curVal));
        },
        degLimit() {
            return this.percentToDegrees(this.valToPercent(this.limit));
        }
    },
    mounted() {
        this.composition.on('add', this.subscribe);
        this.composition.load();
    },
    destroyed() {
        this.composition.off('add', this.subscribe);

        if (this.unsubscribe) {
            this.unsubscribe();
        }
    },
    methods: {
        round(val, decimals) {
            let precision = Math.pow(10, decimals);

            return Math.round(val * precision) / precision;
        },
        valToPercent(vValue) {
            if (vValue >= this.rangeHigh) {
                return 100;
            }

            return ((vValue - this.rangeLow) / (this.rangeHigh - this.rangeLow)) * 100;
        },
        percentToDegrees(vPercent) {
            return this.round((vPercent / 100) * 270, 2);
        },
        updateValue(datum) {
            this.curVal = this.round(this.formats[this.valueKey].format(datum), this.precision);
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
    }
};
</script>

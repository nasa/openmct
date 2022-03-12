<template>
<div class="c-gauge"
     :class="`c-gauge--${gaugeType}`"
>
    <div class="c-gauge__wrapper">
        <template v-if="gaugeType.indexOf('dial') !== -1">
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

                <svg v-if="limitHigh && dialHighLimitDeg < 270"
                     class="c-dial__limit-high"
                     viewBox="0 0 512 512"
                     :class="{
                         'c-high-limit-clip--90': dialHighLimitDeg > 90,
                         'c-high-limit-clip--180': dialHighLimitDeg >= 180
                     }"
                >
                    <path d="M100,256A156,156,0,1,1,366.3,366.3L437,437a255.2,255.2,0,0,0,75-181C512,114.6,397.4,0,256,0S0,114.6,0,256A255.2,255.2,0,0,0,75,437l70.7-70.7A155.5,155.5,0,0,1,100,256Z"
                          :style="`transform: rotate(${dialHighLimitDeg}deg)`"
                    />
                </svg>

                <svg v-if="limitLow && dialLowLimitDeg < 270"
                     class="c-dial__limit-low"
                     viewBox="0 0 512 512"
                     :class="{
                         'c-dial-clip--90': dialLowLimitDeg < 90,
                         'c-dial-clip--180': dialLowLimitDeg >= 90 && dialLowLimitDeg < 180
                     }"
                >
                    <path d="M256,100c86.2,0,156,69.8,156,156s-69.8,156-156,156c-43.1,0-82.1-17.5-110.3-45.7L75,437 c46.3,46.3,110.3,75,181,75c141.4,0,256-114.6,256-256S397.4,0,256,0C185.3,0,121.3,28.7,75,75l70.7,70.7 C173.9,117.5,212.9,100,256,100z"
                          :style="`transform: rotate(${dialLowLimitDeg}deg)`"
                    />
                </svg>

                <svg v-if="degValue > 0"
                     class="c-dial__value"
                     viewBox="0 0 512 512"
                     :class="{
                         'c-dial-clip--90': degValue < 90 && gaugeType.indexOf('-needle') === -1,
                         'c-dial-clip--180': degValue >= 90 && degValue < 180 && gaugeType.indexOf('-needle') === -1
                     }"
                >
                    <path v-if="gaugeType.indexOf('dial-filled') !== -1"
                          d="M256,31A224.3,224.3,0,0,0,98.3,95.5l48.4,49.2a156,156,0,1,1-1,221.6L96.9,415.1A224.4,224.4,0,0,0,256,481c124.3,0,225-100.7,225-225S380.3,31,256,31Z"
                          :style="`transform: rotate(${degValue}deg)`"
                    />
                    <path v-if="gaugeType.indexOf('dial-needle') !== -1"
                          d="M139.9,360.1l-48.6,48.6c-3.3,3.3-3.3,8.7,0,12s8.7,3.3,12,0l48.6-48.6L139.9,360.1z"
                          :style="`transform: rotate(${degValue}deg)`"
                    />
                </svg>
            </div>
        </template>

        <template v-if="gaugeType.indexOf('meter') !== -1">
            <div class="c-meter">
                <div v-if="displayMinMax"
                     class="c-meter__range"
                >
                    <div class="c-meter__range__high">{{ rangeHigh }}</div>
                    <div class="c-meter__range__low">{{ rangeLow }}</div>
                </div>
                <div class="c-meter__bg">
                    <div class="c-meter__curval">{{ curVal }}</div>

                    <template v-if="gaugeType.indexOf('-vertical') !== -1">
                        <div class="c-meter__value"
                             :style="`transform: translateY(${meterValueToPerc}%)`"
                        ></div>

                        <div v-if="limitHigh && meterHighLimitPerc > 0"
                             class="c-meter__limit-high"
                             :style="`height: ${meterHighLimitPerc}%`"
                        ></div>

                        <div v-if="limitLow && meterLowLimitPerc > 0"
                             class="c-meter__limit-low"
                             :style="`height: ${meterLowLimitPerc}%`"
                        ></div>
                    </template>

                    <template v-if="gaugeType.indexOf('-horz') !== -1">
                        <div class="c-meter__value"
                             :style="`transform: translateX(${meterValueToPerc * -1}%)`"
                        ></div>

                        <div v-if="limitHigh && meterHighLimitPerc > 0"
                             class="c-meter__limit-high"
                             :style="`width: ${meterHighLimitPerc}%`"
                        ></div>

                        <div v-if="limitLow && meterLowLimitPerc > 0"
                             class="c-meter__limit-low"
                             :style="`width: ${meterLowLimitPerc}%`"
                        ></div>
                    </template>

                    <!--svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                      <text class="c-meter__svg-curval"
                            text-anchor="middle"
                            transform="translate(50,60)"
                      >{{ curVal }}</text>
                    </svg-->
                </div>
            </div>
        </template>
    </div>

    <div v-if="debug"
         class="temp-debug"
    >
        <div><b>ranges: </b>{{ rangeLow }} &lt; &gt; {{ rangeHigh }}</div>

        <template v-if="limitLow && limitHigh">
            <div><b>limits: </b>{{ limitLow }} &lt; &gt; {{ limitHigh }}</div>
            <div><b>dial limit deg: </b>{{ dialLowLimitDeg }} deg &lt; &gt; {{ dialHighLimitDeg }} deg</div>
            <div><b>meter limit %: </b>{{ meterLowLimitPerc }} &lt; &gt; {{ meterHighLimitPerc }}</div>
        </template>

        <div v-if="debugDial"
             class="temp-dial-debug"
        >
            <div class="c-dial">
                Value
                <svg v-if="degValue > 0"
                     class="c-dial__value"
                     viewBox="0 0 512 512"
                     :class="{
                         'c-dial-clip--90': degValue < 90 && gaugeType.indexOf('-needle') === -1,
                         'c-dial-clip--180': degValue >= 90 && degValue < 180 && gaugeType.indexOf('-needle') === -1
                     }"
                >
                    <path v-if="true"
                          d="M256,31A224.3,224.3,0,0,0,98.3,95.5l48.4,49.2a156,156,0,1,1-1,221.6L96.9,415.1A224.4,224.4,0,0,0,256,481c124.3,0,225-100.7,225-225S380.3,31,256,31Z"
                          :style="`transform: rotate(${0}deg)`"
                    />
                    <path v-if="gaugeType.indexOf('dial-needle') !== -1 && false"
                          d="M139.9,360.1l-48.6,48.6c-3.3,3.3-3.3,8.7,0,12s8.7,3.3,12,0l48.6-48.6L139.9,360.1z"
                          :style="`transform: rotate(${degValue}deg)`"
                    />
                </svg>
            </div>

            <div class="c-dial">
                Dial Clip
                <div class="c-dial__value"
                     style="clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 50%, 0 100%);"
                ></div>
            </div>

            <div class="c-dial">
                Dial Clip 180
                <div class="c-dial__value c-dial-clip--180"></div>
            </div>

            <div class="c-dial">
                Dial Clip 90
                <div class="c-dial__value c-dial-clip--90"></div>
            </div>
        </div>

        <div v-if="limitLow && limitHigh && debugDial"
             class="temp-dial-debug"
        >
            <div class="c-dial">
                High Limit
                <svg class="c-dial__bg"
                     viewBox="0 0 512 512"
                >
                    <path d="M100,256A156,156,0,1,1,366.3,366.3L437,437a255.2,255.2,0,0,0,75-181C512,114.6,397.4,0,256,0S0,114.6,0,256A255.2,255.2,0,0,0,75,437l70.7-70.7A155.5,155.5,0,0,1,100,256Z"
                          :style="`transform: rotate(${dialHighLimitDeg}deg)`"
                    />
                </svg>
            </div>

            <div class="c-dial">
                Low Limit
                <svg class="c-dial__bg"
                     viewBox="0 0 512 512"
                >
                    <path d="M256,100c86.2,0,156,69.8,156,156s-69.8,156-156,156c-43.1,0-82.1-17.5-110.3-45.7L75,437 c46.3,46.3,110.3,75,181,75c141.4,0,256-114.6,256-256S397.4,0,256,0C185.3,0,121.3,28.7,75,75l70.7,70.7 C173.9,117.5,212.9,100,256,100z"
                          :style="`transform: rotate(${dialLowLimitDeg}deg)`"
                    />
                </svg>
            </div>

            <div class="c-dial">
                High Limit Clip 180
                <div class="c-dial__value c-high-limit-clip--180"></div>
            </div>

            <div class="c-dial">
                High Limit Clip 90
                <div class="c-dial__value c-high-limit-clip--90"></div>
            </div>
        </div>
    </div>

</div>
</template>

<script>
const LIMIT_PADDING_IN_PERCENT = 10;

export default {
    name: 'GaugeRadial',
    inject: ['openmct', 'domainObject', 'composition'],
    data() {
        let gaugeController = this.domainObject.configuration.gaugeController;

        return {
            curVal: 0,
            digits: 3,
            precision: gaugeController.precision,
            displayMinMax: gaugeController.isDisplayMinMax,
            limitHigh: gaugeController.limitHigh,
            limitLow: gaugeController.limitLow,
            rangeHigh: gaugeController.max,
            rangeLow: gaugeController.min,
            gaugeType: gaugeController.gaugeType,
            debug: false,
            debugDial: false
        };
    },
    computed: {
        degValue() {
            return this.percentToDegrees(this.valToPercent(this.curVal));
        },
        dialHighLimitDeg() {
            return this.percentToDegrees(this.valToPercent(this.limitHigh));
        },
        dialLowLimitDeg() {
            return this.percentToDegrees(this.valToPercent(this.limitLow));
        },
        meterValueToPerc() {
            if (this.curVal <= this.rangeLow) {
                return 100;
            }

            if (this.curVal >= this.rangeHigh) {
                return 0;
            }

            return this.valToPercentMeter(this.curVal);
        },
        meterHighLimitPerc() {
            return this.valToPercentMeter(this.limitHigh);
        },
        meterLowLimitPerc() {
            return 100 - this.valToPercentMeter(this.limitLow);
        }
    },
    watch: {
        curVal(newCurValue) {
            if (this.digits < newCurValue.toString().length) {
                this.digits = newCurValue.toString().length;
            }
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
        round(val, decimals = this.precision) {
            let precision = Math.pow(10, decimals);

            return Math.round(val * precision) / precision;
        },
        valToPercent(vValue) {
            // Used by dial
            if (vValue >= this.rangeHigh && this.gaugeType.indexOf('filled') !== -1) {
                // Don't peg at 100% if the gaugeType isn't a filled shape
                return 100;
            }

            return ((vValue - this.rangeLow) / (this.rangeHigh - this.rangeLow)) * 100;
        },
        valToPercentMeter(vValue) {
            return this.round((this.rangeHigh - vValue) / (this.rangeHigh - this.rangeLow) * 100, 2);
        },
        percentToDegrees(vPercent) {
            return this.round((vPercent / 100) * 270, 2);
        },
        updateLimits(telemetryLimit) {
            if (!telemetryLimit || !this.domainObject.configuration.gaugeController.isUseTelemetryLimits) {
                return;
            }

            let limits = {
                high: 0,
                low: 0
            };
            if (telemetryLimit.CRITICAL) {
                limits = telemetryLimit.CRITICAL;
            } else if (telemetryLimit.DISTRESS) {
                limits = telemetryLimit.DISTRESS;
            } else if (telemetryLimit.SEVERE) {
                limits = telemetryLimit.SEVERE;
            } else if (telemetryLimit.WARNING) {
                limits = telemetryLimit.WARNING;
            } else if (telemetryLimit.WATCH) {
                limits = telemetryLimit.WATCH;
            } else {
                this.openmct.notifications.error('No limits definition for given telemetry');
            }

            this.limitHigh = this.round(limits.high[this.valueKey]);
            this.limitLow = this.round(limits.low[this.valueKey]);
            this.rangeHigh = this.round(this.limitHigh + this.limitHigh * LIMIT_PADDING_IN_PERCENT / 100);
            this.rangeLow = this.round(this.limitLow - Math.abs(this.limitLow * LIMIT_PADDING_IN_PERCENT / 100));
        },
        updateValue(datum) {
            this.curVal = this.round(this.formats[this.valueKey].format(datum), this.precision);
        },
        subscribe(domainObject) {
            this.metadata = this.openmct.telemetry.getMetadata(domainObject);
            this.formats = this.openmct.telemetry.getFormatMap(this.metadata);
            const LimitEvaluator = this.openmct.telemetry.getLimits(domainObject);
            LimitEvaluator.limits().then(this.updateLimits);

            this.valueKey = this
                .metadata
                .valuesForHints(['range'])[0].key;
            this.unsubscribe = this.openmct
                .telemetry
                .subscribe(domainObject, this.updateValue.bind(this));
            this.openmct
                .telemetry
                .request(domainObject, { strategy: 'latest' })
                .then(values => {
                    const length = values.length;
                    this.updateValue(values[length - 1]);
                });
        }
    }
};
</script>

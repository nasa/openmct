/*****************************************************************************
* Open MCT, Copyright (c) 2014-2022, United States Government
* as represented by the Administrator of the National Aeronautics and Space
* Administration. All rights reserved.
*
* Open MCT is licensed under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* http://www.apache.org/licenses/LICENSE-2.0.
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and limitations
* under the License.
*
* Open MCT includes source code licensed under additional open source
* licenses. See the Open Source Licenses file (LICENSES.md) included with
* this source code distribution or the Licensing information page available
* at runtime from the About dialog for additional information.
*****************************************************************************/
<template>
<div
    class="c-gauge"
    :class="`c-gauge--${gaugeType}`"
>
    <div class="c-gauge__wrapper">
        <template v-if="typeDial">
            <svg
                class="c-gauge__range"
                viewBox="0 0 512 512"
            >
                <text
                    v-if="displayMinMax"
                    font-size="35"
                    transform="translate(105 455) rotate(-45)"
                >{{ rangeLow }}</text>
                <text
                    v-if="displayMinMax"
                    font-size="35"
                    transform="translate(407 455) rotate(45)"
                    text-anchor="end"
                >{{ rangeHigh }}</text>
            </svg>

            <svg
                v-if="displayCurVal"
                class="c-gauge__curval"
                :viewBox="curValViewBox"
            >
                <text
                    class="c-gauge__curval-text"
                    lengthAdjust="spacing"
                    text-anchor="middle"
                >{{ curVal }}</text>
            </svg>

            <div class="c-dial">
                <svg
                    class="c-dial__bg"
                    viewBox="0 0 512 512"
                >
                    <path d="M256,0C114.6,0,0,114.6,0,256S114.6,512,256,512,512,397.4,512,256,397.4,0,256,0Zm0,412A156,156,0,1,1,412,256,155.9,155.9,0,0,1,256,412Z" />
                </svg>

                <svg
                    v-if="limitHigh && dialHighLimitDeg < 270"
                    class="c-dial__limit-high"
                    viewBox="0 0 512 512"
                    :class="{
                        'c-high-limit-clip--90': dialHighLimitDeg > 90,
                        'c-high-limit-clip--180': dialHighLimitDeg >= 180
                    }"
                >
                    <path
                        d="M100,256A156,156,0,1,1,366.3,366.3L437,437a255.2,255.2,0,0,0,75-181C512,114.6,397.4,0,256,0S0,114.6,0,256A255.2,255.2,0,0,0,75,437l70.7-70.7A155.5,155.5,0,0,1,100,256Z"
                        :style="`transform: rotate(${dialHighLimitDeg}deg)`"
                    />
                </svg>

                <svg
                    v-if="limitLow && dialLowLimitDeg < 270"
                    class="c-dial__limit-low"
                    viewBox="0 0 512 512"
                    :class="{
                        'c-dial-clip--90': dialLowLimitDeg < 90,
                        'c-dial-clip--180': dialLowLimitDeg >= 90 && dialLowLimitDeg < 180
                    }"
                >
                    <path
                        d="M256,100c86.2,0,156,69.8,156,156s-69.8,156-156,156c-43.1,0-82.1-17.5-110.3-45.7L75,437 c46.3,46.3,110.3,75,181,75c141.4,0,256-114.6,256-256S397.4,0,256,0C185.3,0,121.3,28.7,75,75l70.7,70.7 C173.9,117.5,212.9,100,256,100z"
                        :style="`transform: rotate(${dialLowLimitDeg}deg)`"
                    />
                </svg>

                <svg
                    class="c-dial__value"
                    viewBox="0 0 512 512"
                    :class="{
                        'c-dial-clip--90': degValue < 90 && typeFilledDial,
                        'c-dial-clip--180': degValue >= 90 && degValue < 180 && typeFilledDial
                    }"
                >
                    <path
                        v-if="typeFilledDial && degValue > 0"
                        d="M256,31A224.3,224.3,0,0,0,98.3,95.5l48.4,49.2a156,156,0,1,1-1,221.6L96.9,415.1A224.4,224.4,0,0,0,256,481c124.3,0,225-100.7,225-225S380.3,31,256,31Z"
                        :style="`transform: rotate(${degValue}deg)`"
                    />
                    <path
                        v-if="typeNeedleDial && valueInBounds"
                        d="M256,86c-93.9,0-170,76.1-170,170c0,43.9,16.6,83.9,43.9,114.1l-38.7,38.7c-3.3,3.3-3.3,8.7,0,12s8.7,3.3,12,0 l38.7-38.7C172.1,409.4,212.1,426,256,426c93.9,0,170-76.1,170-170S349.9,86,256,86z M256,411.7c-86,0-155.7-69.7-155.7-155.7 S170,100.3,256,100.3S411.7,170,411.7,256S342,411.7,256,411.7z"
                        :style="`transform: rotate(${degValue}deg)`"
                    />
                </svg>
            </div>
        </template>

        <template v-if="typeMeter">
            <div class="c-meter">
                <div
                    v-if="displayMinMax"
                    class="c-gauge__range c-meter__range"
                >
                    <div class="c-meter__range__high">{{ rangeHigh }}</div>
                    <div class="c-meter__range__low">{{ rangeLow }}</div>
                </div>
                <div class="c-meter__bg">
                    <template v-if="typeMeterVertical">
                        <div
                            class="c-meter__value"
                            :style="`transform: translateY(${meterValueToPerc}%)`"
                        ></div>

                        <div
                            v-if="limitHigh && meterHighLimitPerc > 0"
                            class="c-meter__limit-high"
                            :style="`height: ${meterHighLimitPerc}%`"
                        ></div>

                        <div
                            v-if="limitLow && meterLowLimitPerc > 0"
                            class="c-meter__limit-low"
                            :style="`height: ${meterLowLimitPerc}%`"
                        ></div>
                    </template>

                    <template v-if="typeMeterHorizontal">
                        <div
                            class="c-meter__value"
                            :style="`transform: translateX(${meterValueToPerc * -1}%)`"
                        ></div>

                        <div
                            v-if="limitHigh && meterHighLimitPerc > 0"
                            class="c-meter__limit-high"
                            :style="`width: ${meterHighLimitPerc}%`"
                        ></div>

                        <div
                            v-if="limitLow && meterLowLimitPerc > 0"
                            class="c-meter__limit-low"
                            :style="`width: ${meterLowLimitPerc}%`"
                        ></div>
                    </template>

                    <svg
                        v-if="displayCurVal"
                        class="c-gauge__curval"
                        :viewBox="curValViewBox"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <text
                            class="c-gauge__curval-text"
                            text-anchor="middle"
                            lengthAdjust="spacing"
                        >{{ curVal }}</text>
                    </svg>
                </div>
            </div>
        </template>
    </div>
</div>
</template>

<script>
const LIMIT_PADDING_IN_PERCENT = 10;

export default {
    name: 'Gauge',
    inject: ['openmct', 'domainObject', 'composition'],
    data() {
        let gaugeController = this.domainObject.configuration.gaugeController;

        return {
            curVal: 0,
            digits: 3,
            precision: gaugeController.precision,
            displayMinMax: gaugeController.isDisplayMinMax,
            displayCurVal: gaugeController.isDisplayCurVal,
            limitHigh: gaugeController.limitHigh,
            limitLow: gaugeController.limitLow,
            rangeHigh: gaugeController.max,
            rangeLow: gaugeController.min,
            gaugeType: gaugeController.gaugeType,
            activeTimeSystem: this.openmct.time.timeSystem()
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
        curValViewBox() {
            const DIGITS_RATIO = 10;
            const VIEWBOX_STR = '0 0 X 15';

            return VIEWBOX_STR.replace('X', this.digits * DIGITS_RATIO);
        },
        typeDial() {
            return this.matchGaugeType('dial');
        },
        typeFilledDial() {
            return this.matchGaugeType('dial-filled');
        },
        typeNeedleDial() {
            return this.matchGaugeType('dial-needle');
        },
        typeMeter() {
            return this.matchGaugeType('meter');
        },
        typeMeterHorizontal() {
            return this.matchGaugeType('horizontal');
        },
        typeMeterVertical() {
            return this.matchGaugeType('vertical');
        },
        typeMeterInverted() {
            return this.matchGaugeType('inverted');
        },
        meterValueToPerc() {
            const meterDirection = (this.typeMeterInverted) ? -1 : 1;

            if (this.curVal <= this.rangeLow) {
                return meterDirection * 100;
            }

            if (this.curVal >= this.rangeHigh) {
                return 0;
            }

            return this.valToPercentMeter(this.curVal) * meterDirection;
        },
        meterHighLimitPerc() {
            return this.valToPercentMeter(this.limitHigh);
        },
        meterLowLimitPerc() {
            return 100 - this.valToPercentMeter(this.limitLow);
        },
        valueInBounds() {
            return (this.curVal >= this.rangeLow && this.curVal <= this.rangeHigh);
        },
        timeFormatter() {
            const timeSystem = this.activeTimeSystem;
            const metadataValue = this.metadata.value(timeSystem.key) || { format: timeSystem.key };

            return this.openmct.telemetry.getValueFormatter(metadataValue);
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
        this.composition.on('add', this.addedToComposition);
        this.composition.on('remove', this.removeTelemetryObject);

        this.composition.load();

        this.openmct.time.on('bounds', this.refreshData);
        this.openmct.time.on('timeSystem', this.setTimeSystem);
    },
    destroyed() {
        this.composition.off('add', this.addedToComposition);
        this.composition.off('remove', this.removeTelemetryObject);

        if (this.unsubscribe) {
            this.unsubscribe();
        }

        this.openmct.time.off('bounds', this.refreshData);
        this.openmct.time.off('timeSystem', this.setTimeSystem);
    },
    methods: {
        addTelemetryObjectAndSubscribe(domainObject) {
            this.telemetryObject = domainObject;
            this.request();
            this.subscribe();
        },
        addedToComposition(domainObject) {
            if (this.telemetryObject) {
                this.confirmRemoval(domainObject);
            } else {
                this.addTelemetryObjectAndSubscribe(domainObject);
            }
        },
        confirmRemoval(domainObject) {
            const dialog = this.openmct.overlays.dialog({
                iconClass: 'alert',
                message: 'This action will replace the current telemetry source. Do you want to continue?',
                buttons: [
                    {
                        label: 'Ok',
                        emphasis: true,
                        callback: () => {
                            this.removeFromComposition();
                            this.removeTelemetryObject();
                            this.addTelemetryObjectAndSubscribe(domainObject);
                            dialog.dismiss();
                        }
                    },
                    {
                        label: 'Cancel',
                        callback: () => {
                            this.removeFromComposition(domainObject);
                            dialog.dismiss();
                        }
                    }
                ]
            });
        },
        matchGaugeType(str) {
            return this.gaugeType.indexOf(str) !== -1;
        },
        percentToDegrees(vPercent) {
            return this.round((vPercent / 100) * 270, 2);
        },
        removeFromComposition(telemetryObject = this.telemetryObject) {
            let composition = this.domainObject.composition.filter(id =>
                !this.openmct.objects.areIdsEqual(id, telemetryObject.identifier)
            );

            this.openmct.objects.mutate(this.domainObject, 'composition', composition);
        },
        refreshData(bounds, isTick) {
            if (!isTick) {
                this.request();
            }
        },
        removeTelemetryObject() {
            if (this.unsubscribe) {
                this.unsubscribe();
                this.unsubscribe = null;
            }

            this.metadata = null;
            this.formats = null;
            this.valueKey = null;
            this.limitHigh = null;
            this.limitLow = null;
            this.rangeHigh = null;
            this.rangeLow = null;
        },
        request(domainObject = this.telemetryObject) {
            this.metadata = this.openmct.telemetry.getMetadata(domainObject);
            this.formats = this.openmct.telemetry.getFormatMap(this.metadata);
            const LimitEvaluator = this.openmct.telemetry.getLimits(domainObject);
            LimitEvaluator.limits().then(this.updateLimits);

            this.valueKey = this
                .metadata
                .valuesForHints(['range'])[0].source;

            this.openmct
                .telemetry
                .request(domainObject, { strategy: 'latest' })
                .then(values => {
                    const length = values.length;
                    this.updateValue(values[length - 1]);
                });
        },
        round(val, decimals = this.precision) {
            let precision = Math.pow(10, decimals);

            return Math.round(val * precision) / precision;
        },
        setTimeSystem(timeSystem) {
            this.activeTimeSystem = timeSystem;
        },
        subscribe(domainObject = this.telemetryObject) {
            this.unsubscribe = this.openmct
                .telemetry
                .subscribe(domainObject, this.updateValue.bind(this));
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
            this.datum = datum;

            if (this.isRendering) {
                return;
            }

            const { start, end } = this.openmct.time.bounds();
            const parsedValue = this.timeFormatter.parse(this.datum);

            const beforeStartOfBounds = parsedValue < start;
            const afterEndOfBounds = parsedValue > end;
            if (afterEndOfBounds || beforeStartOfBounds) {
                return;
            }

            this.isRendering = true;
            requestAnimationFrame(() => {
                this.isRendering = false;

                this.curVal = this.round(this.formats[this.valueKey].format(this.datum), this.precision);
            });
        },
        valToPercent(vValue) {
            // Used by dial
            if (vValue >= this.rangeHigh && this.typeFilledDial) {
                // Don't peg at 100% if the gaugeType isn't a filled shape
                return 100;
            }

            return ((vValue - this.rangeLow) / (this.rangeHigh - this.rangeLow)) * 100;
        },
        valToPercentMeter(vValue) {
            return this.round((this.rangeHigh - vValue) / (this.rangeHigh - this.rangeLow) * 100, 2);
        }
    }
};
</script>

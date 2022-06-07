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
    class="c-gauge__wrapper js-gauge-wrapper"
    :class="`c-gauge--${gaugeType}`"
>
    <template v-if="typeDial">
        <svg
            width="0"
            height="0"
            class="c-dial__clip-paths"
        >
            <defs>
                <clipPath
                    id="gaugeBgMask"
                    clipPathUnits="objectBoundingBox"
                >
                    <path d="M0.853553 0.853553C0.944036 0.763071 1 0.638071 1 0.5C1 0.223858 0.776142 0 0.5 0C0.223858 0 0 0.223858 0 0.5C0 0.638071 0.0559644 0.763071 0.146447 0.853553L0.285934 0.714066C0.23115 0.659281 0.197266 0.583598 0.197266 0.5C0.197266 0.332804 0.332804 0.197266 0.5 0.197266C0.667196 0.197266 0.802734 0.332804 0.802734 0.5C0.802734 0.583598 0.76885 0.659281 0.714066 0.714066L0.853553 0.853553Z" />
                </clipPath>
                <clipPath
                    id="gaugeValueMask"
                    clipPathUnits="objectBoundingBox"
                >
                    <path d="M0.18926 0.81074C0.109735 0.731215 0.0605469 0.621351 0.0605469 0.5C0.0605469 0.257298 0.257298 0.0605469 0.5 0.0605469C0.742702 0.0605469 0.939453 0.257298 0.939453 0.5C0.939453 0.621351 0.890265 0.731215 0.81074 0.81074L0.714066 0.714066C0.76885 0.659281 0.802734 0.583599 0.802734 0.5C0.802734 0.332804 0.667196 0.197266 0.5 0.197266C0.332804 0.197266 0.197266 0.332804 0.197266 0.5C0.197266 0.583599 0.23115 0.659281 0.285934 0.714066L0.18926 0.81074Z" />
                </clipPath>
            </defs>
        </svg>

        <svg
            class="c-dial__range c-gauge__range js-gauge-dial-range"
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
            class="c-dial__current-value-text-wrapper"
            viewBox="0 0 512 512"
        >
            <svg
                class="c-dial__current-value-text-sizer"
                :viewBox="curValViewBox"
            >
                <text
                    class="c-dial__current-value-text js-dial-current-value"
                    lengthAdjust="spacing"
                    text-anchor="middle"
                    style="transform: translate(50%, 70%)"
                >{{ curVal }}</text>
            </svg>
            <svg
                class="c-gauge__units c-dial__units"
                viewBox="0 0 50 100"
            >
                <text
                    class="c-dial__units-text"
                    lengthAdjust="spacing"
                    text-anchor="middle"
                    style="transform: translate(50%, 72%)"
                >{{ units }}</text>
            </svg>
        </svg>

        <svg
            class="c-dial__bg"
            viewBox="0 0 10 10"
        >
            <g
                v-if="isDialLowLimit"
                class="c-dial__limit-low"
                :style="`transform: rotate(${dialLowLimitDeg}deg)`"
            >
                <rect
                    v-if="isDialLowLimitLow"
                    class="c-dial__low-limit__low"
                    x="5"
                    y="5"
                    width="5"
                    height="5"
                />
                <rect
                    v-if="isDialLowLimitMid"
                    class="c-dial__low-limit__mid"
                    x="5"
                    y="0"
                    width="5"
                    height="5"
                />
                <rect
                    v-if="isDialLowLimitHigh"
                    class="c-dial__low-limit__high"
                    x="0"
                    y="0"
                    width="5"
                    height="5"
                />
            </g>

            <g
                v-if="isDialHighLimit"
                class="c-dial__limit-high"
                :style="`transform: rotate(${dialHighLimitDeg}deg)`"
            >
                <rect
                    v-if="isDialHighLimitLow"
                    class="c-dial__high-limit__low"
                    x="0"
                    y="5"
                    width="5"
                    height="5"
                />
                <rect
                    v-if="isDialHighLimitMid"
                    class="c-dial__high-limit__mid"
                    x="0"
                    y="0"
                    width="5"
                    height="5"
                />
                <rect
                    v-if="isDialHighLimitHigh"
                    class="c-dial__high-limit__high"
                    x="5"
                    y="0"
                    width="5"
                    height="5"
                />
            </g>
        </svg>

        <svg
            v-if="typeFilledDial"
            class="c-dial__filled-value-wrapper"
            viewBox="0 0 10 10"
        >
            <g
                class="c-dial__filled-value"
                :style="`transform: rotate(${degValueFilledDial}deg)`"
            >
                <rect
                    v-if="isDialFilledValueLow"
                    class="c-dial__filled-value__low"
                    x="5"
                    y="5"
                    width="5"
                    height="5"
                />
                <rect
                    v-if="isDialFilledValueMid"
                    class="c-dial__filled-value__mid"
                    x="5"
                    y="0"
                    width="5"
                    height="5"
                />
                <rect
                    v-if="isDialFilledValueHigh"
                    class="c-dial__filled-value__high"
                    x="0"
                    y="0"
                    width="5"
                    height="5"
                />
            </g>
        </svg>

        <svg
            v-if="valueInBounds && typeNeedleDial"
            class="c-dial__needle-value-wrapper"
            viewBox="0 0 10 10"
        >
            <g
                class="c-dial__needle-value"
                :style="`transform: rotate(${degValue}deg)`"
            >
                <path d="M4.90234 9.39453L5.09766 9.39453L5.30146 8.20874C6.93993 8.05674 8.22265 6.67817 8.22266 5C8.22266 3.22018 6.77982 1.77734 5 1.77734C3.22018 1.77734 1.77734 3.22018 1.77734 5C1.77734 6.67817 3.06007 8.05674 4.69854 8.20874L4.90234 9.39453Z" />
            </g>
        </svg>
    </template>

    <template v-if="typeMeter">
        <div class="c-meter">
            <div
                v-if="displayMinMax"
                class="c-gauge__range c-meter__range js-gauge-meter-range"
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
                        v-if="isMeterLimitHigh"
                        class="c-meter__limit-high"
                        :style="`height: ${meterHighLimitPerc}%`"
                    ></div>

                    <div
                        v-if="isMeterLimitLow"
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
                        v-if="isMeterLimitHigh"
                        class="c-meter__limit-high"
                        :style="`width: ${meterHighLimitPerc}%`"
                    ></div>

                    <div
                        v-if="isMeterLimitLow"
                        class="c-meter__limit-low"
                        :style="`width: ${meterLowLimitPerc}%`"
                    ></div>
                </template>

                <svg
                    class="c-meter__current-value-text-wrapper"
                    viewBox="0 0 512 512"
                >
                    <svg
                        v-if="displayCurVal"
                        class="c-meter__current-value-text-sizer"
                        :viewBox="curValViewBox"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <text
                            class="c-dial__current-value-text js-meter-current-value"
                            lengthAdjust="spacing"
                            text-anchor="middle"
                            style="transform: translate(50%, 70%)"
                        >
                            <tspan>{{ curVal }}</tspan>
                            <tspan
                                v-if="typeMeterHorizontal && displayUnits"
                                class="c-gauge__units"
                                font-size="10"
                            >{{ units }}</tspan>
                        </text>
                        <text
                            v-if="typeMeterVertical && displayUnits"
                            dy="12"
                            class="c-gauge__units"
                            font-size="10"
                            lengthAdjust="spacing"
                            text-anchor="middle"
                            style="transform: translate(50%, 70%)"
                        >{{ units }}</text>
                    </svg>
                </svg>
            </div>
        </div>
    </template>
</div>
</template>

<script>
import { DIAL_VALUE_DEG_OFFSET, getLimitDegree } from '../gauge-limit-util';

const LIMIT_PADDING_IN_PERCENT = 10;
const DEFAULT_CURRENT_VALUE = '--';

export default {
    name: 'Gauge',
    inject: ['openmct', 'domainObject', 'composition'],
    data() {
        let gaugeController = this.domainObject.configuration.gaugeController;

        return {
            curVal: DEFAULT_CURRENT_VALUE,
            digits: 3,
            precision: gaugeController.precision,
            displayMinMax: gaugeController.isDisplayMinMax,
            displayCurVal: gaugeController.isDisplayCurVal,
            displayUnits: gaugeController.isDisplayUnits,
            limitHigh: gaugeController.limitHigh,
            limitLow: gaugeController.limitLow,
            rangeHigh: gaugeController.max,
            rangeLow: gaugeController.min,
            gaugeType: gaugeController.gaugeType,
            showUnits: gaugeController.showUnits,
            activeTimeSystem: this.openmct.time.timeSystem(),
            units: ''
        };
    },
    computed: {
        degValue() {
            return this.percentToDegrees(this.valToPercent(this.curVal));
        },
        degValueFilledDial() {
            if (this.curVal > this.rangeHigh) {
                return this.percentToDegrees(100);
            }

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
        isDialLowLimit() {
            return this.limitLow.length > 0 && this.dialLowLimitDeg < getLimitDegree('low', 'max');
        },
        isDialLowLimitLow() {
            return this.dialLowLimitDeg >= getLimitDegree('low', 'q1');
        },
        isDialLowLimitMid() {
            return this.dialLowLimitDeg >= getLimitDegree('low', 'q2');
        },
        isDialLowLimitHigh() {
            return this.dialLowLimitDeg >= getLimitDegree('low', 'q3');
        },
        isDialHighLimit() {
            return this.limitHigh.length > 0 && this.dialHighLimitDeg < getLimitDegree('high', 'max');
        },
        isDialHighLimitLow() {
            return this.dialHighLimitDeg <= getLimitDegree('high', 'max');
        },
        isDialHighLimitMid() {
            return this.dialHighLimitDeg <= getLimitDegree('high', 'q2');
        },
        isDialHighLimitHigh() {
            return this.dialHighLimitDeg <= getLimitDegree('high', 'q3');
        },
        isDialFilledValueLow() {
            return this.degValue >= getLimitDegree('low', 'q1');
        },
        isDialFilledValueMid() {
            return this.degValue >= getLimitDegree('low', 'q2');
        },
        isDialFilledValueHigh() {
            return this.degValue >= getLimitDegree('low', 'q3');
        },
        isMeterLimitHigh() {
            return this.limitHigh.length > 0 && this.meterHighLimitPerc > 0;
        },
        isMeterLimitLow() {
            return this.limitLow.length > 0 && this.meterLowLimitPerc > 0;
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
        getLimitDegree: getLimitDegree,
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
            return this.round(((vPercent / 100) * 270) + DIAL_VALUE_DEG_OFFSET, 2);
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

            this.curVal = DEFAULT_CURRENT_VALUE;
            this.formats = null;
            this.limitHigh = '';
            this.limitLow = '';
            this.metadata = null;
            this.rangeHigh = null;
            this.rangeLow = null;
            this.valueKey = null;
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

            this.units = this.metadata.value(this.valueKey).unit || '';
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
                this.openmct.notifications.error('No limits definition for given telemetry, hiding low and high limits');
                this.displayMinMax = false;
                this.limitHigh = '';
                this.limitLow = '';

                return;
            }

            this.limitHigh = this.round(limits.high[this.valueKey]);
            this.limitLow = this.round(limits.low[this.valueKey]);
            this.rangeHigh = this.round(this.limitHigh + this.limitHigh * LIMIT_PADDING_IN_PERCENT / 100);
            this.rangeLow = this.round(this.limitLow - Math.abs(this.limitLow * LIMIT_PADDING_IN_PERCENT / 100));

            this.displayMinMax = this.domainObject.configuration.gaugeController.isDisplayMinMax;
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
                // For filled dial, clip values over the high range to prevent over-rotation
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

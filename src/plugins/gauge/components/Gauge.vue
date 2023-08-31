<!--
 Open MCT, Copyright (c) 2014-2023, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
  <div class="c-gauge__wrapper js-gauge-wrapper" :class="gaugeClasses" :title="gaugeTitle">
    <template v-if="typeDial">
      <svg
        ref="gauge"
        class="c-gauge c-dial"
        viewBox="0 0 10 10"
        @mouseover.ctrl="showToolTip"
        @mouseleave="hideToolTip"
      >
        <g class="c-dial__masks">
          <mask id="gaugeValueMask">
            <path
              d="M1.8926 8.1074C1.09734 7.31215 0.605469 6.21352 0.605469 5C0.605469 2.57297 2.57297 0.605469 5 0.605469C7.42703 0.605469 9.39453 2.57297 9.39453 5C9.39453 6.21352 8.90266 7.31215 8.1074 8.1074L7.14066 7.14066C7.6885 6.59281 8.02734 5.83598 8.02734 5C8.02734 3.32804 6.67196 1.97266 5 1.97266C3.32804 1.97266 1.97266 3.32804 1.97266 5C1.97266 5.83598 2.3115 6.59281 2.85934 7.14066L1.8926 8.1074Z"
              fill="white"
            />
          </mask>
          <mask id="gaugeBgMask">
            <path
              d="M8.53553 8.53553C9.44036 7.63071 10 6.38071 10 5C10 2.23858 7.76142 0 5 0C2.23858 0 0 2.23858 0 5C0 6.38071 0.559644 7.63071 1.46447 8.53553L2.85934 7.14066C2.3115 6.59281 1.97266 5.83598 1.97266 5C1.97266 3.32804 3.32804 1.97266 5 1.97266C6.67196 1.97266 8.02734 3.32804 8.02734 5C8.02734 5.83598 7.6885 6.59281 7.14066 7.14066L8.53553 8.53553Z"
              fill="white"
            />
          </mask>
        </g>

        <g class="c-dial__graphics" mask="url(#gaugeBgMask)">
          <rect class="c-dial__bg" x="0" y="0" width="10" height="10" />
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
        </g>

        <g class="c-dial__graphics" mask="url(#gaugeValueMask)">
          <g
            v-if="typeFilledDial"
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
          <g
            v-if="valueInBounds && typeNeedleDial"
            class="c-dial__needle-value"
            :style="`transform: rotate(${degValue}deg)`"
          >
            <path
              d="M4.90234 9.39453L5.09766 9.39453L5.30146 8.20874C6.93993 8.05674 8.22265 6.67817 8.22266 5C8.22266 3.22018 6.77982 1.77734 5 1.77734C3.22018 1.77734 1.77734 3.22018 1.77734 5C1.77734 6.67817 3.06007 8.05674 4.69854 8.20874L4.90234 9.39453Z"
            />
          </g>
          <path
            id="dialTextPath"
            class="c-dial__range-msg-path"
            d="M8.3501 5.0001C8.3501 6.85025 6.85025 8.3501 5.0001 8.3501C3.14994 8.3501 1.6501 6.85025 1.6501 5.0001C1.6501 3.14994 3.14994 1.6501 5.0001 1.6501C6.85025 1.6501 8.3501 3.14994 8.3501 5.0001Z"
            fill="none"
            style="transform-origin: center; transform: rotate(182deg)"
          />
        </g>
        <g class="c-dial__text">
          <text
            v-if="displayUnits"
            x="50%"
            y="70%"
            text-anchor="middle"
            class="c-gauge__units"
            font-size="8%"
          >
            {{ units }}
          </text>

          <g
            v-if="displayMinMax"
            class="c-dial__range-text js-gauge-dial-range"
            :font-size="rangeFontSize"
          >
            <text transform="translate(1.5 8.7) rotate(-45)" dominant-baseline="hanging">
              {{ rangeLow }}
            </text>
            <text
              transform="translate(8.4 8.7) rotate(45)"
              dominant-baseline="hanging"
              text-anchor="end"
            >
              {{ rangeHigh }}
            </text>
          </g>
        </g>

        <svg
          v-if="!valueInBounds && valueExpected"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          xml:space="preserve"
          class="c-dial__value-oor-indicator"
          x="45%"
          y="80%"
          width="1"
          height="1"
        >
          <path
            d="M448 0H64C28.7.1.1 28.7 0 64v384c.1 35.3 28.7 63.9 64 64h384c35.3-.1 63.9-28.7 64-64V64c-.1-35.3-28.7-63.9-64-64zM288 448h-64v-64h64v64zm10.9-192L280 352h-48l-18.9-96V64H299v192h-.1z"
          />
        </svg>

        <svg
          class="c-gauge__current-value-text-wrapper"
          :viewBox="curValViewBox"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect class="svg-viewbox-debug" x="0" y="0" width="100%" height="100%" />
          <text
            class="c-dial__current-value-text js-dial-current-value"
            font-size="3.5"
            lengthAdjust="spacing"
            text-anchor="middle"
            dominant-baseline="middle"
            x="50%"
            y="50%"
          >
            <template v-if="displayCurVal">
              <tspan>{{ curVal }}</tspan>
            </template>
          </text>
        </svg>
      </svg>
    </template>

    <template v-if="typeMeter">
      <div class="c-meter">
        <div v-if="displayMinMax" class="c-gauge__range c-meter__range js-gauge-meter-range">
          <div class="c-meter__range__high">{{ rangeHigh }}</div>
          <div class="c-meter__range__low">{{ rangeLow }}</div>
        </div>
        <div class="c-meter__bg">
          <div v-if="!valueInBounds && valueExpected" class="c-meter__value-oor-indicator">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              :preserveAspectRatio="meterOutOfRangeIndicatorAspectRatio"
            >
              <path
                d="M448 0H64C28.7.1.1 28.7 0 64v384c.1 35.3 28.7 63.9 64 64h384c35.3-.1 63.9-28.7 64-64V64c-.1-35.3-28.7-63.9-64-64zM288 448h-64v-64h64v64zm10.9-192L280 352h-48l-18.9-96V64H299v192h-.1z"
              />
            </svg>
          </div>

          <template v-if="typeMeterVertical">
            <div
              v-if="valueExpected"
              class="c-meter__value"
              :class="{ 'c-meter__value-needle': typeNeedleMeter }"
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
              v-if="valueExpected"
              class="c-meter__value"
              :class="{ 'c-meter__value-needle': typeNeedleMeter }"
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
            class="c-gauge__current-value-text-wrapper"
            :viewBox="curValViewBox"
            preserveAspectRatio="xMidYMid meet"
          >
            <rect class="svg-viewbox-debug" x="0" y="0" width="100%" height="100%" />
            <text
              class="c-meter__current-value-text js-gauge-current-value"
              font-size="4"
              lengthAdjust="spacing"
              text-anchor="middle"
              :dominant-baseline="meterTextBaseline"
              x="50%"
              y="50%"
            >
              <template v-if="displayCurVal">
                <tspan>{{ curVal }}</tspan>
                <tspan
                  v-if="typeMeterHorizontal && displayUnits"
                  class="c-gauge__units"
                  font-size="80%"
                >
                  {{ units }}
                </tspan>
                <tspan
                  v-if="typeMeterVertical && displayUnits"
                  x="50%"
                  dy="3.5"
                  class="c-gauge__units"
                  font-size="80%"
                >
                  {{ units }}
                </tspan>
              </template>
            </text>
          </svg>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import stalenessMixin from '@/ui/mixins/staleness-mixin';

import tooltipHelpers from '../../../api/tooltips/tooltipMixins';
import { DIAL_VALUE_DEG_OFFSET, getLimitDegree } from '../gauge-limit-util';

const LIMIT_PADDING_IN_PERCENT = 10;
const DEFAULT_CURRENT_VALUE = '--';

export default {
  name: 'Gauge',
  mixins: [stalenessMixin, tooltipHelpers],
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
    meterOutOfRangeIndicatorAspectRatio() {
      return this.typeMeterVertical ? 'xMidYMax meet' : 'xMinYMid meet';
    },
    meterTextBaseline() {
      return this.typeMeterVertical ? 'auto' : 'middle';
    },
    curValViewBox() {
      const DIGITS_RATIO = 3;
      const VIEWBOX_STR = '0 0 X 10';

      return VIEWBOX_STR.replace('X', this.digits * DIGITS_RATIO);
    },
    gaugeClasses() {
      let classes = [`c-gauge--${this.gaugeType}`];

      if (this.isStale) {
        classes.push('is-stale');
      }

      return classes;
    },
    rangeFontSize() {
      const CHAR_THRESHOLD = 3;
      const START_PERC = 8.5;
      const REDUCE_PERC = 0.8;
      const RANGE_CHARS_MAX = Math.max(
        this.rangeLow.toString().length,
        this.rangeHigh.toString().length
      );

      return this.fontSizeFromChars(RANGE_CHARS_MAX, CHAR_THRESHOLD, START_PERC, REDUCE_PERC);
    },
    isDialLowLimit() {
      return (
        this.limitLow.toString().length > 0 && this.dialLowLimitDeg < getLimitDegree('low', 'max')
      );
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
      return (
        this.limitHigh.toString().length > 0 &&
        this.dialHighLimitDeg < getLimitDegree('high', 'max')
      );
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
      return this.limitHigh.toString().length > 0 && this.meterHighLimitPerc > 0;
    },
    isMeterLimitLow() {
      return this.limitLow.toString().length > 0 && this.meterLowLimitPerc > 0;
    },
    gaugeTitle() {
      return this.valueInBounds
        ? 'Gauge'
        : 'Value is currently out of range and cannot be graphically displayed';
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
    typeFilledMeter() {
      return true; // Stubbing in for future capability
    },
    typeNeedleMeter() {
      return false; // Stubbing in for future capability
    },
    meterValueToPerc() {
      const meterDirection = this.typeMeterInverted ? -1 : 1;

      if (this.typeFilledMeter) {
        // Filled meter is a filled rectangle that is transformed along a vertical or horizontal axis
        // So never move it below the low range more than 100%, or above the high range more than 0%
        if (this.curVal <= this.rangeLow) {
          return meterDirection * 100;
        }

        if (this.curVal >= this.rangeHigh) {
          return 0;
        }
      }

      return this.valToPercentMeter(this.curVal) * meterDirection;
    },
    meterHighLimitPerc() {
      return this.valToPercentMeter(this.limitHigh);
    },
    meterLowLimitPerc() {
      return 100 - this.valToPercentMeter(this.limitLow);
    },
    valueExpected() {
      if (this.curVal === undefined || Object.is(this.curVal, 'null')) {
        return false;
      }

      return this.curVal.toString().indexOf(DEFAULT_CURRENT_VALUE) === -1;
    },
    valueInBounds() {
      return this.curVal >= this.rangeLow && this.curVal <= this.rangeHigh;
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
  unmounted() {
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

      this.subscribeToStaleness(domainObject);
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
    fontSizeFromChars(charNum, charThreshold, startPerc, reducePerc) {
      const fs =
        charNum <= charThreshold ? startPerc : startPerc - (charNum - charThreshold) * reducePerc;

      return fs.toString() + '%';
    },
    matchGaugeType(str) {
      return this.gaugeType.indexOf(str) !== -1;
    },
    percentToDegrees(vPercent) {
      return this.round((vPercent / 100) * 270 + DIAL_VALUE_DEG_OFFSET, 2);
    },
    removeFromComposition(telemetryObject = this.telemetryObject) {
      this.composition.remove(telemetryObject);
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

      this.triggerUnsubscribeFromStaleness();

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

      this.valueKey = this.metadata.valuesForHints(['range'])[0].source;

      const options = {
        strategy: 'latest',
        timeContext: this.openmct.time.getContextForView([])
      };
      this.openmct.telemetry.request(domainObject, options).then((values) => {
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
      this.unsubscribe = this.openmct.telemetry.subscribe(
        domainObject,
        this.updateValue.bind(this)
      );
    },
    updateLimits(telemetryLimit) {
      if (
        !telemetryLimit ||
        !this.domainObject.configuration.gaugeController.isUseTelemetryLimits
      ) {
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
        this.openmct.notifications.error(
          'No limits definition for given telemetry, hiding low and high limits'
        );
        this.displayMinMax = false;
        this.limitHigh = '';
        this.limitLow = '';

        return;
      }

      this.limitHigh = this.round(limits.high[this.valueKey]);
      this.limitLow = this.round(limits.low[this.valueKey]);
      this.rangeHigh = this.round(
        this.limitHigh + (this.limitHigh * LIMIT_PADDING_IN_PERCENT) / 100
      );
      this.rangeLow = this.round(
        this.limitLow - Math.abs((this.limitLow * LIMIT_PADDING_IN_PERCENT) / 100)
      );

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
      return this.round(((this.rangeHigh - vValue) / (this.rangeHigh - this.rangeLow)) * 100, 2);
    },
    async showToolTip() {
      const { CENTER } = this.openmct.tooltips.TOOLTIP_LOCATIONS;
      this.buildToolTip(await this.getTelemetryPathString(), CENTER, 'gauge');
    }
  }
};
</script>

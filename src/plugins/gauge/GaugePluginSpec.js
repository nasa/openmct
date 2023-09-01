/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import { debounce } from 'lodash';
import { createOpenMct, resetApplicationState } from 'utils/testing';
import Vue from 'vue';

let gaugeDomainObject = {
  identifier: {
    key: 'gauge',
    namespace: 'test-namespace'
  },
  type: 'gauge',
  composition: []
};

describe('Gauge plugin', () => {
  let openmct;
  let child;
  let gaugeHolder;

  beforeEach((done) => {
    gaugeHolder = document.createElement('div');
    gaugeHolder.style.display = 'block';
    gaugeHolder.style.width = '1920px';
    gaugeHolder.style.height = '1080px';

    child = document.createElement('div');
    gaugeHolder.appendChild(child);

    openmct = createOpenMct();
    openmct.on('start', done);

    openmct.install(openmct.plugins.Gauge());

    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  it('Plugin installed by default', () => {
    const GaugeType = openmct.types.get('gauge');

    expect(GaugeType).not.toBeNull();
    expect(GaugeType.definition.name).toEqual('Gauge');
  });

  it('Gauge plugin is creatable', () => {
    const GaugeType = openmct.types.get('gauge');

    expect(GaugeType.definition.creatable).toBeTrue();
  });

  it('Gauge plugin is creatable', () => {
    const GaugeType = openmct.types.get('gauge');

    expect(GaugeType.definition.creatable).toBeTrue();
  });

  it('Gauge form controller', () => {
    const gaugeController = openmct.forms.getFormControl('gauge-controller');
    expect(gaugeController).toBeDefined();
  });

  describe('Gauge with Filled Dial', () => {
    let gaugeViewProvider;
    let gaugeView;
    let gaugeViewObject;
    let mutablegaugeObject;
    let randomValue;

    const minValue = -1;
    const maxValue = 1;

    beforeEach(() => {
      randomValue = Math.random();
      gaugeViewObject = {
        ...gaugeDomainObject,
        configuration: {
          gaugeController: {
            gaugeType: 'dial-filled',
            isDisplayMinMax: true,
            isDisplayCurVal: true,
            isDisplayUnits: true,
            isUseTelemetryLimits: false,
            limitLow: -0.9,
            limitHigh: 0.9,
            max: maxValue,
            min: minValue,
            precision: 2
          }
        },
        composition: [
          {
            namespace: 'test-namespace',
            key: 'test-object'
          }
        ],
        id: 'test-object',
        name: 'gauge'
      };

      const testObjectProvider = jasmine.createSpyObj('testObjectProvider', [
        'get',
        'create',
        'update',
        'observe'
      ]);

      openmct.editor = {};
      openmct.editor.isEditing = () => false;

      const applicableViews = openmct.objectViews.get(gaugeViewObject, [gaugeViewObject]);
      gaugeViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'gauge');

      testObjectProvider.get.and.returnValue(Promise.resolve(gaugeViewObject));
      testObjectProvider.create.and.returnValue(Promise.resolve(gaugeViewObject));
      openmct.objects.addProvider('test-namespace', testObjectProvider);
      testObjectProvider.observe.and.returnValue(() => {});
      testObjectProvider.create.and.returnValue(Promise.resolve(true));
      testObjectProvider.update.and.returnValue(Promise.resolve(true));

      spyOn(openmct.telemetry, 'getMetadata').and.returnValue({
        valuesForHints: () => {
          return [
            {
              source: 'sin'
            }
          ];
        },
        value: () => 1
      });
      spyOn(openmct.telemetry, 'getValueFormatter').and.returnValue({
        parse: () => {
          return 2000;
        }
      });
      spyOn(openmct.telemetry, 'getFormatMap').and.returnValue({
        sin: {
          format: (datum) => {
            return randomValue;
          }
        }
      });
      spyOn(openmct.telemetry, 'getLimits').and.returnValue({ limits: () => Promise.resolve() });
      spyOn(openmct.telemetry, 'request').and.returnValue(Promise.resolve([randomValue]));
      spyOn(openmct.time, 'bounds').and.returnValue({
        start: 1000,
        end: 5000
      });

      return openmct.objects.getMutable(gaugeViewObject.identifier).then((mutableObject) => {
        mutablegaugeObject = mutableObject;
        gaugeView = gaugeViewProvider.view(mutablegaugeObject, [mutablegaugeObject]);
        gaugeView.show(child);

        return Vue.nextTick();
      });
    });

    afterEach(() => {
      gaugeView.destroy();

      return resetApplicationState(openmct);
    });

    it('provides gauge view', () => {
      expect(gaugeViewProvider).toBeDefined();
    });

    it('renders gauge element', () => {
      const gaugeElement = gaugeHolder.querySelectorAll('.js-gauge-wrapper');
      expect(gaugeElement.length).toBe(1);
    });

    it('renders major elements', () => {
      const wrapperElement = gaugeHolder.querySelector('.js-gauge-wrapper');
      const rangeElement = gaugeHolder.querySelector('.js-gauge-dial-range');
      const valueElement = gaugeHolder.querySelector('.js-dial-current-value');

      const hasMajorElements = Boolean(wrapperElement && rangeElement && valueElement);

      expect(hasMajorElements).toBe(true);
    });

    it('renders correct min max values', () => {
      expect(gaugeHolder.querySelector('.js-gauge-dial-range').textContent).toMatch(
        new RegExp(`\\s*${minValue}\\s*${maxValue}\\s*`)
      );
    });

    it('renders correct current value', (done) => {
      function WatchUpdateValue() {
        const textElement = gaugeHolder.querySelector('.js-dial-current-value');
        expect(
          Number(textElement.textContent).toFixed(
            gaugeViewObject.configuration.gaugeController.precision
          )
        ).toBe(randomValue.toFixed(gaugeViewObject.configuration.gaugeController.precision));
        done();
      }

      const debouncedWatchUpdate = debounce(WatchUpdateValue, 200);
      Vue.nextTick(debouncedWatchUpdate);
    });
  });

  describe('Gauge with Needle Dial', () => {
    let gaugeViewProvider;
    let gaugeView;
    let gaugeViewObject;
    let mutablegaugeObject;
    let randomValue;

    const minValue = -1;
    const maxValue = 1;
    beforeEach(() => {
      randomValue = Math.random();
      gaugeViewObject = {
        ...gaugeDomainObject,
        configuration: {
          gaugeController: {
            gaugeType: 'dial-needle',
            isDisplayMinMax: true,
            isDisplayCurVal: true,
            isDisplayUnits: true,
            isUseTelemetryLimits: false,
            limitLow: -0.9,
            limitHigh: 0.9,
            max: maxValue,
            min: minValue,
            precision: 2
          }
        },
        composition: [
          {
            namespace: 'test-namespace',
            key: 'test-object'
          }
        ],
        id: 'test-object',
        name: 'gauge'
      };

      const testObjectProvider = jasmine.createSpyObj('testObjectProvider', [
        'get',
        'create',
        'update',
        'observe'
      ]);

      openmct.editor = {};
      openmct.editor.isEditing = () => false;

      const applicableViews = openmct.objectViews.get(gaugeViewObject, [gaugeViewObject]);
      gaugeViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'gauge');

      testObjectProvider.get.and.returnValue(Promise.resolve(gaugeViewObject));
      testObjectProvider.create.and.returnValue(Promise.resolve(gaugeViewObject));
      openmct.objects.addProvider('test-namespace', testObjectProvider);
      testObjectProvider.observe.and.returnValue(() => {});
      testObjectProvider.create.and.returnValue(Promise.resolve(true));
      testObjectProvider.update.and.returnValue(Promise.resolve(true));

      spyOn(openmct.telemetry, 'getMetadata').and.returnValue({
        valuesForHints: () => {
          return [
            {
              source: 'sin'
            }
          ];
        },
        value: () => 1
      });
      spyOn(openmct.telemetry, 'getValueFormatter').and.returnValue({
        parse: () => {
          return 2000;
        }
      });
      spyOn(openmct.telemetry, 'getFormatMap').and.returnValue({
        sin: {
          format: (datum) => {
            return randomValue;
          }
        }
      });
      spyOn(openmct.telemetry, 'getLimits').and.returnValue({ limits: () => Promise.resolve() });
      spyOn(openmct.telemetry, 'request').and.returnValue(Promise.resolve([randomValue]));
      spyOn(openmct.time, 'bounds').and.returnValue({
        start: 1000,
        end: 5000
      });

      return openmct.objects.getMutable(gaugeViewObject.identifier).then((mutableObject) => {
        mutablegaugeObject = mutableObject;
        gaugeView = gaugeViewProvider.view(mutablegaugeObject, [mutablegaugeObject]);
        gaugeView.show(child);

        return Vue.nextTick();
      });
    });

    afterEach(() => {
      gaugeView.destroy();

      return resetApplicationState(openmct);
    });

    it('provides gauge view', () => {
      expect(gaugeViewProvider).toBeDefined();
    });

    it('renders gauge element', () => {
      const gaugeElement = gaugeHolder.querySelectorAll('.js-gauge-wrapper');
      expect(gaugeElement.length).toBe(1);
    });

    it('renders major elements', () => {
      const wrapperElement = gaugeHolder.querySelector('.js-gauge-wrapper');
      const rangeElement = gaugeHolder.querySelector('.js-gauge-dial-range');
      const valueElement = gaugeHolder.querySelector('.js-dial-current-value');

      const hasMajorElements = Boolean(wrapperElement && rangeElement && valueElement);

      expect(hasMajorElements).toBe(true);
    });

    it('renders correct min max values', () => {
      expect(gaugeHolder.querySelector('.js-gauge-dial-range').textContent).toMatch(
        new RegExp(`\\s*${minValue}\\s*${maxValue}\\s*`)
      );
    });

    it('renders correct current value', (done) => {
      function WatchUpdateValue() {
        const textElement = gaugeHolder.querySelector('.js-dial-current-value');
        expect(
          Number(textElement.textContent).toFixed(
            gaugeViewObject.configuration.gaugeController.precision
          )
        ).toBe(randomValue.toFixed(gaugeViewObject.configuration.gaugeController.precision));
        done();
      }

      const debouncedWatchUpdate = debounce(WatchUpdateValue, 200);
      Vue.nextTick(debouncedWatchUpdate);
    });
  });

  describe('Gauge with Vertical Meter', () => {
    let gaugeViewProvider;
    let gaugeView;
    let gaugeViewObject;
    let mutablegaugeObject;
    let randomValue;

    const minValue = -1;
    const maxValue = 1;
    beforeEach(() => {
      randomValue = Math.random();
      gaugeViewObject = {
        ...gaugeDomainObject,
        configuration: {
          gaugeController: {
            gaugeType: 'meter-vertical',
            isDisplayMinMax: true,
            isDisplayCurVal: true,
            isDisplayUnits: true,
            isUseTelemetryLimits: false,
            limitLow: -0.9,
            limitHigh: 0.9,
            max: maxValue,
            min: minValue,
            precision: 2
          }
        },
        composition: [
          {
            namespace: 'test-namespace',
            key: 'test-object'
          }
        ],
        id: 'test-object',
        name: 'gauge'
      };

      const testObjectProvider = jasmine.createSpyObj('testObjectProvider', [
        'get',
        'create',
        'update',
        'observe'
      ]);

      openmct.editor = {};
      openmct.editor.isEditing = () => false;

      const applicableViews = openmct.objectViews.get(gaugeViewObject, [gaugeViewObject]);
      gaugeViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'gauge');

      testObjectProvider.get.and.returnValue(Promise.resolve(gaugeViewObject));
      testObjectProvider.create.and.returnValue(Promise.resolve(gaugeViewObject));
      openmct.objects.addProvider('test-namespace', testObjectProvider);
      testObjectProvider.observe.and.returnValue(() => {});
      testObjectProvider.create.and.returnValue(Promise.resolve(true));
      testObjectProvider.update.and.returnValue(Promise.resolve(true));

      spyOn(openmct.telemetry, 'getMetadata').and.returnValue({
        valuesForHints: () => {
          return [
            {
              source: 'sin'
            }
          ];
        },
        value: () => 1
      });
      spyOn(openmct.telemetry, 'getValueFormatter').and.returnValue({
        parse: () => {
          return 2000;
        }
      });
      spyOn(openmct.telemetry, 'getFormatMap').and.returnValue({
        sin: {
          format: (datum) => {
            return randomValue;
          }
        }
      });
      spyOn(openmct.telemetry, 'getLimits').and.returnValue({ limits: () => Promise.resolve() });
      spyOn(openmct.telemetry, 'request').and.returnValue(Promise.resolve([randomValue]));
      spyOn(openmct.time, 'bounds').and.returnValue({
        start: 1000,
        end: 5000
      });

      return openmct.objects.getMutable(gaugeViewObject.identifier).then((mutableObject) => {
        mutablegaugeObject = mutableObject;
        gaugeView = gaugeViewProvider.view(mutablegaugeObject, [mutablegaugeObject]);
        gaugeView.show(child);

        return Vue.nextTick();
      });
    });

    afterEach(() => {
      gaugeView.destroy();

      return resetApplicationState(openmct);
    });

    it('provides gauge view', () => {
      expect(gaugeViewProvider).toBeDefined();
    });

    it('renders gauge element', () => {
      const gaugeElement = gaugeHolder.querySelectorAll('.js-gauge-wrapper');
      expect(gaugeElement.length).toBe(1);
    });

    it('renders major elements', () => {
      const wrapperElement = gaugeHolder.querySelector('.js-gauge-wrapper');
      const rangeElement = gaugeHolder.querySelector('.js-gauge-meter-range');
      const valueElement = gaugeHolder.querySelector('.js-gauge-current-value');

      const hasMajorElements = Boolean(wrapperElement && rangeElement && valueElement);

      expect(hasMajorElements).toBe(true);
    });

    it('renders correct min max values', () => {
      expect(gaugeHolder.querySelector('.js-gauge-meter-range').textContent).toMatch(
        new RegExp(`\\s*${maxValue}\\s*${minValue}\\s*`)
      );
    });

    it('renders correct current value', (done) => {
      function WatchUpdateValue() {
        const textElement = gaugeHolder.querySelector('.js-gauge-current-value');
        expect(
          Number(textElement.textContent).toFixed(
            gaugeViewObject.configuration.gaugeController.precision
          )
        ).toBe(randomValue.toFixed(gaugeViewObject.configuration.gaugeController.precision));
        done();
      }

      const debouncedWatchUpdate = debounce(WatchUpdateValue, 200);
      Vue.nextTick(debouncedWatchUpdate);
    });
  });

  describe('Gauge with Vertical Meter Inverted', () => {
    let gaugeViewProvider;
    let gaugeView;
    let gaugeViewObject;
    let mutablegaugeObject;

    beforeEach(() => {
      gaugeViewObject = {
        ...gaugeDomainObject,
        configuration: {
          gaugeController: {
            gaugeType: 'meter-vertical',
            isDisplayMinMax: true,
            isDisplayCurVal: true,
            isDisplayUnits: true,
            isUseTelemetryLimits: false,
            limitLow: -0.9,
            limitHigh: 0.9,
            max: 1,
            min: -1,
            precision: 2
          }
        },
        id: 'test-object',
        name: 'gauge'
      };

      const testObjectProvider = jasmine.createSpyObj('testObjectProvider', [
        'get',
        'create',
        'update',
        'observe'
      ]);

      openmct.editor = {};
      openmct.editor.isEditing = () => false;

      const applicableViews = openmct.objectViews.get(gaugeViewObject, [gaugeViewObject]);
      gaugeViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'gauge');

      testObjectProvider.get.and.returnValue(Promise.resolve(gaugeViewObject));
      testObjectProvider.create.and.returnValue(Promise.resolve(gaugeViewObject));
      openmct.objects.addProvider('test-namespace', testObjectProvider);
      testObjectProvider.observe.and.returnValue(() => {});
      testObjectProvider.create.and.returnValue(Promise.resolve(true));
      testObjectProvider.update.and.returnValue(Promise.resolve(true));

      return openmct.objects.getMutable(gaugeViewObject.identifier).then((mutableObject) => {
        mutablegaugeObject = mutableObject;

        gaugeView = gaugeViewProvider.view(mutablegaugeObject, [mutablegaugeObject]);
        gaugeView.show(child);

        return Vue.nextTick();
      });
    });

    afterEach(() => {
      gaugeView.destroy();

      return resetApplicationState(openmct);
    });

    it('provides gauge view', () => {
      expect(gaugeViewProvider).toBeDefined();
    });

    it('renders gauge element', () => {
      const gaugeElement = gaugeHolder.querySelectorAll('.js-gauge-wrapper');
      expect(gaugeElement.length).toBe(1);
    });

    it('renders major elements', () => {
      const wrapperElement = gaugeHolder.querySelector('.js-gauge-wrapper');
      const rangeElement = gaugeHolder.querySelector('.js-gauge-meter-range');
      const valueElement = gaugeHolder.querySelector('.js-gauge-current-value');

      const hasMajorElements = Boolean(wrapperElement && rangeElement && valueElement);

      expect(hasMajorElements).toBe(true);
    });
  });

  describe('Gauge with Horizontal Meter', () => {
    let gaugeViewProvider;
    let gaugeView;
    let gaugeViewObject;
    let mutablegaugeObject;

    beforeEach(() => {
      gaugeViewObject = {
        ...gaugeDomainObject,
        configuration: {
          gaugeController: {
            gaugeType: 'meter-vertical',
            isDisplayMinMax: true,
            isDisplayCurVal: true,
            isDisplayUnits: true,
            isUseTelemetryLimits: false,
            limitLow: -0.9,
            limitHigh: 0.9,
            max: 1,
            min: -1,
            precision: 2
          }
        },
        id: 'test-object',
        name: 'gauge'
      };

      const testObjectProvider = jasmine.createSpyObj('testObjectProvider', [
        'get',
        'create',
        'update',
        'observe'
      ]);

      openmct.editor = {};
      openmct.editor.isEditing = () => false;

      const applicableViews = openmct.objectViews.get(gaugeViewObject, [gaugeViewObject]);
      gaugeViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'gauge');

      testObjectProvider.get.and.returnValue(Promise.resolve(gaugeViewObject));
      testObjectProvider.create.and.returnValue(Promise.resolve(gaugeViewObject));
      openmct.objects.addProvider('test-namespace', testObjectProvider);
      testObjectProvider.observe.and.returnValue(() => {});
      testObjectProvider.create.and.returnValue(Promise.resolve(true));
      testObjectProvider.update.and.returnValue(Promise.resolve(true));

      return openmct.objects.getMutable(gaugeViewObject.identifier).then((mutableObject) => {
        mutablegaugeObject = mutableObject;

        gaugeView = gaugeViewProvider.view(mutablegaugeObject, [mutablegaugeObject]);
        gaugeView.show(child);

        return Vue.nextTick();
      });
    });

    afterEach(() => {
      gaugeView.destroy();

      return resetApplicationState(openmct);
    });

    it('provides gauge view', () => {
      expect(gaugeViewProvider).toBeDefined();
    });

    it('renders gauge element', () => {
      const gaugeElement = gaugeHolder.querySelectorAll('.js-gauge-wrapper');
      expect(gaugeElement.length).toBe(1);
    });

    it('renders major elements', () => {
      const wrapperElement = gaugeHolder.querySelector('.js-gauge-wrapper');
      const rangeElement = gaugeHolder.querySelector('.c-gauge__range');
      const curveElement = gaugeHolder.querySelector('.c-meter');

      const hasMajorElements = Boolean(wrapperElement && rangeElement && curveElement);

      expect(hasMajorElements).toBe(true);
    });
  });

  describe('Gauge with Filled Dial with Use Telemetry Limits', () => {
    let gaugeViewProvider;
    let gaugeView;
    let gaugeViewObject;
    let mutablegaugeObject;
    let randomValue;

    beforeEach(() => {
      randomValue = Math.random();

      gaugeViewObject = {
        ...gaugeDomainObject,
        configuration: {
          gaugeController: {
            gaugeType: 'dial-filled',
            isDisplayMinMax: true,
            isDisplayCurVal: true,
            isDisplayUnits: true,
            isUseTelemetryLimits: true,
            limitLow: 10,
            limitHigh: 90,
            max: 100,
            min: 0,
            precision: 2
          }
        },
        composition: [
          {
            namespace: 'test-namespace',
            key: 'test-object'
          }
        ],
        id: 'test-object',
        name: 'gauge'
      };

      const testObjectProvider = jasmine.createSpyObj('testObjectProvider', [
        'get',
        'create',
        'update',
        'observe'
      ]);

      openmct.editor = {};
      openmct.editor.isEditing = () => false;

      const applicableViews = openmct.objectViews.get(gaugeViewObject, [gaugeViewObject]);
      gaugeViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'gauge');

      testObjectProvider.get.and.returnValue(Promise.resolve(gaugeViewObject));
      testObjectProvider.create.and.returnValue(Promise.resolve(gaugeViewObject));
      openmct.objects.addProvider('test-namespace', testObjectProvider);
      testObjectProvider.observe.and.returnValue(() => {});
      testObjectProvider.create.and.returnValue(Promise.resolve(true));
      testObjectProvider.update.and.returnValue(Promise.resolve(true));

      spyOn(openmct.telemetry, 'getMetadata').and.returnValue({
        valuesForHints: () => {
          return [
            {
              source: 'sin'
            }
          ];
        },
        value: () => 1
      });
      spyOn(openmct.telemetry, 'getValueFormatter').and.returnValue({
        parse: () => {
          return 2000;
        }
      });
      spyOn(openmct.telemetry, 'getFormatMap').and.returnValue({
        sin: {
          format: (datum) => {
            return randomValue;
          }
        }
      });
      spyOn(openmct.telemetry, 'getLimits').and.returnValue({
        limits: () =>
          Promise.resolve({
            CRITICAL: {
              high: 0.99,
              low: -0.99
            }
          })
      });
      spyOn(openmct.telemetry, 'request').and.returnValue(Promise.resolve([randomValue]));
      spyOn(openmct.time, 'bounds').and.returnValue({
        start: 1000,
        end: 5000
      });

      return openmct.objects.getMutable(gaugeViewObject.identifier).then((mutableObject) => {
        mutablegaugeObject = mutableObject;
        gaugeView = gaugeViewProvider.view(mutablegaugeObject, [mutablegaugeObject]);
        gaugeView.show(child);

        return Vue.nextTick();
      });
    });

    afterEach(() => {
      gaugeView.destroy();

      return resetApplicationState(openmct);
    });

    it('provides gauge view', () => {
      expect(gaugeViewProvider).toBeDefined();
    });

    it('renders gauge element', () => {
      const gaugeElement = gaugeHolder.querySelectorAll('.js-gauge-wrapper');
      expect(gaugeElement.length).toBe(1);
    });

    it('renders major elements', () => {
      const wrapperElement = gaugeHolder.querySelector('.js-gauge-wrapper');
      const rangeElement = gaugeHolder.querySelector('.js-gauge-dial-range');
      const valueElement = gaugeHolder.querySelector('.js-dial-current-value');

      const hasMajorElements = Boolean(wrapperElement && rangeElement && valueElement);

      expect(hasMajorElements).toBe(true);
    });

    it('renders correct min max values', () => {
      const { min, max } = gaugeViewObject.configuration.gaugeController;
      expect(gaugeHolder.querySelector('.js-gauge-dial-range').textContent).toMatch(
        new RegExp(`\\s*${min}\\s*${max}\\s*`)
      );
    });

    it('renders correct current value', (done) => {
      function WatchUpdateValue() {
        const textElement = gaugeHolder.querySelector('.js-dial-current-value');
        expect(
          Number(textElement.textContent).toFixed(
            gaugeViewObject.configuration.gaugeController.precision
          )
        ).toBe(randomValue.toFixed(gaugeViewObject.configuration.gaugeController.precision));
        done();
      }

      const debouncedWatchUpdate = debounce(WatchUpdateValue, 200);
      Vue.nextTick(debouncedWatchUpdate);
    });
  });
});

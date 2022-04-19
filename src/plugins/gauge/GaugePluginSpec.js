/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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
import {
    createOpenMct,
    resetApplicationState
} from 'utils/testing';
import { debounce } from 'lodash';

import Vue from 'vue';

let gaugeDomainObject = {
    identifier: {
        key: 'gauge',
        namespace: 'test-namespace'
    },
    type: 'gauge',
    composition: []
};

describe('Gaugue plugin', () => {
    let openmct;
    let child;
    let appHolder;

    beforeEach((done) => {
        appHolder = document.createElement('div');
        appHolder.style.display = 'block';
        appHolder.style.width = '1920px';
        appHolder.style.height = '1080px';

        child = document.createElement('div');
        appHolder.appendChild(child);
        document.body.appendChild(appHolder);

        openmct = createOpenMct();
        openmct.on('start', done);

        openmct.startHeadless(appHolder);
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it('Plugin installed by default', () => {
        const gaugueType = openmct.types.get('gauge');

        expect(gaugueType).not.toBeNull();
        expect(gaugueType.definition.name).toEqual('Gauge');
    });

    it('Gaugue plugin is creatable', () => {
        const gaugueType = openmct.types.get('gauge');

        expect(gaugueType.definition.creatable).toBeTrue();
    });

    it('Gaugue plugin is creatable', () => {
        const gaugueType = openmct.types.get('gauge');

        expect(gaugueType.definition.creatable).toBeTrue();
    });

    it('Gaugue form controller', () => {
        const gaugeController = openmct.forms.getFormControl('gauge-controller');
        expect(gaugeController).toBeDefined();
    });

    describe('Gaugue with Filled Dial', () => {
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
            gaugeViewProvider = applicableViews.find(viewProvider => viewProvider.key === 'gauge');

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
                gaugeView = gaugeViewProvider.view(mutablegaugeObject);
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
            const gaugeElement = appHolder.querySelectorAll('.c-gauge');
            expect(gaugeElement.length).toBe(1);
        });

        it('renders major elements', () => {
            const wrapperElement = appHolder.querySelector('.c-gauge__wrapper');
            const rangeElement = appHolder.querySelector('.c-gauge__range');
            const curveElement = appHolder.querySelector('.c-gauge__curval');
            const dialElement = appHolder.querySelector('.c-dial');

            const hasMajorElements = Boolean(wrapperElement && rangeElement && curveElement && dialElement);

            expect(hasMajorElements).toBe(true);
        });

        it('renders correct min max values', () => {
            expect(appHolder.querySelector('.c-gauge__range').textContent).toEqual(`${minValue} ${maxValue}`);
        });

        it('renders correct current value', (done) => {
            function WatchUpdateValue() {
                const textElement = appHolder.querySelector('.c-gauge__curval-text');
                expect(Number(textElement.textContent).toFixed(gaugeViewObject.configuration.gaugeController.precision)).toBe(randomValue.toFixed(gaugeViewObject.configuration.gaugeController.precision));
                done();
            }

            const debouncedWatchUpdate = debounce(WatchUpdateValue, 200);
            Vue.nextTick(debouncedWatchUpdate);
        });
    });

    describe('Gaugue with Needle Dial', () => {
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
            gaugeViewProvider = applicableViews.find(viewProvider => viewProvider.key === 'gauge');

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
                gaugeView = gaugeViewProvider.view(mutablegaugeObject);
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
            const gaugeElement = appHolder.querySelectorAll('.c-gauge');
            expect(gaugeElement.length).toBe(1);
        });

        it('renders major elements', () => {
            const wrapperElement = appHolder.querySelector('.c-gauge__wrapper');
            const rangeElement = appHolder.querySelector('.c-gauge__range');
            const curveElement = appHolder.querySelector('.c-gauge__curval');
            const dialElement = appHolder.querySelector('.c-dial');

            const hasMajorElements = Boolean(wrapperElement && rangeElement && curveElement && dialElement);

            expect(hasMajorElements).toBe(true);
        });

        it('renders correct min max values', () => {
            expect(appHolder.querySelector('.c-gauge__range').textContent).toEqual(`${minValue} ${maxValue}`);
        });

        it('renders correct current value', (done) => {
            function WatchUpdateValue() {
                const textElement = appHolder.querySelector('.c-gauge__curval-text');
                expect(Number(textElement.textContent).toFixed(gaugeViewObject.configuration.gaugeController.precision)).toBe(randomValue.toFixed(gaugeViewObject.configuration.gaugeController.precision));
                done();
            }

            const debouncedWatchUpdate = debounce(WatchUpdateValue, 200);
            Vue.nextTick(debouncedWatchUpdate);
        });
    });

    describe('Gaugue with Vertical Meter', () => {
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
            gaugeViewProvider = applicableViews.find(viewProvider => viewProvider.key === 'gauge');

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
                gaugeView = gaugeViewProvider.view(mutablegaugeObject);
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
            const gaugeElement = appHolder.querySelectorAll('.c-gauge');
            expect(gaugeElement.length).toBe(1);
        });

        it('renders major elements', () => {
            const wrapperElement = appHolder.querySelector('.c-gauge__wrapper');
            const rangeElement = appHolder.querySelector('.c-gauge__range');
            const curveElement = appHolder.querySelector('.c-meter');
            const dialElement = appHolder.querySelector('.c-meter__bg');

            const hasMajorElements = Boolean(wrapperElement && rangeElement && curveElement && dialElement);

            expect(hasMajorElements).toBe(true);
        });

        it('renders correct min max values', () => {
            expect(appHolder.querySelector('.c-gauge__range').textContent).toEqual(`${maxValue} ${minValue}`);
        });

        it('renders correct current value', (done) => {
            function WatchUpdateValue() {
                const textElement = appHolder.querySelector('.c-gauge__curval-text');
                expect(Number(textElement.textContent).toFixed(gaugeViewObject.configuration.gaugeController.precision)).toBe(randomValue.toFixed(gaugeViewObject.configuration.gaugeController.precision));
                done();
            }

            const debouncedWatchUpdate = debounce(WatchUpdateValue, 200);
            Vue.nextTick(debouncedWatchUpdate);
        });
    });

    describe('Gaugue with Vertical Meter Inverted', () => {
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
            gaugeViewProvider = applicableViews.find(viewProvider => viewProvider.key === 'gauge');

            testObjectProvider.get.and.returnValue(Promise.resolve(gaugeViewObject));
            testObjectProvider.create.and.returnValue(Promise.resolve(gaugeViewObject));
            openmct.objects.addProvider('test-namespace', testObjectProvider);
            testObjectProvider.observe.and.returnValue(() => {});
            testObjectProvider.create.and.returnValue(Promise.resolve(true));
            testObjectProvider.update.and.returnValue(Promise.resolve(true));

            return openmct.objects.getMutable(gaugeViewObject.identifier).then((mutableObject) => {
                mutablegaugeObject = mutableObject;

                gaugeView = gaugeViewProvider.view(mutablegaugeObject);
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
            const gaugeElement = appHolder.querySelectorAll('.c-gauge');
            expect(gaugeElement.length).toBe(1);
        });

        it('renders major elements', () => {
            const wrapperElement = appHolder.querySelector('.c-gauge__wrapper');
            const rangeElement = appHolder.querySelector('.c-gauge__range');
            const curveElement = appHolder.querySelector('.c-meter');
            const dialElement = appHolder.querySelector('.c-meter__bg');

            const hasMajorElements = Boolean(wrapperElement && rangeElement && curveElement && dialElement);

            expect(hasMajorElements).toBe(true);
        });
    });

    describe('Gaugue with Horizontal Meter', () => {
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
            gaugeViewProvider = applicableViews.find(viewProvider => viewProvider.key === 'gauge');

            testObjectProvider.get.and.returnValue(Promise.resolve(gaugeViewObject));
            testObjectProvider.create.and.returnValue(Promise.resolve(gaugeViewObject));
            openmct.objects.addProvider('test-namespace', testObjectProvider);
            testObjectProvider.observe.and.returnValue(() => {});
            testObjectProvider.create.and.returnValue(Promise.resolve(true));
            testObjectProvider.update.and.returnValue(Promise.resolve(true));

            return openmct.objects.getMutable(gaugeViewObject.identifier).then((mutableObject) => {
                mutablegaugeObject = mutableObject;

                gaugeView = gaugeViewProvider.view(mutablegaugeObject);
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
            const gaugeElement = appHolder.querySelectorAll('.c-gauge');
            expect(gaugeElement.length).toBe(1);
        });

        it('renders major elements', () => {
            const wrapperElement = appHolder.querySelector('.c-gauge__wrapper');
            const rangeElement = appHolder.querySelector('.c-gauge__range');
            const curveElement = appHolder.querySelector('.c-meter');
            const dialElement = appHolder.querySelector('.c-meter__bg');

            const hasMajorElements = Boolean(wrapperElement && rangeElement && curveElement && dialElement);

            expect(hasMajorElements).toBe(true);
        });
    });

    describe('Gaugue with Filled Dial with Use Telemetry Limits', () => {
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
            gaugeViewProvider = applicableViews.find(viewProvider => viewProvider.key === 'gauge');

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
            spyOn(openmct.telemetry, 'getLimits').and.returnValue(
                {
                    limits: () => Promise.resolve({
                        CRITICAL: {
                            high: 0.99,
                            low: -0.99
                        }
                    })
                }
            );
            spyOn(openmct.telemetry, 'request').and.returnValue(Promise.resolve([randomValue]));
            spyOn(openmct.time, 'bounds').and.returnValue({
                start: 1000,
                end: 5000
            });

            return openmct.objects.getMutable(gaugeViewObject.identifier).then((mutableObject) => {
                mutablegaugeObject = mutableObject;
                gaugeView = gaugeViewProvider.view(mutablegaugeObject);
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
            const gaugeElement = appHolder.querySelectorAll('.c-gauge');
            expect(gaugeElement.length).toBe(1);
        });

        it('renders major elements', () => {
            const wrapperElement = appHolder.querySelector('.c-gauge__wrapper');
            const rangeElement = appHolder.querySelector('.c-gauge__range');
            const curveElement = appHolder.querySelector('.c-gauge__curval');
            const dialElement = appHolder.querySelector('.c-dial');

            const hasMajorElements = Boolean(wrapperElement && rangeElement && curveElement && dialElement);

            expect(hasMajorElements).toBe(true);
        });

        it('renders correct min max values', () => {
            expect(appHolder.querySelector('.c-gauge__range').textContent).toEqual(`${gaugeViewObject.configuration.gaugeController.min} ${gaugeViewObject.configuration.gaugeController.max}`);
        });

        it('renders correct current value', (done) => {
            function WatchUpdateValue() {
                const textElement = appHolder.querySelector('.c-gauge__curval-text');
                expect(Number(textElement.textContent).toFixed(gaugeViewObject.configuration.gaugeController.precision)).toBe(randomValue.toFixed(gaugeViewObject.configuration.gaugeController.precision));
                done();
            }

            const debouncedWatchUpdate = debounce(WatchUpdateValue, 200);
            Vue.nextTick(debouncedWatchUpdate);
        });
    });
});

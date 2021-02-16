/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

import {createOpenMct, resetApplicationState, spyOnBuiltins} from "utils/testing";
import PlotVuePlugin from "./plugin";
import Vue from "vue";

describe('the plugin', function () {
    let element;
    let child;
    let openmct;

    beforeEach((done) => {
        const appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();

        openmct.install(new PlotVuePlugin(openmct));

        element = document.createElement('div');
        element.style.width = '640px';
        element.style.height = '480px';
        child = document.createElement('div');
        child.style.width = '640px';
        child.style.height = '480px';
        element.appendChild(child);

        openmct.time.timeSystem('utc', {
            start: 0,
            end: 4
        });

        openmct.types.addType('test-object', {
            creatable: true
        });

        spyOnBuiltins(['requestAnimationFrame']);
        window.requestAnimationFrame.and.callFake((callBack) => {
            callBack();
        });

        openmct.on('start', done);
        openmct.startHeadless(appHolder);
    });

    afterEach(async () => {
        await resetApplicationState();
    });

    describe('the plot views', () => {

        it('provides a plot view for objects with telemetry', () => {
            const testTelemetryObject = {
                id: "test-object",
                type: "test-object",
                telemetry: {
                    values: [{
                        key: "some-key",
                        hints: {
                            domain: 1
                        }
                    },
                    {
                        key: "other-key",
                        hints: {
                            range: 1
                        }
                    }]
                }
            };

            const applicableViews = openmct.objectViews.get(testTelemetryObject);
            let plotView = applicableViews.find((viewProvider) => viewProvider.key === 'plot-single');
            expect(plotView).toBeDefined();
        });

        it('provides an overlay plot view for objects with telemetry', () => {
            const testTelemetryObject = {
                id: "test-object",
                type: "telemetry.plot.overlay",
                telemetry: {
                    values: [{
                        key: "some-key"
                    }]
                }
            };

            const applicableViews = openmct.objectViews.get(testTelemetryObject);
            let plotView = applicableViews.find((viewProvider) => viewProvider.key === 'plot-overlay');
            expect(plotView).toBeDefined();
        });

        it('provides a stacked plot view for objects with telemetry', () => {
            const testTelemetryObject = {
                id: "test-object",
                type: "telemetry.plot.stacked",
                telemetry: {
                    values: [{
                        key: "some-key"
                    }]
                }
            };

            const applicableViews = openmct.objectViews.get(testTelemetryObject);
            let plotView = applicableViews.find((viewProvider) => viewProvider.key === 'plot-stacked');
            expect(plotView).toBeDefined();
        });

    });

    describe("The single plot view", () => {
        let testTelemetryObject;
        let applicableViews;
        let plotViewProvider;
        let plotView;

        beforeEach(() => {

            const getFunc = openmct.$injector.get;
            spyOn(openmct.$injector, 'get')
                .withArgs('exportImageService').and.returnValue({
                    exportPNG: () => {},
                    exportJPG: () => {}
                })
                .and.callFake(getFunc);
            testTelemetryObject = {
                identifier: {
                    namespace: "",
                    key: "test-object"
                },
                type: "test-object",
                name: "Test Object",
                telemetry: {
                    values: [{
                        key: "utc",
                        format: "utc",
                        name: "Time",
                        hints: {
                            domain: 1
                        }
                    }, {
                        key: "some-key",
                        name: "Some attribute",
                        hints: {
                            range: 1
                        }
                    }, {
                        key: "some-other-key",
                        name: "Another attribute",
                        hints: {
                            range: 2
                        }
                    }]
                }
            };

            applicableViews = openmct.objectViews.get(testTelemetryObject);
            plotViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'plot-single');
            plotView = plotViewProvider.view(testTelemetryObject, [testTelemetryObject]);
            plotView.show(child, true);

            return Vue.nextTick();
        });

        it("Renders a legend for every telemetry", () => {
            let legend = element.querySelectorAll('.plot-wrapper-collapsed-legend .plot-series-name');
            expect(legend.length).toBe(1);
            expect(legend[0].innerHTML).toEqual('Test Object');
        });

        it("Renders a legend for every telemetry", () => {
            let legend = element.querySelectorAll('.plot-wrapper-collapsed-legend .plot-series-name');
            expect(legend.length).toBe(1);
            expect(legend[0].innerHTML).toEqual('Test Object');
        });
    });

});

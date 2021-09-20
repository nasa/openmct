/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
import Vue from "vue";
import BarGraphPlugin from "./plugin";
import BarGraph from './BarGraphPlot.vue';
import EventEmitter from "EventEmitter";
import { BAR_GRAPH_VIEW, BAR_GRAPH_KEY } from './BarGraphConstants';

describe("the plugin", function () {
    let element;
    let child;
    let openmct;
    let telemetryPromise;
    let telemetryPromiseResolve;
    let cleanupFirst;
    let telemetrylimitProvider;
    let mockObjectPath;

    beforeEach((done) => {
        mockObjectPath = [
            {
                name: 'mock folder',
                type: 'fake-folder',
                identifier: {
                    key: 'mock-folder',
                    namespace: ''
                }
            },
            {
                name: 'mock parent folder',
                type: 'time-strip',
                identifier: {
                    key: 'mock-parent-folder',
                    namespace: ''
                }
            }
        ];
        const testTelemetry = [
            {
                'utc': 1,
                'some-key': 'some-value 1',
                'some-other-key': 'some-other-value 1'
            },
            {
                'utc': 2,
                'some-key': 'some-value 2',
                'some-other-key': 'some-other-value 2'
            },
            {
                'utc': 3,
                'some-key': 'some-value 3',
                'some-other-key': 'some-other-value 3'
            }
        ];
        cleanupFirst = [];

        openmct = createOpenMct();

        telemetryPromise = new Promise((resolve) => {
            telemetryPromiseResolve = resolve;
        });

        spyOn(openmct.telemetry, 'request').and.callFake(() => {
            telemetryPromiseResolve(testTelemetry);

            return telemetryPromise;
        });

        telemetrylimitProvider = jasmine.createSpyObj('telemetrylimitProvider', [
            'supportsLimits',
            'getLimits',
            'getLimitEvaluator'
        ]);
        telemetrylimitProvider.supportsLimits.and.returnValue(true);
        telemetrylimitProvider.getLimits.and.returnValue({
            limits: function () {
                return Promise.resolve({
                    WARNING: {
                        low: {
                            cssClass: "is-limit--lwr is-limit--yellow",
                            'some-key': -0.5
                        },
                        high: {
                            cssClass: "is-limit--upr is-limit--yellow",
                            'some-key': 0.5
                        }
                    },
                    DISTRESS: {
                        low: {
                            cssClass: "is-limit--lwr is-limit--red",
                            'some-key': -0.9
                        },
                        high: {
                            cssClass: "is-limit--upr is-limit--red",
                            'some-key': 0.9
                        }
                    }
                });
            }
        });
        telemetrylimitProvider.getLimitEvaluator.and.returnValue({
            evaluate: function () {
                return {};
            }
        });
        openmct.telemetry.addProvider(telemetrylimitProvider);

        openmct.install(new BarGraphPlugin());

        element = document.createElement("div");
        element.style.width = "640px";
        element.style.height = "480px";
        child = document.createElement("div");
        child.style.width = "640px";
        child.style.height = "480px";
        element.appendChild(child);
        document.body.appendChild(element);

        spyOn(window, 'ResizeObserver').and.returnValue({
            observe() {},
            unobserve() {},
            disconnect() {}
        });

        openmct.time.timeSystem("utc", {
            start: 0,
            end: 4
        });

        openmct.types.addType("test-object", {
            creatable: true
        });

        spyOnBuiltins(["requestAnimationFrame"]);
        window.requestAnimationFrame.and.callFake((callBack) => {
            callBack();
        });

        openmct.on("start", done);
        openmct.startHeadless();
    });

    afterEach((done) => {
        openmct.time.timeSystem('utc', {
            start: 0,
            end: 1
        });

        // Needs to be in a timeout because plots use a bunch of setTimeouts, some of which can resolve during or after
        // teardown, which causes problems
        // This is hacky, we should find a better approach here.
        setTimeout(() => {
            //Cleanup code that needs to happen before dom elements start being destroyed
            cleanupFirst.forEach(cleanup => cleanup());
            cleanupFirst = [];
            document.body.removeChild(element);

            resetApplicationState(openmct).then(done).catch(done);
        });
    });

    describe("The bar graph view", () => {
        let testTelemetryObject;
        let barGraphObject;
        let component;
        let mockComposition;

        beforeEach(() => {
            const getFunc = openmct.$injector.get;
            spyOn(openmct.$injector, "get")
                .withArgs("exportImageService").and.returnValue({
                    exportPNG: () => {},
                    exportJPG: () => {}
                })
                .and.callFake(getFunc);

            barGraphObject = {
                identifier: {
                    namespace: "",
                    key: "test-plot"
                },
                type: "telemetry.plot.bar-graph",
                name: "Test Bar Graph"
            };

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

            mockComposition = new EventEmitter();
            mockComposition.load = () => {
                mockComposition.emit('add', testTelemetryObject);

                return [testTelemetryObject];
            };

            spyOn(openmct.composition, 'get').and.returnValue(mockComposition);

            let viewContainer = document.createElement("div");
            child.append(viewContainer);
            component = new Vue({
                el: viewContainer,
                components: {
                    BarGraph
                },
                provide: {
                    openmct: openmct,
                    domainObject: barGraphObject,
                    composition: openmct.composition.get(barGraphObject)
                },
                template: "<BarGraph></BarGraph>"
            });

            cleanupFirst.push(() => {
                component.$destroy();
                component = undefined;
            });

        });

        it("provides a bar graph view for objects with telemetry", () => {
            const testTelemetryObject = {
                id: "test-object",
                type: BAR_GRAPH_KEY,
                telemetry: {
                    values: [{
                        key: "lots-of-bar-graph-telemetry"
                    }]
                }
            };

            const applicableViews = openmct.objectViews.get(testTelemetryObject, mockObjectPath);
            let plotView = applicableViews.find((viewProvider) => viewProvider.key === BAR_GRAPH_VIEW);
            expect(plotView).toBeDefined();
        });

        it("Renders bar graph", () => {
            let barChartElement = element.querySelectorAll(".c-bar-chart");
            expect(barChartElement.length).toBe(1);
        });
    });

    describe("the bar graph", () => {
        const mockObject = {
            name: 'A very nice bar graph',
            key: BAR_GRAPH_KEY,
            creatable: true
        };

        it('defines a bar graph object type with the correct key', () => {
            const objectDef = openmct.types.get(BAR_GRAPH_KEY).definition;
            expect(objectDef.key).toEqual(mockObject.key);
        });

        it('is creatable', () => {
            const objectDef = openmct.types.get(BAR_GRAPH_KEY).definition;
            expect(objectDef.creatable).toEqual(mockObject.creatable);
        });
    });
});

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

import {createOpenMct, resetApplicationState} from "utils/testing";
import { BAR_GRAPH_VIEW, BAR_GRAPH_KEY } from '../charts/barGraph/BarGraphConstants';
import BarGraphPlugin from './plugin';

describe("the plugin", function () {
    let element;
    let child;
    let openmct;
    let telemetryPromise;
    let telemetryPromiseResolve;
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

        openmct = createOpenMct();

        telemetryPromise = new Promise((resolve) => {
            telemetryPromiseResolve = resolve;
        });

        spyOn(openmct.telemetry, 'request').and.callFake(() => {
            telemetryPromiseResolve(testTelemetry);

            return telemetryPromise;
        });

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
            disconnect() {}
        });

        openmct.time.timeSystem("utc", {
            start: 0,
            end: 4
        });

        openmct.types.addType("test-object", {
            creatable: true
        });

        openmct.on("start", done);
        openmct.startHeadless();
    });

    afterEach((done) => {
        openmct.time.timeSystem('utc', {
            start: 0,
            end: 1
        });
        resetApplicationState(openmct).then(done).catch(done);
    });

    describe("the bar graph", () => {
        const mockObject = {
            name: 'A bar graph',
            key: BAR_GRAPH_KEY,
            creatable: true
        };

        it('defines a bar graph type with the correct key', () => {
            const objectDef = openmct.types.get(BAR_GRAPH_KEY).definition;
            expect(objectDef.key).toEqual(mockObject.key);
        });

        it('is creatable', () => {
            const objectDef = openmct.types.get(BAR_GRAPH_KEY).definition;
            expect(objectDef.creatable).toEqual(mockObject.creatable);
        });
    });

    describe("the bar graph view", () => {
        it("provides view for objects with telemetry", () => {
            const testObject = {
                id: "test-object",
                type: BAR_GRAPH_KEY
            };

            const applicableViews = openmct.objectViews.get(testObject, mockObjectPath);
            let plotView = applicableViews.find((viewProvider) => viewProvider.key === BAR_GRAPH_VIEW);
            expect(plotView).toBeDefined();
        });
    });
});

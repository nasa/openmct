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
import AutoflowTabularConstants from './AutoflowTabularConstants';
import DOMObserver from './dom-observer';
import {
    createOpenMct,
    resetApplicationState,
    spyOnBuiltins
} from 'utils/testing';
import Vue from 'vue';

describe("AutoflowTabularPlugin", () => {
    let testTypeObject;
    let autoflowObject;
    let otherObject;
    let openmct;
    let viewProviders;
    let autoflowViewProvider;

    beforeEach(done => {
        testTypeObject = {
            type: 'some-type'
        };
        autoflowObject = {
            identifier: {
                namespace: '',
                key: 'some-type-key'
            },
            type: 'some-type'
        };
        otherObject = {
            identifier: {
                namespace: '',
                key: 'other-type-key'
            },
            type: 'other-type'
        };

        openmct = createOpenMct();
        openmct.install(openmct.plugins.AutoflowView(testTypeObject));

        spyOn(openmct.composition, 'get');
        spyOn(openmct.telemetry, 'getMetadata');
        spyOn(openmct.telemetry, 'getValueFormatter');
        spyOn(openmct.telemetry, 'limitEvaluator');
        spyOn(openmct.telemetry, 'request');
        spyOn(openmct.telemetry, 'subscribe');

        openmct.on('start', done);
        openmct.startHeadless();

        viewProviders = openmct.objectViews.get(autoflowObject, []);
        autoflowViewProvider = viewProviders.filter(provider => provider?.key === 'autoflow')?.[0];
    });

    afterEach(() => {
        return resetApplicationState(openmct);
    });

    it("installs a view provider", () => {
        expect(autoflowViewProvider).toBeDefined();
    });

    it("applies its view to the type from options", () => {
        expect(autoflowViewProvider.canView(autoflowObject, [])).toBeTrue();
    });

    it("does not apply to other types", () => {
        expect(autoflowViewProvider.canView(otherObject, [])).toBeFalse();
    });

    describe("provides a view which", () => {
        let testKeys;
        let testChildren;
        let testContainer;
        let testHistories;
        let mockComposition;
        let mockMetadata;
        let mockEvaluator;
        let mockUnsubscribes;
        let callbacks;
        let view;
        let domObserver;

        function waitsForChange() {
            return new Promise(function (resolve) {
                window.requestAnimationFrame(resolve);
            });
        }

        function emitEvent(mockEmitter, type, event) {
            mockEmitter.on.calls.all().forEach((call) => {
                if (call.args[0] === type) {
                    call.args[1](event);
                }
            });
        }

        beforeEach(() => {
            callbacks = {};

            spyOnBuiltins(['requestAnimationFrame']);
            window.requestAnimationFrame.and.callFake((callBack) => {
                callBack();
            });

            testKeys = ['abc', 'def', 'xyz'];
            testChildren = testKeys.map((key) => {
                return {
                    identifier: {
                        namespace: "test",
                        key: key
                    },
                    name: "Object " + key
                };
            });
            testContainer = document.createElement('div');
            domObserver = new DOMObserver(testContainer);

            testHistories = testKeys.reduce((histories, key, index) => {
                histories[key] = {
                    key: key,
                    range: index + 10,
                    domain: key + index
                };

                return histories;
            }, {});

            mockComposition =
                jasmine.createSpyObj('composition', ['load', 'on', 'off']);
            mockMetadata =
                jasmine.createSpyObj('metadata', ['valuesForHints']);

            mockEvaluator = jasmine.createSpyObj('evaluator', ['evaluate']);
            mockUnsubscribes = testKeys.reduce((map, key) => {
                map[key] = jasmine.createSpy('unsubscribe-' + key);

                return map;
            }, {});

            openmct.composition.get.and.returnValue(mockComposition);
            mockComposition.load.and.callFake(() => {
                testChildren.forEach(emitEvent.bind(null, mockComposition, 'add'));

                return Promise.resolve(testChildren);
            });

            openmct.telemetry.getMetadata.and.returnValue(mockMetadata);
            openmct.telemetry.getValueFormatter.and.callFake((metadatum) => {
                const mockFormatter = jasmine.createSpyObj('formatter', ['format']);
                mockFormatter.format.and.callFake((datum) => {
                    return datum[metadatum.hint];
                });

                return mockFormatter;
            });
            openmct.telemetry.limitEvaluator.and.returnValue(mockEvaluator);
            openmct.telemetry.subscribe.and.callFake((obj, callback) => {
                const key = obj.identifier.key;
                callbacks[key] = callback;

                return mockUnsubscribes[key];
            });
            openmct.telemetry.request.and.callFake((obj, request) => {
                const key = obj.identifier.key;

                return Promise.resolve([testHistories[key]]);
            });
            mockMetadata.valuesForHints.and.callFake((hints) => {
                return [{ hint: hints[0] }];
            });

            view = autoflowViewProvider.view(autoflowObject);
            view.show(testContainer);

            return Vue.nextTick();
        });

        afterEach(() => {
            domObserver.destroy();
        });

        it("populates its container", () => {
            expect(testContainer.children.length > 0).toBe(true);
        });

        describe("when rows have been populated", () => {
            function rowsMatch() {
                const rows = testContainer.querySelectorAll(".l-autoflow-row").length;

                return rows === testChildren.length;
            }

            it("shows one row per child object", async () => {
                const success = await domObserver.when(rowsMatch);

                expect(success).toBeTrue();
            });

            it("adds rows on composition change", async () => {
                const child = {
                    identifier: {
                        namespace: "test",
                        key: "123"
                    },
                    name: "Object 123"
                };
                testChildren.push(child);
                emitEvent(mockComposition, 'add', child);

                const success = await domObserver.when(rowsMatch);

                expect(success).toBeTrue();
            });

            it("removes rows on composition change", async () => {
                const child = testChildren.pop();

                emitEvent(mockComposition, 'remove', child.identifier);

                const success = await domObserver.when(rowsMatch);

                expect(success).toBeTrue();
            });
        });

        it("removes subscriptions when destroyed", () => {
            testKeys.forEach((key) => {
                expect(mockUnsubscribes[key]).not.toHaveBeenCalled();
            });
            view.destroy();
            testKeys.forEach((key) => {
                expect(mockUnsubscribes[key]).toHaveBeenCalled();
            });
        });

        it("provides a button to change column width", async () => {
            let buttonClicked;

            const initialWidth = testContainer.querySelector('.l-autoflow-col').style.width;

            expect(initialWidth.length).toBeGreaterThan(0);

            function widthHasChanged() {
                if (!buttonClicked) {
                    buttonClicked = true;
                    testContainer.querySelector('.change-column-width').click();
                }

                const changedWidth = testContainer.querySelector('.l-autoflow-col').style.width;

                return changedWidth !== initialWidth;
            }

            const success = await domObserver.when(widthHasChanged);

            expect(success).toBeTrue();
        });

        it("subscribes to all child objects", () => {
            testKeys.forEach((key) => {
                expect(callbacks[key]).toEqual(jasmine.any(Function));
            });
        });

        it("displays historical telemetry", () => {
            function rowTextDefined() {
                return testContainer.querySelector(".l-autoflow-item.r").textContent !== "";
            }

            return domObserver.when(rowTextDefined).then(() => {
                const rows = testContainer.querySelectorAll(".l-autoflow-row");

                testKeys.forEach((key, index) => {
                    const datum = testHistories[key];
                    const $cell = rows[index].querySelector(".l-autoflow-item.r");

                    expect($cell.textContent).toEqual(String(datum.range));
                });
            });
        });

        it("displays incoming telemetry", () => {
            const testData = testKeys.map((key, index) => {
                return {
                    key: key,
                    range: index * 100,
                    domain: key + index
                };
            });

            testData.forEach((datum) => {
                callbacks[datum.key](datum);
            });

            return waitsForChange().then(() => {
                const rows = testContainer.querySelectorAll(".l-autoflow-row");

                testData.forEach((datum, index) => {
                    const $cell = rows[index].querySelector(".l-autoflow-item.r");

                    expect($cell.textContent).toEqual(String(datum.range));
                });
            });
        });

        it("updates classes for limit violations", () => {
            const testClass = "some-limit-violation";

            mockEvaluator.evaluate.and.returnValue({ cssClass: testClass });

            testKeys.forEach((key) => {
                callbacks[key]({
                    range: 'foo',
                    domain: 'bar'
                });
            });

            return waitsForChange().then(() => {
                const rows = testContainer.querySelectorAll(".l-autoflow-row");

                testKeys.forEach((datum, index) => {
                    const $cell = rows[index].querySelector(".l-autoflow-item.r");

                    expect($cell.classList.contains(testClass)).toBe(true);
                });
            });
        });

        it("automatically flows to new columns", () => {
            const rowHeight = AutoflowTabularConstants.ROW_HEIGHT;
            const sliderHeight = AutoflowTabularConstants.SLIDER_HEIGHT;
            const count = testKeys.length;
            const $container = testContainer;
            let promiseChain = Promise.resolve();

            function columnsHaveAutoflowed() {
                const itemsHeight = $container.querySelector('.l-autoflow-items').style.height;
                const availableHeight = itemsHeight - sliderHeight;
                const availableRows = Math.max(Math.floor(availableHeight / rowHeight), 1);
                const columns = Math.ceil(count / availableRows);

                return $container.querySelectorAll('.l-autoflow-col').length === columns;
            }

            const absElement = $container.querySelector('.abs');
            absElement.style.position = 'absolute';
            absElement.style.left = 0;
            absElement.style.right = 0;
            absElement.style.top = 0;
            absElement.style.bottom = 0;

            $container.style.position = 'absolute';

            document.body.append($container);

            function setHeight(height) {
                $container.style.height = `${height}px`;

                return domObserver.when(columnsHaveAutoflowed);
            }

            for (let height = 0; height < rowHeight * count * 2; height += rowHeight / 2) {
                // eslint-disable-next-line no-invalid-this
                promiseChain = promiseChain.then(setHeight.bind(this, height));
            }

            return promiseChain.then(success => {
                expect(success).toBeTrue();

                $container.remove();
            });
        });

        it("loads composition exactly once", () => {
            const testObj = testChildren.pop();
            emitEvent(mockComposition, 'remove', testObj.identifier);
            testChildren.push(testObj);
            emitEvent(mockComposition, 'add', testObj);
            expect(mockComposition.load.calls.count()).toEqual(1);
        });
    });
});

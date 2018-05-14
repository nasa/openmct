/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

define([
    './AutoflowTabularPlugin',
    './AutoflowTabularConstants',
    '../../MCT',
    'zepto'
], function (AutoflowTabularPlugin, AutoflowTabularConstants, MCT, $) {
    describe("AutoflowTabularPlugin", function () {
        var testType;
        var testObject;
        var mockmct;

        beforeEach(function () {
            testType = "some-type";
            testObject = { type: testType };
            mockmct = new MCT();
            spyOn(mockmct.composition, 'get');
            spyOn(mockmct.objectViews, 'addProvider');
            spyOn(mockmct.telemetry, 'getMetadata');
            spyOn(mockmct.telemetry, 'getValueFormatter');
            spyOn(mockmct.telemetry, 'limitEvaluator');
            spyOn(mockmct.telemetry, 'request');
            spyOn(mockmct.telemetry, 'subscribe');

            var plugin = new AutoflowTabularPlugin({ type: testType });
            plugin(mockmct);
        });

        it("installs a view provider", function () {
            expect(mockmct.objectViews.addProvider).toHaveBeenCalled();
        });

        describe("installs a view provider which", function () {
            var provider;

            beforeEach(function () {
                provider =
                    mockmct.objectViews.addProvider.mostRecentCall.args[0];
            });

            it("applies its view to the type from options", function () {
                expect(provider.canView(testObject)).toBe(true);
            });

            it("does not apply to other types", function () {
                expect(provider.canView({ type: 'foo' })).toBe(false);
            });

            describe("provides a view which", function () {
                var testKeys;
                var testChildren;
                var testContainer;
                var testHistories;
                var mockComposition;
                var mockMetadata;
                var mockEvaluator;
                var mockUnsubscribes;
                var callbacks;
                var view;

                function waitsForChange() {
                    var callback = jasmine.createSpy('callback');
                    window.requestAnimationFrame(callback);
                    waitsFor(function () {
                        return callback.calls.length > 0;
                    });
                }

                function emitEvent(mockEmitter, type, event) {
                    mockEmitter.on.calls.forEach(function (call) {
                        if (call.args[0] === type) {
                            call.args[1](event);
                        }
                    });
                }

                beforeEach(function () {
                    callbacks = {};

                    testObject = { type: 'some-type' };
                    testKeys = ['abc', 'def', 'xyz'];
                    testChildren = testKeys.map(function (key) {
                        return {
                            identifier: { namespace: "test", key: key },
                            name: "Object " + key
                        };
                    });
                    testContainer = $('<div>')[0];
                    testHistories = testKeys.reduce(function (histories, key, index) {
                        histories[key] = { key: key, range: index + 10, domain: key + index };
                        return histories;
                    }, {});

                    mockComposition =
                        jasmine.createSpyObj('composition', ['load', 'on', 'off']);
                    mockMetadata =
                        jasmine.createSpyObj('metadata', ['valuesForHints']);

                    mockEvaluator = jasmine.createSpyObj('evaluator', ['evaluate']);
                    mockUnsubscribes = testKeys.reduce(function (map, key) {
                        map[key] = jasmine.createSpy('unsubscribe-' + key);
                        return map;
                    }, {});

                    mockmct.composition.get.andReturn(mockComposition);
                    mockComposition.load.andCallFake(function () {
                        testChildren.forEach(emitEvent.bind(null, mockComposition, 'add'));
                        return Promise.resolve(testChildren);
                    });

                    mockmct.telemetry.getMetadata.andReturn(mockMetadata);
                    mockmct.telemetry.getValueFormatter.andCallFake(function (metadatum) {
                        var mockFormatter = jasmine.createSpyObj('formatter', ['format']);
                        mockFormatter.format.andCallFake(function (datum) {
                            return datum[metadatum.hint];
                        });
                        return mockFormatter;
                    });
                    mockmct.telemetry.limitEvaluator.andReturn(mockEvaluator);
                    mockmct.telemetry.subscribe.andCallFake(function (obj, callback) {
                        var key = obj.identifier.key;
                        callbacks[key] = callback;
                        return mockUnsubscribes[key];
                    });
                    mockmct.telemetry.request.andCallFake(function (obj, request) {
                        var key = obj.identifier.key;
                        return Promise.resolve([testHistories[key]]);
                    });
                    mockMetadata.valuesForHints.andCallFake(function (hints) {
                        return [{ hint: hints[0] }];
                    });

                    view = provider.view(testObject);
                    view.show(testContainer);

                    waitsForChange();
                });

                it("populates its container", function () {
                    expect(testContainer.children.length > 0).toBe(true);
                });

                describe("when rows have been populated", function () {
                    function rowsMatch() {
                        var rows = $(testContainer).find(".l-autoflow-row").length;
                        return rows === testChildren.length;
                    }

                    it("shows one row per child object", function () {
                        waitsFor(rowsMatch);
                    });

                    it("adds rows on composition change", function () {
                        var child = {
                            identifier: { namespace: "test", key: "123" },
                            name: "Object 123"
                        };
                        testChildren.push(child);
                        emitEvent(mockComposition, 'add', child);
                        waitsFor(rowsMatch);
                    });

                    it("removes rows on composition change", function () {
                        var child = testChildren.pop();
                        emitEvent(mockComposition, 'remove', child.identifier);
                        waitsFor(rowsMatch);
                    });
                });

                it("removes subscriptions when destroyed", function () {
                    testKeys.forEach(function (key) {
                        expect(mockUnsubscribes[key]).not.toHaveBeenCalled();
                    });
                    view.destroy();
                    testKeys.forEach(function (key) {
                        expect(mockUnsubscribes[key]).toHaveBeenCalled();
                    });
                });

                it("provides a button to change column width", function () {
                    var initialWidth = AutoflowTabularConstants.INITIAL_COLUMN_WIDTH;
                    var nextWidth =
                        initialWidth + AutoflowTabularConstants.COLUMN_WIDTH_STEP;

                    expect($(testContainer).find('.l-autoflow-col').css('width'))
                        .toEqual(initialWidth + 'px');

                    $(testContainer).find('.change-column-width').click();

                    waitsFor(function () {
                        var width = $(testContainer).find('.l-autoflow-col').css('width');
                        return width !== initialWidth + 'px';
                    });

                    runs(function () {
                        expect($(testContainer).find('.l-autoflow-col').css('width'))
                            .toEqual(nextWidth + 'px');
                    });
                });

                it("subscribes to all child objects", function () {
                    testKeys.forEach(function (key) {
                        expect(callbacks[key]).toEqual(jasmine.any(Function));
                    });
                });

                it("displays historical telemetry", function () {
                    waitsFor(function () {
                        return $(testContainer).find(".l-autoflow-item").filter(".r").text() !== "";
                    });

                    runs(function () {
                        testKeys.forEach(function (key, index) {
                            var datum = testHistories[key];
                            var $cell = $(testContainer).find(".l-autoflow-row").eq(index).find(".r");
                            expect($cell.text()).toEqual(String(datum.range));
                        });
                    });
                });

                it("displays incoming telemetry", function () {
                    var testData = testKeys.map(function (key, index) {
                        return { key: key, range: index * 100, domain: key + index };
                    });

                    testData.forEach(function (datum) {
                        callbacks[datum.key](datum);
                    });

                    waitsForChange();

                    runs(function () {
                        testData.forEach(function (datum, index) {
                            var $cell = $(testContainer).find(".l-autoflow-row").eq(index).find(".r");
                            expect($cell.text()).toEqual(String(datum.range));
                        });
                    });
                });

                it("updates classes for limit violations", function () {
                    var testClass = "some-limit-violation";
                    mockEvaluator.evaluate.andReturn({ cssClass: testClass });
                    testKeys.forEach(function (key) {
                        callbacks[key]({ range: 'foo', domain: 'bar' });
                    });

                    waitsForChange();

                    runs(function () {
                        testKeys.forEach(function (datum, index) {
                            var $cell = $(testContainer).find(".l-autoflow-row").eq(index).find(".r");
                            expect($cell.hasClass(testClass)).toBe(true);
                        });
                    });
                });

                it("automatically flows to new columns", function () {
                    var rowHeight = AutoflowTabularConstants.ROW_HEIGHT;
                    var sliderHeight = AutoflowTabularConstants.SLIDER_HEIGHT;
                    var count = testKeys.length;
                    var $container = $(testContainer);

                    function columnsHaveAutoflowed() {
                        var itemsHeight = $container.find('.l-autoflow-items').height();
                        var availableHeight = itemsHeight - sliderHeight;
                        var availableRows = Math.max(Math.floor(availableHeight / rowHeight), 1);
                        var columns = Math.ceil(count / availableRows);
                        return $container.find('.l-autoflow-col').length === columns;
                    }

                    $container.find('.abs').css({
                        position: 'absolute',
                        left: '0px',
                        right: '0px',
                        top: '0px',
                        bottom: '0px'
                    });
                    $container.css({ position: 'absolute' });

                    runs($container.appendTo.bind($container, document.body));
                    for (var height = 0; height < rowHeight * count * 2; height += rowHeight / 2) {
                        runs($container.css.bind($container, 'height', height + 'px'));
                        waitsFor(columnsHaveAutoflowed);
                    }
                    runs($container.remove.bind($container));
                });

                it("loads composition exactly once", function () {
                    var testObj = testChildren.pop();
                    emitEvent(mockComposition, 'remove', testObj.identifier);
                    testChildren.push(testObj);
                    emitEvent(mockComposition, 'add', testObj);
                    expect(mockComposition.load.calls.length).toEqual(1);
                });
            });
        });
    });
});

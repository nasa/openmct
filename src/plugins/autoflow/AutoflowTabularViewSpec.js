/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    './AutoflowTabularView',
    'zepto'
], function (AutoflowTabularView, $) {
    describe("AutoflowTabularView", function () {
        var testObject;
        var testKeys;
        var testChildren;
        var testContainer;
        var mockmct;
        var mockComposition;
        var mockMetadata;
        var mockFormatter;
        var mockEvaluator;
        var mockUnsubscribes;
        var callbacks;
        var view;

        beforeEach(function () {
            var loaded = false;

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

            mockmct = {
                composition: jasmine.createSpyObj("composition", ['get']),
                telemetry: jasmine.createSpyObj("telemetry", [
                    'getMetadata',
                    'getValueFormatter',
                    'limitEvaluator',
                    'subscribe'
                ])
            };
            mockComposition = jasmine.createSpyObj('composition', ['load']);
            mockMetadata = jasmine.createSpyObj('metadata', ['valuesForHints']);
            mockFormatter = jasmine.createSpyObj('formatter', ['format']);
            mockEvaluator = jasmine.createSpyObj('evaluator', ['evaluate']);
            mockUnsubscribes = testKeys.reduce(function (map, key) {
                map[key] = jasmine.createSpy('unsubscribe-' + key);
                return map;
            }, {});

            mockmct.composition.get.andReturn(mockComposition);
            mockComposition.load.andReturn(Promise.resolve(testChildren));

            mockmct.telemetry.getMetadata.andReturn(mockMetadata);
            mockmct.telemetry.getValueFormatter.andReturn(mockFormatter);
            mockmct.telemetry.limitEvaluator.andReturn(mockEvaluator);
            mockmct.telemetry.subscribe.andCallFake(function (obj, callback) {
                var key = obj.identifier.key;
                callbacks[key] = callbacks;
                return mockUnsubscribes[key];
            });
            mockMetadata.valuesForHints.andReturn([]);

            view = new AutoflowTabularView(testObject, mockmct);
            view.show(testContainer);

            mockComposition.load().then(function () {
                loaded = true;
            });

            waitsFor(function () {
                return loaded;
            });
        });

        it("populates its container", function () {
            expect(testContainer.children.length > 0).toBe(true);
        });

        it("creates one row per child object", function () {
            var children;
            waitsFor(function () {
                children = $(testContainer).find(".l-autoflow-row");
                return children.length > 0;
            });
            runs(function () {
                expect(children.length).toEqual(testChildren.length);
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
    });
});

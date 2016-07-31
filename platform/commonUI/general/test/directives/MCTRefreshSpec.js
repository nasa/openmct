/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/directives/MCTRefresh"],
    function (MCTRefresh) {
        "use strict";

        describe("The mct-refresh directive", function () {
            var mctRefresh;

            beforeEach(function () {
                mctRefresh = new MCTRefresh();
            });

            it("is applicable as an attribute only", function () {
                expect(mctRefresh.restrict).toEqual("A");
            });

            describe("when linked", function () {
                var mockScope,
                    mockElement,
                    testAttrs,
                    mockTransclude,
                    mockClone,
                    mockUnlisten;

                function fireEvent(event) {
                    mockScope.$on.calls.forEach(function (call) {
                        if (call.args[0] === event) {
                            call.args[1]();
                        }
                    });
                }

                beforeEach(function () {
                    mockScope = jasmine.createSpyObj(
                        "$scope",
                        [ "$eval", "$on", "$apply" ]
                    );
                    mockElement = jasmine.createSpyObj(
                        "elem",
                        [ "empty", "append" ]
                    );
                    testAttrs = { mctRefresh: "some-expr" };
                    mockTransclude = jasmine.createSpy();
                    mockTransclude.andCallFake(function (fn) {
                        fn(mockClone);
                    });
                    mockClone = jasmine.createSpyObj(
                        "elem",
                        [ "empty", "append" ]
                    );
                    mockUnlisten = jasmine.createSpy();

                    mockScope.$eval.andReturn(mockUnlisten);

                    mctRefresh.link(
                        mockScope,
                        mockElement,
                        testAttrs,
                        {},
                        mockTransclude
                    );
                });

                it("adds its transcluded content", function () {
                    expect(mockElement.append)
                        .toHaveBeenCalledWith(mockClone);
                });

                it("passes a callback into its associated expression", function () {
                    expect(mockScope.$eval).toHaveBeenCalledWith(
                        testAttrs.mctRefresh,
                        { callback: jasmine.any(Function) }
                    );
                });

                describe("and triggered via callback", function () {
                    beforeEach(function () {
                        mockScope.$eval.mostRecentCall.args[1].callback();
                    });

                    it("transcludes its content again", function () {
                        expect(mockTransclude.calls.length).toEqual(2);
                    });
                });

                describe("and then destroyed", function () {
                    beforeEach(function () {
                        fireEvent("$destroy");
                    });

                    it("stops listening", function () {
                        expect(mockUnlisten).toHaveBeenCalled();
                    });
                });
            });

        });
    }
);

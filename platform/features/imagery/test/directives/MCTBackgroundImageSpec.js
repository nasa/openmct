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

define(
    ["../../src/directives/MCTBackgroundImage"],
    function (MCTBackgroundImage) {

        describe("The mct-background-image directive", function () {
            var mockDocument,
                mockScope,
                mockElement,
                testImage,
                directive;

            beforeEach(function () {
                mockDocument = [
                    jasmine.createSpyObj('document', ['createElement'])
                ];
                mockScope = jasmine.createSpyObj('scope', [
                    '$watch',
                    '$watchCollection'
                ]);
                mockElement = jasmine.createSpyObj('element', ['css']);
                testImage = {};

                mockDocument[0].createElement.and.returnValue(testImage);

                directive = new MCTBackgroundImage(mockDocument);
            });

            it("is applicable as an attribute", function () {
                expect(directive.restrict).toEqual("A");
            });

            it("two-way-binds its own value", function () {
                expect(directive.scope.mctBackgroundImage).toEqual("=");
            });

            describe("once linked", function () {
                beforeEach(function () {
                    directive.link(mockScope, mockElement, {});
                });

                it("watches for changes to the URL", function () {
                    expect(mockScope.$watch).toHaveBeenCalledWith(
                        'mctBackgroundImage',
                        jasmine.any(Function)
                    );
                });

                it("updates images in-order, even when they load out-of-order", function () {
                    var firstOnload;

                    mockScope.$watch.calls.mostRecent().args[1]("some/url/0");
                    firstOnload = testImage.onload;

                    mockScope.$watch.calls.mostRecent().args[1]("some/url/1");

                    // Resolve in a different order
                    testImage.onload();
                    firstOnload();

                    // Should still have taken the more recent value
                    expect(mockElement.css.calls.mostRecent().args).toEqual([
                        "background-image",
                        "url('some/url/1')"
                    ]);
                });

                it("clears the background image when undefined is passed in", function () {
                    mockScope.$watch.calls.mostRecent().args[1]("some/url/0");
                    testImage.onload();
                    mockScope.$watch.calls.mostRecent().args[1](undefined);

                    expect(mockElement.css.calls.mostRecent().args).toEqual([
                        "background-image",
                        "none"
                    ]);
                });

                it("updates filters on change", function () {
                    var filters = { brightness: 123, contrast: 21 };
                    mockScope.$watchCollection.calls.all().forEach(function (call) {
                        if (call.args[0] === 'filters') {
                            call.args[1](filters);
                        }
                    });
                    expect(mockElement.css).toHaveBeenCalledWith(
                        'filter',
                        'brightness(123%) contrast(21%)'
                    );
                });

                it("clears filters when none are present", function () {
                    mockScope.$watchCollection.calls.all().forEach(function (call) {
                        if (call.args[0] === 'filters') {
                            call.args[1](undefined);
                        }
                    });
                    expect(mockElement.css)
                        .toHaveBeenCalledWith('filter', '');
                });
            });
        });
    }
);


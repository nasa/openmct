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
        var testContainer;
        var mockmct;
        var mockComposition;
        var view;

        beforeEach(function () {
            testType = "some-type";
            testObject = { type: testType };
            testContainer = $('<div>')[0];

            mockmct = {
                composition: jasmine.createSpyObj("composition", ['get'])
            };
            mockComposition = jasmine.createSpyObj('composition', ['load']);

            mockmct.composition.get.andReturn(mockComposition);
            mockComposition.load.andReturn(Promise.resolve([]));

            view = new AutoflowTabularView(testObject, mockmct);
            view.show(testContainer);

            waitsFor(function () {
                return testContainer.children.length > 0;
            });
        });

        it("populates its container", function () {
            expect(testContainer.children.length > 0).toBe(true);
        });

    });
});

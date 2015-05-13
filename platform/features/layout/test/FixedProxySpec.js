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
/*global define,describe,it,expect,beforeEach,jasmine,xit*/

define(
    ['../src/FixedProxy'],
    function (FixedProxy) {
        "use strict";

        describe("Fixed Position view's selection proxy", function () {
            var mockCallback,
                mockQ,
                mockDialogService,
                mockPromise,
                proxy;

            beforeEach(function () {
                mockCallback = jasmine.createSpy('callback');
                mockQ = jasmine.createSpyObj('$q', ['when']);
                mockDialogService = jasmine.createSpyObj('dialogService', ['getUserInput']);
                mockPromise = jasmine.createSpyObj('promise', ['then']);

                mockQ.when.andReturn(mockPromise);

                proxy = new FixedProxy(mockCallback, mockQ, mockDialogService);
            });

            it("handles promised element creation", function () {
                // The element factory may return promises (e.g. if
                // user input is required) so make sure proxy is wrapping these
                proxy.add("fixed.box");
                expect(mockQ.when).toHaveBeenCalled();
            });

            it("notifies its callback when an element is created", function () {
                proxy.add("fixed.box");
                // Callback should not have been invoked yet
                expect(mockCallback).not.toHaveBeenCalled();
                // Resolve the promise
                mockPromise.then.mostRecentCall.args[0]({});
                // Should have fired the callback
                expect(mockCallback).toHaveBeenCalledWith({
                    type: "fixed.box",
                    x: 0,
                    y: 0,
                    width: 1,
                    height: 1
                });
            });

        });
    }
);

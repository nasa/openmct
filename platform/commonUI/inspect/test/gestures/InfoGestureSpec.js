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
/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ['../../src/gestures/InfoGesture'],
    function (InfoGesture) {
        "use strict";

        describe("The info gesture", function () {
            var mockTimeout,
                mockAgentService,
                mockInfoService,
                testDelay = 12321,
                mockElement,
                mockDomainObject,
                mockScope,
                mockOff,
                testMetadata,
                mockPromise,
                mockHide,
                gesture;

            function fireEvent(evt, value) {
                mockElement.on.calls.forEach(function (call) {
                    if (call.args[0] === evt) {
                        call.args[1](value);
                    }
                });
            }

            beforeEach(function () {
                mockTimeout = jasmine.createSpy('$timeout');
                mockTimeout.cancel = jasmine.createSpy('cancel');
                mockAgentService = jasmine.createSpyObj('agentService', ['isMobile']);
                mockInfoService = jasmine.createSpyObj(
                    'infoService',
                    [ 'display' ]
                );
                mockElement = jasmine.createSpyObj(
                    'element',
                    [ 'on', 'off', 'scope', 'css' ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getId', 'getCapability', 'useCapability', 'getModel' ]
                );
                mockScope = jasmine.createSpyObj('$scope', [ '$on' ]);
                mockOff = jasmine.createSpy('$off');
                testMetadata = [ { name: "Test name", value: "Test value" } ];
                mockPromise = jasmine.createSpyObj('promise', ['then']);
                mockHide = jasmine.createSpy('hide');

                mockDomainObject.getModel.andReturn({ name: "Test Object" });
                mockDomainObject.useCapability.andCallFake(function (c) {
                    return (c === 'metadata') ? testMetadata : undefined;
                });
                mockElement.scope.andReturn(mockScope);
                mockScope.$on.andReturn(mockOff);
                mockTimeout.andReturn(mockPromise);
                mockInfoService.display.andReturn(mockHide);

                gesture = new InfoGesture(
                    mockTimeout,
                    mockAgentService,
                    mockInfoService,
                    testDelay,
                    mockElement,
                    mockDomainObject
                );
            });

            it("listens for mouseenter on the representation", function () {
                expect(mockElement.on)
                    .toHaveBeenCalledWith('mouseenter', jasmine.any(Function));
            });

            it("displays an info bubble on a delay after mouseenter", function () {
                fireEvent("mouseenter", { clientX: 1977, clientY: 42 });
                expect(mockTimeout)
                    .toHaveBeenCalledWith(jasmine.any(Function), testDelay);
                mockTimeout.mostRecentCall.args[0]();
                expect(mockInfoService.display).toHaveBeenCalledWith(
                    jasmine.any(String),
                    "Test Object",
                    testMetadata,
                    [ 1977, 42 ]
                );
            });

            it("does not display info bubble if mouse leaves too soon", function () {
                fireEvent("mouseenter", { clientX: 1977, clientY: 42 });
                fireEvent("mouseleave", { clientX: 1977, clientY: 42 });
                expect(mockTimeout.cancel).toHaveBeenCalledWith(mockPromise);
                expect(mockInfoService.display).not.toHaveBeenCalled();
            });

            it("hides a shown bubble when mouse leaves", function () {
                fireEvent("mouseenter", { clientX: 1977, clientY: 42 });
                mockTimeout.mostRecentCall.args[0]();
                expect(mockHide).not.toHaveBeenCalled(); // verify precondition
                fireEvent("mouseleave", {});
                expect(mockHide).toHaveBeenCalled();
            });

            it("tracks mouse position", function () {
                fireEvent("mouseenter", { clientX: 1977, clientY: 42 });
                fireEvent("mousemove", { clientX: 1999, clientY: 11 });
                fireEvent("mousemove", { clientX: 1984, clientY: 11 });
                mockTimeout.mostRecentCall.args[0]();
                // Should have displayed at the latest observed mouse position
                expect(mockInfoService.display).toHaveBeenCalledWith(
                    jasmine.any(String),
                    "Test Object",
                    testMetadata,
                    [ 1984, 11 ]
                );
            });

            it("hides shown bubbles when destroyed", function () {
                fireEvent("mouseenter", { clientX: 1977, clientY: 42 });
                mockTimeout.mostRecentCall.args[0]();
                expect(mockHide).not.toHaveBeenCalled(); // verify precondition
                gesture.destroy();
                expect(mockHide).toHaveBeenCalled();
            });

            it("detaches listeners when destroyed", function () {
                fireEvent("mouseenter", { clientX: 1977, clientY: 42 });
                gesture.destroy();
                mockElement.on.calls.forEach(function (call) {
                    expect(mockElement.off).toHaveBeenCalledWith(
                        call.args[0],
                        call.args[1]
                    );
                });
            });

        });
    }
);

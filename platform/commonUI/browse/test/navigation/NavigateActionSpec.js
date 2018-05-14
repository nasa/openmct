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

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define([
    "../../src/navigation/NavigateAction"
], function (
    NavigateAction
) {

    describe("The navigate action", function () {
        var mockNavigationService,
            mockDomainObject,
            action;


        function waitForCall() {
            var called = false;
            waitsFor(function () {
                return called;
            });
            return function () {
                called = true;
            };
        }

        beforeEach(function () {
            mockNavigationService = jasmine.createSpyObj(
                "navigationService",
                [
                    "shouldNavigate",
                    "setNavigation"
                ]
            );

            mockDomainObject = {};

            action = new NavigateAction(
                mockNavigationService,
                { domainObject: mockDomainObject }
            );
        });

        it("sets navigation if it is allowed", function () {
            mockNavigationService.shouldNavigate.andReturn(true);
            action.perform()
                .then(waitForCall());
            runs(function () {
                expect(mockNavigationService.setNavigation)
                    .toHaveBeenCalledWith(mockDomainObject, true);
            });
        });

        it("does not set navigation if it is not allowed", function () {
            mockNavigationService.shouldNavigate.andReturn(false);
            var onSuccess = jasmine.createSpy('onSuccess');
            action.perform()
                .then(onSuccess, waitForCall());
            runs(function () {
                expect(onSuccess).not.toHaveBeenCalled();
                expect(mockNavigationService.setNavigation)
                    .not
                    .toHaveBeenCalledWith(mockDomainObject);
            });
        });

        it("is only applicable when a domain object is in context", function () {
            expect(NavigateAction.appliesTo({})).toBeFalsy();
            expect(NavigateAction.appliesTo({
                domainObject: mockDomainObject
            })).toBeTruthy();
        });

    });
});

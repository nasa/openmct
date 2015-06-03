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
/*global define,describe,it,xit,expect,beforeEach,jasmine*/

define(
    ['../../src/actions/PropertiesAction'],
    function (PropertiesAction) {
        "use strict";

        describe("Properties action", function () {
            var capabilities, model, object, context, input, dialogService, action;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                capabilities = {
                    type: {
                        getProperties: function () { return []; },
                        hasFeature: jasmine.createSpy('hasFeature')
                    },
                    persistence: jasmine.createSpyObj("persistence", ["persist"]),
                    mutation: jasmine.createSpy("mutation")
                };
                model = {};
                input = {};
                object = {
                    getId: function () { return 'test-id'; },
                    getCapability: function (k) { return capabilities[k]; },
                    getModel: function () { return model; },
                    useCapability: function (k, v) { return capabilities[k](v); },
                    hasCapability: function () { return true; }
                };
                context = { someKey: "some value", domainObject: object };
                dialogService = {
                    getUserInput: function () {
                        return mockPromise(input);
                    }
                };

                capabilities.type.hasFeature.andReturn(true);
                capabilities.mutation.andReturn(true);

                action = new PropertiesAction(dialogService, context);
            });

            it("persists when an action is performed", function () {
                action.perform();
                expect(capabilities.persistence.persist)
                    .toHaveBeenCalled();
            });

            it("does not persist any changes upon cancel", function () {
                input = undefined;
                action.perform();
                expect(capabilities.persistence.persist)
                    .not.toHaveBeenCalled();
            });

            it("mutates an object when performed", function () {
                action.perform();
                expect(capabilities.mutation).toHaveBeenCalled();
                capabilities.mutation.mostRecentCall.args[0]({});
            });

            it("is only applicable when a domain object is in context", function () {
                expect(PropertiesAction.appliesTo(context)).toBeTruthy();
                expect(PropertiesAction.appliesTo({})).toBeFalsy();
                // Make sure it checked for creatability
                expect(capabilities.type.hasFeature).toHaveBeenCalledWith('creation');
            });
        });
    }
);

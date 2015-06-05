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
    ["../src/PersistenceFailureHandler", "../src/PersistenceFailureConstants"],
    function (PersistenceFailureHandler, Constants) {
        "use strict";

        describe("The persistence failure handler", function () {
            var mockQ,
                mockDialogService,
                mockFailures,
                mockPromise,
                handler;

            function asPromise(value) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    }
                };
            }

            function makeMockFailure(id, index) {
                var mockFailure = jasmine.createSpyObj(
                        'failure-' + id,
                        ['requeue']
                    ),
                    mockPersistence = jasmine.createSpyObj(
                        'persistence-' + id,
                        ['refresh', 'persist']
                    );
                mockFailure.domainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getCapability', 'useCapability', 'getModel']
                );
                mockFailure.domainObject.getCapability.andCallFake(function (c) {
                    return (c === 'persistence') && mockPersistence;
                });
                mockFailure.domainObject.getModel.andReturn({ id: id, modified: index });
                mockFailure.persistence = mockPersistence;
                mockFailure.id = id;
                mockFailure.error = { key: Constants.REVISION_ERROR_KEY };
                return mockFailure;
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj('$q', ['all', 'when']);
                mockDialogService = jasmine.createSpyObj('dialogService', ['getUserChoice']);
                mockFailures = ['a', 'b', 'c'].map(makeMockFailure);
                mockPromise = jasmine.createSpyObj('promise', ['then']);
                mockDialogService.getUserChoice.andReturn(mockPromise);
                mockQ.all.andReturn(mockPromise);
                mockPromise.then.andReturn(mockPromise);
                handler = new PersistenceFailureHandler(mockQ, mockDialogService);
            });

            it("shows a dialog to handle failures", function () {
                handler.handle(mockFailures);
                expect(mockDialogService.getUserChoice).toHaveBeenCalled();
            });

            it("overwrites on request", function () {
                mockQ.all.andReturn(asPromise([]));
                handler.handle(mockFailures);
                // User chooses overwrite
                mockPromise.then.mostRecentCall.args[0](Constants.OVERWRITE_KEY);
                // Should refresh, remutate, and requeue all objects
                mockFailures.forEach(function (mockFailure, i) {
                    expect(mockFailure.persistence.refresh).toHaveBeenCalled();
                    expect(mockFailure.requeue).toHaveBeenCalled();
                    expect(mockFailure.domainObject.useCapability).toHaveBeenCalledWith(
                        'mutation',
                        jasmine.any(Function),
                        i // timestamp
                    );
                    expect(mockFailure.domainObject.useCapability.mostRecentCall.args[1]())
                        .toEqual({ id: mockFailure.id, modified: i });
                });
            });

            it("discards on request", function () {
                mockQ.all.andReturn(asPromise([]));
                handler.handle(mockFailures);
                // User chooses overwrite
                mockPromise.then.mostRecentCall.args[0](false);
                // Should refresh, but not remutate, and requeue all objects
                mockFailures.forEach(function (mockFailure, i) {
                    expect(mockFailure.persistence.refresh).toHaveBeenCalled();
                    expect(mockFailure.requeue).not.toHaveBeenCalled();
                    expect(mockFailure.domainObject.useCapability).not.toHaveBeenCalled();
                });
            });

        });
    }
);
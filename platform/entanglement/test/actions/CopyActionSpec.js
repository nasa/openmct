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

/*global define,describe,beforeEach,it,jasmine,expect,spyOn */

define(
    [
        '../../src/actions/CopyAction',
        '../services/MockCopyService',
        '../DomainObjectFactory'
    ],
    function (CopyAction, MockCopyService, domainObjectFactory) {
        "use strict";

        describe("Copy Action", function () {

            var copyAction,
                policyService,
                locationService,
                locationServicePromise,
                copyService,
                context,
                selectedObject,
                selectedObjectContextCapability,
                currentParent,
                newParent,
                notificationService,
                notification,
                dialogService,
                mockLog,
                abstractComposePromise,
                progress = {phase: "copying", totalObjects: 10, processed: 1};

            beforeEach(function () {
                policyService = jasmine.createSpyObj(
                    'policyService',
                    [ 'allow' ]
                );
                policyService.allow.andReturn(true);

                selectedObjectContextCapability = jasmine.createSpyObj(
                    'selectedObjectContextCapability',
                    [
                        'getParent'
                    ]
                );

                selectedObject = domainObjectFactory({
                    name: 'selectedObject',
                    model: {
                        name: 'selectedObject'
                    },
                    capabilities: {
                        context: selectedObjectContextCapability
                    }
                });

                currentParent = domainObjectFactory({
                    name: 'currentParent'
                });

                selectedObjectContextCapability
                    .getParent
                    .andReturn(currentParent);

                newParent = domainObjectFactory({
                    name: 'newParent'
                });

                locationService = jasmine.createSpyObj(
                    'locationService',
                    [
                        'getLocationFromUser'
                    ]
                );

                locationServicePromise = jasmine.createSpyObj(
                    'locationServicePromise',
                    [
                        'then'
                    ]
                );

                abstractComposePromise = jasmine.createSpyObj(
                    'abstractComposePromise',
                    [
                        'then'
                    ]
                );

                abstractComposePromise.then.andCallFake(function(success, error, notify){
                    notify(progress);
                    success();
                });

                locationServicePromise.then.andCallFake(function(callback){
                    callback(newParent);
                    return abstractComposePromise;
                });

                locationService
                    .getLocationFromUser
                    .andReturn(locationServicePromise);

                dialogService = jasmine.createSpyObj('dialogService',
                    ['showBlockingMessage', 'dismiss']
                );

                notification = jasmine.createSpyObj('notification',
                    ['dismiss', 'model']
                );

                notificationService = jasmine.createSpyObj('notificationService',
                    ['notify', 'info']
                );

                notificationService.notify.andReturn(notification);

                mockLog = jasmine.createSpyObj('log', ['error']);

                copyService = new MockCopyService();
            });


            describe("with context from context-action", function () {
                beforeEach(function () {
                    context = {
                        domainObject: selectedObject
                    };

                    copyAction = new CopyAction(
                        mockLog,
                        policyService,
                        locationService,
                        copyService,
                        dialogService,
                        notificationService,
                        context
                    );
                });

                it("initializes happily", function () {
                    expect(copyAction).toBeDefined();
                });

                describe("when performed it", function () {
                    beforeEach(function () {
                        spyOn(copyAction, 'progress').andCallThrough();
                        copyAction.perform();
                    });

                    it("prompts for location", function () {
                        expect(locationService.getLocationFromUser)
                            .toHaveBeenCalledWith(
                                "Duplicate selectedObject to a location",
                                "Duplicate To",
                                jasmine.any(Function),
                                currentParent
                            );
                    });

                    it("waits for location from user", function () {
                        expect(locationServicePromise.then)
                            .toHaveBeenCalledWith(jasmine.any(Function));
                    });

                    it("copies object to selected location", function () {
                        locationServicePromise
                            .then
                            .mostRecentCall
                            .args[0](newParent);

                        expect(copyService.perform)
                            .toHaveBeenCalledWith(selectedObject, newParent);
                    });

                    it("notifies the user of progress", function(){
                        expect(notificationService.info).toHaveBeenCalled();
                    });

                });
            });

            describe("with context from drag-drop", function () {
                beforeEach(function () {
                    context = {
                        selectedObject: selectedObject,
                        domainObject: newParent
                    };

                    copyAction = new CopyAction(
                        mockLog,
                        policyService,
                        locationService,
                        copyService,
                        dialogService,
                        notificationService,
                        context
                    );
                });

                it("initializes happily", function () {
                    expect(copyAction).toBeDefined();
                });


                it("performs copy immediately", function () {
                    copyAction.perform();
                    expect(copyService.perform)
                        .toHaveBeenCalledWith(selectedObject, newParent);
                });
            });
        });
    }
);

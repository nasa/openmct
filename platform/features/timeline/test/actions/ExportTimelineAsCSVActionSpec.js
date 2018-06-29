/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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
    ['../../src/actions/ExportTimelineAsCSVAction'],
    function (ExportTimelineAsCSVAction) {
        describe("ExportTimelineAsCSVAction", function () {
            var mockLog,
                mockExportService,
                mockNotificationService,
                mockNotification,
                mockDomainObject,
                mockType,
                testContext,
                testType,
                action,
                actionPromise;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId', 'getModel', 'getCapability', 'hasCapability']
                );
                mockType = jasmine.createSpyObj('type', ['instanceOf']);

                mockLog = jasmine.createSpyObj('$log', [
                    'warn',
                    'error',
                    'info',
                    'debug'
                ]);
                mockExportService = jasmine.createSpyObj(
                    'exportService',
                    ['exportCSV']
                );
                mockNotificationService = jasmine.createSpyObj(
                    'notificationService',
                    ['notify', 'error']
                );
                mockNotification = jasmine.createSpyObj(
                    'notification',
                    ['dismiss']
                );

                mockNotificationService.notify.and.returnValue(mockNotification);

                mockDomainObject.hasCapability.and.returnValue(true);
                mockDomainObject.getCapability.and.returnValue(mockType);
                mockType.instanceOf.and.callFake(function (type) {
                    return type === testType;
                });

                testContext = { domainObject: mockDomainObject };

                action = new ExportTimelineAsCSVAction(
                    mockLog,
                    mockExportService,
                    mockNotificationService,
                    [],
                    testContext
                );
            });

            it("is applicable to timelines", function () {
                testType = 'timeline';
                expect(ExportTimelineAsCSVAction.appliesTo(testContext))
                    .toBe(true);
            });

            it("is not applicable to non-timelines", function () {
                testType = 'folder';
                expect(ExportTimelineAsCSVAction.appliesTo(testContext))
                    .toBe(false);
            });

            describe("when performed", function () {
                var testPromise;

                beforeEach(function () {
                    // White-boxy; we know most work is delegated
                    // to the associated Task, so stub out that interaction.
                    spyOn(action.task, "run").and.callFake(function () {
                        return new Promise(function (resolve, reject) {
                            testPromise = {
                                resolve: resolve,
                                reject: reject
                            };
                        });
                    });
                    actionPromise = action.perform();
                });

                it("shows a notification", function () {
                    expect(mockNotificationService.notify)
                        .toHaveBeenCalled();
                });

                it("starts an export task", function () {
                    expect(action.task.run).toHaveBeenCalled();
                });

                describe("and completed", function () {
                    beforeEach(function () {
                        testPromise.resolve();
                        return actionPromise;
                    });

                    it("dismisses the displayed notification", function () {
                        expect(mockNotification.dismiss)
                            .toHaveBeenCalled();
                    });

                    it("shows no error messages", function () {
                        expect(mockNotificationService.error)
                            .not.toHaveBeenCalled();
                    });
                });

                describe("and an error occurs", function () {
                    var testError;

                    beforeEach(function () {
                        testError = { someProperty: "some value" };
                        testPromise.reject(testError);

                        return actionPromise;
                    });

                    it("dismisses the displayed notification", function () {
                        expect(mockNotification.dismiss)
                            .toHaveBeenCalled();
                    });

                    it("shows an error message", function () {
                        expect(mockNotificationService.error)
                            .toHaveBeenCalledWith(jasmine.any(String));
                    });

                    it("logs the root cause", function () {
                        expect(mockLog.warn).toHaveBeenCalledWith(testError);
                    });
                });
            });
        });
    }
);

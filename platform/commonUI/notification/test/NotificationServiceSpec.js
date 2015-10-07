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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine */

define(
    ['../src/NotificationService','../src/MessageSeverity'],
    function (NotificationService, MessageSeverity) {
        "use strict";

        describe("The notification service ", function () {
            var notificationService,
                mockTimeout,
                mockAutoDismiss,
                successModel = {
                    title: "Mock Success Notification",
                    severity: MessageSeverity.SUCCESS
                },
                errorModel = {
                    title: "Mock Error Notification",
                    severity: MessageSeverity.ERROR
                };

        /**
         * 1) Calling .notify results in a new notification being created
         * with the provided model and set to the active notification
         *
         * 2) Calling .notify with autoDismiss results in a SUCCESS notification
         * becoming dismissed after timeout has elapsed
         *
         * 3) Calling .notify with autoDismiss results in an ERROR notification
         * being MINIMIZED after a timeout has elapsed
         * 
         * 4) Calling .notify with an active success notification results in that
         * notification being auto-dismissed, and the new notification becoming
         * active. DONE
         * 
         * 5) Calling .notify with an active error notification results in that
         * notification being auto-minimized and the new notification becoming
         * active. DONE
         *
         * 6) Calling .notify with an active error notification, AND a
         * queued error notification results in the active notification
         * being auto-dismissed, the next message in the queue becoming
         * active, then auto-dismissed, and then the provided notification
         * becoming active.
         */

        /**
         var model = {
            title: string,
            progress: number,
            severity: MessageSeverity,
            unknownProgress: boolean,
            minimized: boolean,
            autoDismiss: boolean | number,
            actions: {
                label: string,
                action: function
            }
        }
         */

            beforeEach(function(){
                mockTimeout = jasmine.createSpy("$timeout");
                mockAutoDismiss = 0;
                notificationService = new NotificationService(
                    mockTimeout, mockAutoDismiss);
            });

            it("Calls the notification service with a new notification, making" +
                " the notification active", function() {
                var activeNotification;
                notificationService.notify(successModel);
                activeNotification = notificationService.getActiveNotification();
                expect(activeNotification.model).toBe(successModel);
            });

            describe(" called with multiple notifications", function(){
                it("auto-dismisses the previously active notification, making" +
                    " the new notification active", function() {
                    var activeNotification;
                    //First pre-load with a success message
                    notificationService.notify(successModel);
                    activeNotification =
                        notificationService.getActiveNotification();
                    //Initially expect the active notification to be success
                    expect(activeNotification.model).toBe(successModel);
                    //Then notify of an error
                    notificationService.notify(errorModel);
                    //But it should be auto-dismissed and replaced with the
                    // error notification
                    mockTimeout.mostRecentCall.args[0]();
                    activeNotification = notificationService.getActiveNotification();
                    expect(activeNotification.model).toBe(errorModel);
                });
                it("auto-dismisses an active success notification, removing" +
                    " it completely", function() {
                    //First pre-load with a success message
                    notificationService.notify(successModel);
                    //Then notify of an error
                    notificationService.notify(errorModel);
                    expect(notificationService.notifications.length).toEqual(2);
                    mockTimeout.mostRecentCall.args[0]();
                    //Previous success message should be completely dismissed
                    expect(notificationService.notifications.length).toEqual(1);
                });
                it("auto-minimizes an active error notification", function() {
                    var activeNotification;
                    //First pre-load with a success message
                    notificationService.notify(errorModel);
                    //Then notify of an error
                    notificationService.notify(successModel);
                    expect(notificationService.notifications.length).toEqual(2);
                    //Mock the auto-minimize
                    mockTimeout.mostRecentCall.args[0]();
                    //Previous error message should be minimized, not
                    // dismissed
                    expect(notificationService.notifications.length).toEqual(2);
                    activeNotification =
                        notificationService.getActiveNotification();
                    expect(activeNotification.model).toBe(successModel);
                    expect(errorModel.minimized).toEqual(true);

                });
            });
        });
    });
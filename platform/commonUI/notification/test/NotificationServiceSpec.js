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
/*global describe,it,expect,beforeEach,jasmine*/

define(
    ['../src/NotificationService'],
    function (NotificationService) {

        describe("The notification service ", function () {
            var notificationService,
                mockTimeout,
                mockAutoDismiss,
                mockMinimizeTimeout,
                mockTopicFunction,
                mockTopicObject,
                infoModel,
                alertModel,
                errorModel;

            function elapseTimeout() {
                mockTimeout.calls.mostRecent().args[0]();
            }

            beforeEach(function () {
                mockTimeout = jasmine.createSpy("$timeout");
                mockTopicFunction = jasmine.createSpy("topic");
                mockTopicObject = jasmine.createSpyObj("topicObject", ["listen", "notify"]);
                mockTopicFunction.and.returnValue(mockTopicObject);

                mockAutoDismiss = mockMinimizeTimeout = 1000;
                notificationService = new NotificationService(mockTimeout, mockTopicFunction, mockAutoDismiss, mockMinimizeTimeout);

                infoModel = {
                    title: "Mock Info Notification",
                    severity: "info"
                };

                alertModel = {
                    title: "Mock Alert Notification",
                    severity: "alert"
                };

                errorModel = {
                    title: "Mock Error Notification",
                    severity: "error"
                };
            });

            it("notifies listeners on dismissal of notification", function () {
                var dismissListener = jasmine.createSpy("ondismiss");
                var notification = notificationService.notify(infoModel);
                notification.onDismiss(dismissListener);
                expect(mockTopicObject.listen).toHaveBeenCalled();
                notification.dismiss();
                expect(mockTopicObject.notify).toHaveBeenCalled();
                mockTopicObject.listen.calls.mostRecent().args[0]();
                expect(dismissListener).toHaveBeenCalled();
            });

            it("dismisses a notification when the notification's dismiss method is used", function () {
                var notification = notificationService.info(infoModel);
                notification.dismiss();
                expect(notificationService.getActiveNotification()).toBeUndefined();
                expect(notificationService.notifications.length).toEqual(0);
            });

            it("minimizes a notification when the notification's minimize method is used", function () {
                var notification = notificationService.info(infoModel);
                notification.minimize();
                elapseTimeout(); // needed for the minimize animation timeout
                expect(notificationService.getActiveNotification()).toBeUndefined();
                expect(notificationService.notifications.length).toEqual(1);
                expect(notificationService.notifications[0]).toEqual(notification);
            });

            describe("when receiving info notifications", function () {
                it("minimizes info notifications if the caller disables auto-dismiss", function () {
                    infoModel.autoDismiss = false;
                    var notification = notificationService.info(infoModel);
                    elapseTimeout();
                    // 2nd elapse for the minimize animation timeout
                    elapseTimeout();
                    expect(notificationService.getActiveNotification()).toBeUndefined();
                    expect(notificationService.notifications.length).toEqual(1);
                    expect(notificationService.notifications[0]).toEqual(notification);
                });

                it("dismisses info notifications if the caller ignores auto-dismiss", function () {
                    notificationService.info(infoModel);
                    elapseTimeout();
                    expect(notificationService.getActiveNotification()).toBeUndefined();
                    expect(notificationService.notifications.length).toEqual(0);
                });

                it("dismisses info notifications if the caller requests auto-dismiss", function () {
                    infoModel.autoDismiss = true;
                    notificationService.info(infoModel);
                    elapseTimeout();
                    expect(notificationService.getActiveNotification()).toBeUndefined();
                    expect(notificationService.notifications.length).toEqual(0);
                });
            });

            describe("when receiving alert notifications", function () {
                it("minimizes alert notifications if the caller enables auto-dismiss", function () {
                    alertModel.autoDismiss = true;
                    var notification = notificationService.alert(alertModel);
                    elapseTimeout();
                    elapseTimeout();
                    expect(notificationService.getActiveNotification()).toBeUndefined();
                    expect(notificationService.notifications.length).toEqual(1);
                    expect(notificationService.notifications[0]).toEqual(notification);
                });

                it("keeps alert notifications active if the caller disables auto-dismiss", function () {
                    mockTimeout.and.callFake(function (callback, time) {
                        callback();
                    });
                    alertModel.autoDismiss = false;
                    var notification = notificationService.alert(alertModel);
                    expect(notificationService.getActiveNotification()).toEqual(notification);
                    expect(notificationService.notifications.length).toEqual(1);
                    expect(notificationService.notifications[0]).toEqual(notification);
                });

                it("keeps alert notifications active if the caller ignores auto-dismiss", function () {
                    mockTimeout.and.callFake(function (callback, time) {
                        callback();
                    });
                    var notification = notificationService.alert(alertModel);
                    expect(notificationService.getActiveNotification()).toEqual(notification);
                    expect(notificationService.notifications.length).toEqual(1);
                    expect(notificationService.notifications[0]).toEqual(notification);
                });
            });

            describe("when receiving error notifications", function () {
                it("minimizes error notifications if the caller enables auto-dismiss", function () {
                    errorModel.autoDismiss = true;
                    var notification = notificationService.error(errorModel);
                    elapseTimeout();
                    elapseTimeout();
                    expect(notificationService.getActiveNotification()).toBeUndefined();
                    expect(notificationService.notifications.length).toEqual(1);
                    expect(notificationService.notifications[0]).toEqual(notification);
                });

                it("keeps error notifications active if the caller disables auto-dismiss", function () {
                    mockTimeout.and.callFake(function (callback, time) {
                        callback();
                    });
                    errorModel.autoDismiss = false;
                    var notification = notificationService.error(errorModel);
                    expect(notificationService.getActiveNotification()).toEqual(notification);
                    expect(notificationService.notifications.length).toEqual(1);
                    expect(notificationService.notifications[0]).toEqual(notification);
                });

                it("keeps error notifications active if the caller ignores auto-dismiss", function () {
                    mockTimeout.and.callFake(function (callback, time) {
                        callback();
                    });
                    var notification = notificationService.error(errorModel);
                    expect(notificationService.getActiveNotification()).toEqual(notification);
                    expect(notificationService.notifications.length).toEqual(1);
                    expect(notificationService.notifications[0]).toEqual(notification);
                });
            });

            describe("when called with multiple notifications", function () {
                it("auto-dismisses the previously active notification, making the new notification active", function () {
                    var activeNotification;
                    infoModel.autoDismiss = false;
                    //First pre-load with a info message
                    notificationService.notify(infoModel);
                    activeNotification = notificationService.getActiveNotification();
                    //Initially expect the active notification to be info
                    expect(activeNotification.model).toBe(infoModel);
                    //Then notify of an error
                    notificationService.notify(errorModel);
                    //But it should be auto-dismissed and replaced with the
                    // error notification
                    elapseTimeout();
                    //Two timeouts, one is to force minimization after
                    // displaying the message for a minimum period, the
                    // second is to allow minimization animation to take place.
                    elapseTimeout();
                    activeNotification = notificationService.getActiveNotification();
                    expect(activeNotification.model).toBe(errorModel);
                });

                it("auto-minimizes an active error notification", function () {
                    var activeNotification;
                    //First pre-load with an error message
                    notificationService.notify(errorModel);
                    //Then notify of info
                    notificationService.notify(infoModel);
                    expect(notificationService.notifications.length).toEqual(2);
                    //Mock the auto-minimize
                    elapseTimeout();
                    //Two timeouts, one is to force minimization after
                    // displaying the message for a minimum period, the
                    // second is to allow minimization animation to take place.
                    elapseTimeout();
                    //Previous error message should be minimized, not
                    // dismissed
                    expect(notificationService.notifications.length).toEqual(2);
                    activeNotification = notificationService.getActiveNotification();
                    expect(activeNotification.model).toBe(infoModel);
                    expect(errorModel.minimized).toEqual(true);
                });

                it("auto-minimizes errors when a number of them arrive in short succession", function () {
                    var activeNotification,
                        error2 = {
                            title: "Second Mock Error Notification",
                            severity: "error"
                        },
                        error3 = {
                            title: "Third Mock Error Notification",
                            severity: "error"
                        };

                    //First pre-load with a info message
                    notificationService.notify(errorModel);
                    //Then notify of a third error
                    notificationService.notify(error2);
                    notificationService.notify(error3);
                    expect(notificationService.notifications.length).toEqual(3);
                    //Mock the auto-minimize
                    elapseTimeout();
                    //Two timeouts, one is to force minimization after
                    // displaying the message for a minimum period, the
                    // second is to allow minimization animation to take place.
                    elapseTimeout();
                    //Previous error message should be minimized, not
                    // dismissed
                    expect(notificationService.notifications.length).toEqual(3);
                    activeNotification = notificationService.getActiveNotification();
                    expect(activeNotification.model).toBe(error2);
                    expect(errorModel.minimized).toEqual(true);

                    //Mock the second auto-minimize
                    elapseTimeout();
                    //Two timeouts, one is to force minimization after
                    // displaying the message for a minimum period, the
                    // second is to allow minimization animation to take place.
                    elapseTimeout();
                    activeNotification = notificationService.getActiveNotification();
                    expect(activeNotification.model).toBe(error3);
                    expect(error2.minimized).toEqual(true);
                });
            });
        });
    }
);

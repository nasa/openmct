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
    ['../src/NotificationIndicatorController'],
    function (NotificationIndicatorController) {
        "use strict";

        describe("The notification indicator controller ", function () {
            var mockNotificationService,
                mockScope,
                mockDialogService;

            beforeEach(function(){
                mockNotificationService = jasmine.createSpy("notificationService");
                mockScope = jasmine.createSpy("$scope");
                mockDialogService = jasmine.createSpyObj(
                    "dialogService",
                    ["getDialogResponse","dismiss"]
                );
            });

            it("exposes the highest notification severity to the template", function() {
                mockNotificationService.highest = {
                    severity: "error"
                };
                var controller = new NotificationIndicatorController(mockScope, mockNotificationService, mockDialogService);
                expect(mockScope.highest).toBeTruthy();
                expect(mockScope.highest.severity).toBe("error");
            });

            it("invokes the dialog service to show list of messages", function() {
                var controller = new NotificationIndicatorController(mockScope, mockNotificationService, mockDialogService);
                expect(mockScope.showNotificationsList).toBeDefined();
                mockScope.showNotificationsList();
                expect(mockDialogService.getDialogResponse).toHaveBeenCalled();
                expect(mockDialogService.getDialogResponse.mostRecentCall.args[0]).toBe('overlay-message-list');
                expect(mockDialogService.getDialogResponse.mostRecentCall.args[1].dialog).toBeDefined();
                expect(mockDialogService.getDialogResponse.mostRecentCall.args[1].cancel).toBeDefined();
                //Invoke the cancel callback
                mockDialogService.getDialogResponse.mostRecentCall.args[1].cancel();
                expect(mockDialogService.dismiss).toHaveBeenCalled();
            });

            it("provides a means of dismissing the message list", function() {
                var controller = new NotificationIndicatorController(mockScope, mockNotificationService, mockDialogService);
                expect(mockScope.showNotificationsList).toBeDefined();
                mockScope.showNotificationsList();
                expect(mockDialogService.getDialogResponse).toHaveBeenCalled();
                expect(mockDialogService.getDialogResponse.mostRecentCall.args[1].cancel).toBeDefined();
                //Invoke the cancel callback
                mockDialogService.getDialogResponse.mostRecentCall.args[1].cancel();
                expect(mockDialogService.dismiss).toHaveBeenCalled();
            });

        });
    }
);

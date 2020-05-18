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

define(
    [],
    function () {

        /**
         * Provides an indicator that is visible when there are
         * banner notifications that have been minimized. Will also indicate
         * the number of notifications. Notifications can be viewed by
         * clicking on the indicator to launch a dialog showing a list of
         * notifications.
         * @param $scope
         * @param notificationService
         * @param dialogService
         * @constructor
         */
        function NotificationIndicatorController($scope, openmct, dialogService) {
            $scope.notifications = openmct.notifications.notifications;
            $scope.highest = openmct.notifications.highest;

            /**
             * Launch a dialog showing a list of current notifications.
             */
            $scope.showNotificationsList = function () {
                let notificationsList = openmct.notifications.notifications.map(notification => {
                    if (notification.model.severity === 'alert' || notification.model.severity === 'info') {
                        notification.model.primaryOption = {
                            label: 'Dismiss',
                            callback: () => {
                                let currentIndex = notificationsList.indexOf(notification);
                                notification.dismiss();
                                notificationsList.splice(currentIndex, 1);
                            }
                        };
                    }

                    return notification;
                });
                dialogService.getDialogResponse('overlay-message-list', {
                    dialog: {
                        title: "Messages",
                        //Launch the message list dialog with the models
                        // from the notifications
                        messages: notificationsList
                    }
                });

            };
        }

        return NotificationIndicatorController;
    }
);


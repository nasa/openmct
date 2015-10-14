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
/*global define*/

define(
    ['../../../platform/commonUI/notification/src/MessageSeverity'],
    function (MessageSeverity) {
        "use strict";

        function NotificationLaunchController($scope, $timeout, notificationService) {
            var messageCounter = 1;
            $scope.newSuccess = function(){

                notificationService.info({
                    title: "Success notification!"
                })
            };

            function getExampleActionText() {
                var actionTexts = [
                    "Adipiscing turpis mauris in enim elementu hac, enim aliquam etiam.",
                    "Eros turpis, pulvinar turpis eros eu",
                    "Lundium nascetur a, lectus montes ac, parturient in natoque, duis risus risus pulvinar pid rhoncus, habitasse auctor natoque!"
                ];
                return actionTexts[Math.floor(Math.random()*3)];
            }

            function getExampleActions() {
                var actions = [
                    {
                        label: "Try Again",
                        action: function () {
                            $log.debug("Try Again pressed");
                        }
                    },
                    {
                        label: "Remove",
                        action: function () {
                            $log.debug("Remove pressed");
                        }
                    },
                    {
                        label: "Cancel",
                        action: function () {
                            $log.debug("Cancel pressed");
                        }
                    }
                ];

                // Randomly remove some actions off the top; leave at least one
                actions.splice(0,Math.floor(Math.random() * actions.length));

                return actions;
            }

            function getExampleSeverity() {
                var severities = [
                    MessageSeverity.INFO,
                    MessageSeverity.ALERT,
                    MessageSeverity.ERROR
                ];
                return severities[Math.floor(Math.random() * severities.length)];
            }
            
            $scope.newError = function(){

                notificationService.notify({
                    title: "Error notification " + messageCounter++ + "!",
                    hint: "An error has occurred",
                    severity: MessageSeverity.ERROR,
                    primaryAction: {
                        label: 'Retry',
                        action: function() {
                            console.log('Retry clicked');
                        }
                    },
                    actions: getExampleActions()});
            };

            $scope.newAlert = function(){

                notificationService.notify({
                    title: "Error notification " + messageCounter++ + "!",
                    hint: "An error has occurred",
                    severity: MessageSeverity.ALERT,
                    primaryAction: {
                        label: 'Retry',
                        action: function() {
                            console.log('Retry clicked');
                        }
                    },
                    actions: getExampleActions()});
            };

            $scope.newProgress = function(){

                var notification = {
                    title: "Progress notification!",
                    severity: MessageSeverity.INFO,
                    progress: 0,
                    actionText: getExampleActionText(),
                    unknownProgress: false

                };

                function incrementProgress(notification) {
                    notification.progress = Math.min(100, Math.floor(notification.progress + Math.random() * 30));
                    notification.progressText = ["Estimated time remaining:" +
                    " about ", 60 - Math.floor((notification.progress / 100) * 60), " seconds"].join(" ");
                    if (notification.progress < 100) {
                        $timeout(function(){incrementProgress(notification)}, 1000);
                    }
                }

                notificationService.notify(notification);
                incrementProgress(notification);
            };

        }
        return NotificationLaunchController;
    }
);

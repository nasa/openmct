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
    [],
    function () {
        "use strict";

        function DialogLaunchController($scope, dialogService, $timeout, $log, messageSeverity) {
            $scope.launchProgress = function (knownProgress) {
                var model = {
                    title: "Progress Dialog Example",
                    progress: 0,
                    hint: "Do not navigate away from this page or close this browser tab while this operation is in progress.",
                    actionText: "Calculating...",
                    unknownProgress: !knownProgress,
                    unknownDuration: false,
                    severity: messageSeverity.INFO,
                    actions: [
                        {
                            label: "Cancel Operation",
                            action: function () {
                                $log.debug("Operation cancelled");
                                dialogService.dismiss();
                            }
                        },
                        {
                            label: "Do something else...",
                            action: function () {
                                $log.debug("Something else pressed");
                            }
                        }
                    ]
                };

                function incrementProgress() {
                    model.progress = Math.min(100, Math.floor(model.progress + Math.random() * 30));
                    model.progressText = ["Estimated time remaining: about ", 60 - Math.floor((model.progress / 100) * 60), " seconds"].join(" ");
                    if (model.progress < 100) {
                        $timeout(incrementProgress, 1000);
                    }
                }

                if (dialogService.showBlockingMessage(model)) {
                    //Do processing here
                    model.actionText = "Processing 100 objects...";
                    if (knownProgress) {
                        $timeout(incrementProgress, 1000);
                    }
                } else {
                    $log.error("Could not display modal dialog");
                }
            };

            $scope.launchError = function () {
                var model = {
                    title: "Error Dialog Example",
                    actionText: "Something happened, and it was not good.",
                    severity: messageSeverity.ERROR,
                    actions: [
                        {
                            label: "Try Again",
                            action: function () {
                                $log.debug("Try Again Pressed");
                                dialogService.dismiss();
                            }
                        },
                        {
                            label: "Cancel",
                            action: function () {
                                $log.debug("Cancel Pressed");
                                dialogService.dismiss();
                            }
                        }
                    ]
                };

                if (!dialogService.showBlockingMessage(model)) {
                    $log.error("Could not display modal dialog");
                }
            };

            $scope.launchMessages = function () {
                var model = {
                    title: "Messages",
                    severity: messageSeverity.MESSAGES,
                    actions: [
                        {
                            label: "Done",
                            action: function () {
                                $log.debug("Done pressed");
                                dialogService.dismiss();
                            }
                        }
                    ],
                    messages: []
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
                        messageSeverity.INFO,
                        messageSeverity.ALERT,
                        messageSeverity.ERROR
                    ];
                    return severities[Math.floor(Math.random() * severities.length)];
                }

                function createMessage (messageNumber) {
                    var messageModel = {
                            ngModel: {
                                dialog: {
                                    title: "Message Title " + messageNumber,
                                    actionText: getExampleActionText(),
                                    severity: getExampleSeverity(),
                                    actions: getExampleActions()
                                }
                            }
                    };
                    return messageModel;
                }

                if (dialogService.showMessageList(model)) {
                    //Do processing here
                    for (var i = 0; i < 10; i++) {
                        model.messages.push(createMessage(i));
                    }
                } else {
                    $log.error("Could not display modal dialog");
                }
            };
        }
        return DialogLaunchController;
    }
);

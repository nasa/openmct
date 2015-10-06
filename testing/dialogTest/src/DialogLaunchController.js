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
                    title: "Progress dialog example",
                    progress: 0,
                    hint: "Calculating...",
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
                    model.hint = "Processing 100 objects...";
                    if (knownProgress) {
                        $timeout(incrementProgress, 1000);
                    }
                } else {
                    $log.error("Could not display modal dialog");
                }
            };

            $scope.launchError = function () {
                var model = {
                    title: "Error Message Title",
                    hint: "Something happened. It was not so good.",
                    severity: messageSeverity.ERROR,
                    actions: [
                        {
                            label: "OK",
                            action: function () {
                                $log.debug("OK Pressed");
                                dialogService.dismiss();
                            }
                        }
                    ]
                };

                if (!dialogService.showBlockingMessage(model)) {
                    $log.error("Could not display modal dialog");
                }
            };
        }
        return DialogLaunchController;
    }
);

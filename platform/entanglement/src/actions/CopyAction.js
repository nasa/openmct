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

/*global define */
define(
    ['./AbstractComposeAction'],
    function (AbstractComposeAction) {
        "use strict";

        /**
         * The CopyAction is available from context menus and allows a user to
         * deep copy an object to another location of their choosing.
         *
         * @implements {Action}
         * @constructor
         * @memberof platform/entanglement
         */
        function CopyAction(locationService, copyService, dialogService, notificationService, context) {
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            AbstractComposeAction.call(this, locationService, copyService, context, "Duplicate", "to a location");
        }

        CopyAction.prototype = Object.create(AbstractComposeAction.prototype);

        CopyAction.prototype.perform = function() {
            var self = this,
                notification,
                notificationModel = {
                    title: "Copying objects",
                    unknownProgress: false,
                    severity: "info",
                };

            function progress(phase, totalObjects, processed){
                if (phase.toLowerCase() === 'preparing'){
                    self.dialogService.showBlockingMessage({
                        title: "Preparing to copy objects",
                        unknownProgress: true,
                        severity: "info",
                    });
                } else if (phase.toLowerCase() === "copying") {
                    self.dialogService.dismiss();
                    if (!notification) {
                        notification = self.notificationService.notify(notificationModel);
                    }
                    notificationModel.progress = (processed / totalObjects) * 100;
                    notificationModel.title = ["Copied ", processed, "of ", totalObjects, "objects"].join(" ");
                    if (processed === totalObjects){
                        notification.dismiss();
                        self.notificationService.info(["Successfully copied ", totalObjects, " items."].join(""));
                    }
                }
            }

            AbstractComposeAction.prototype.perform.call(this, progress)
                .then(function(){
                    self.notificationService.info("Copying complete.");
                    },
                    function (error){
                        //log error
                        //Show more general error message
                        self.notificationService.notify({
                            title: "Error copying objects.",
                            severity: "error",
                            hint: error.message
                        });
                    });
                };
        return CopyAction;
    }
);


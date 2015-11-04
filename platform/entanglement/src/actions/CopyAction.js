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

        /*
         function CopyAction(locationService, copyService, context) {
            return new AbstractComposeAction (
                locationService,
                copyService,
                context,
                "Duplicate",
                "to a location"
            );
         }

         return CopyAction;
         */
        
        /**
         * The CopyAction is available from context menus and allows a user to
         * deep copy an object to another location of their choosing.
         *
         * @implements {Action}
         * @constructor
         * @memberof platform/entanglement
         */
        function CopyAction($log, locationService, copyService, dialogService, 
                            notificationService, context) {
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            this.$log = $log;
            //Extend the behaviour of the Abstract Compose Action
            AbstractComposeAction.call(this, locationService, copyService, 
                context, "Duplicate", "to a location");
        }

        /**
         * Executes the CopyAction. The CopyAction uses the default behaviour of 
         * the AbstractComposeAction, but extends it to support notification 
         * updates of progress on copy.
         */
        CopyAction.prototype.perform = function() {
            var self = this,
                notification,
                dialog,
                notificationModel = {
                    title: "Copying objects",
                    unknownProgress: false,
                    severity: "info",
                };
            
            /*
            Show banner notification of copy progress.
             */
            function progress(phase, totalObjects, processed){
                /*
                Copy has two distinct phases. In the first phase a copy plan is 
                made in memory. During this phase of execution, the user is 
                shown a blocking 'modal' dialog.
                 
                In the second phase, the copying is taking place, and the user 
                is shown non-invasive banner notifications at the bottom of the screen.
                 */
                if (phase.toLowerCase() === 'preparing' && !dialog){
                    dialog = self.dialogService.showBlockingMessage({
                        title: "Preparing to copy objects",
                        unknownProgress: true,
                        severity: "info",
                    });
                } else if (phase.toLowerCase() === "copying") {
                    self.dialogService.dismiss();
                    if (!notification) {
                        notification = self.notificationService
                            .notify(notificationModel);
                    }
                    notificationModel.progress = (processed / totalObjects) * 100;
                    notificationModel.title = ["Copied ", processed, "of ", 
                        totalObjects, "objects"].join(" ");
                }
            }

            AbstractComposeAction.prototype.perform.call(this)
                .then(
                    function(){
                        notification.dismiss();
                        self.notificationService.info("Copying complete.");
                    },
                    function(error){
                        self.$log.error("Error copying objects. ", error);
                        //Show more general error message
                        self.notificationService.notify({
                            title: "Error copying objects.",
                            severity: "error",
                            hint: error.message
                        });
                        
                    },
                    function(notification){
                        progress(notification.phase, notification.totalObjects, notification.processed);
                    })
                };
        return CopyAction;
    }
);


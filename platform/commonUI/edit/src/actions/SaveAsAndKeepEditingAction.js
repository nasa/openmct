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
    ["./SaveAsAction"],
    function (SaveAsAction) {

        /**
         * The "Save As and Keep Editing" action performs a [Save As And Keep Editing action]{@link SaveAsAndKeepEditingAction}
         * on the object under edit and keeps user in edit mode.
         * @constructor
         * @implements {Action}
         * @memberof platform/commonUI/edit
         */
        function SaveAsAndKeepEditingAction(
            $injector,
            policyService,
            dialogService,
            copyService,
            notificationService,
            context
        ) {
            this.$injector = $injector;
            this.policyService = policyService;
            this.dialogService = dialogService;
            this.copyService = copyService;
            this.notificationService = notificationService;
            this.context = context;
            this.domainObject = (context || {}).domainObject;
        }

        /**
         * Trigger a save operation and go back to edit mode.
         *
         * @memberof platform/commonUI/edit.SaveAsAndKeepEditingAction#
         */
        SaveAsAndKeepEditingAction.prototype.perform = function () {
            var saveAsAction = new SaveAsAction(
                    this.$injector,
                    this.policyService,
                    this.dialogService,
                    this.copyService,
                    this.notificationService,
                    this.context
                );

            function openEditor(object) {
                if (object) {
                    object.getCapability('action').perform('edit');
                }
            }

            return saveAsAction.save().then(openEditor);
        };

        /**
         * Check if this action is applicable in a given context.
         * This will ensure that a domain object is present in the context,
         * and that this domain object is in Edit mode.
         * @returns true if applicable
         */
        SaveAsAndKeepEditingAction.appliesTo = SaveAsAction.appliesTo;

        return SaveAsAndKeepEditingAction;
    }
);

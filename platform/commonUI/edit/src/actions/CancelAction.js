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
    function () {
        'use strict';

        /**
         * The "Cancel" action; the action triggered by clicking Cancel from
         * Edit Mode. Exits the editing user interface and invokes object
         * capabilities to persist the changes that have been made.
         * @constructor
         * @memberof platform/commonUI/edit
         * @implements {Action}
         */
        function CancelAction($injector, navigationService, context) {
            this.domainObject = context.domainObject;
            this.navigationService = navigationService;
            this.objectService = $injector.get('objectService');
        }

        /**
         * Cancel editing.
         *
         * @returns {Promise} a promise that will be fulfilled when
         *          cancellation has completed
         */
        CancelAction.prototype.perform = function () {
            var domainObject = this.domainObject,
                self = this;

            // Look up the object's "editor.completion" capability;
            // this is introduced by EditableDomainObject which is
            // used to insulate underlying objects from changes made
            // during editing.
            function getEditorCapability() {
                return domainObject.getCapability("editor");
            }

            // Invoke any save behavior introduced by the editor.completion
            // capability.
            function doCancel(editor) {
                return editor.cancel();
            }

            //Discard current 'editable' object, and retrieve original
            // un-edited object.
            function returnToBrowse() {
                return self.navigationService.setNavigation(self.domainObject.getOriginalObject());
            }

            return doCancel(getEditorCapability())
                .then(returnToBrowse);
        };

        /**
         * Check if this action is applicable in a given context.
         * This will ensure that a domain object is present in the context,
         * and that this domain object is in Edit mode.
         * @returns {boolean} true if applicable
         */
        CancelAction.appliesTo = function (context) {
            var domainObject = (context || {}).domainObject;
            return domainObject !== undefined &&
                domainObject.hasCapability("editor");
        };

        return CancelAction;
    }
);

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
    [
        '../../../browse/src/creation/CreateWizard'
    ],
    function (CreateWizard) {
        'use strict';

        /**
         * The "Save" action; the action triggered by clicking Save from
         * Edit Mode. Exits the editing user interface and invokes object
         * capabilities to persist the changes that have been made.
         * @constructor
         * @implements {Action}
         * @memberof platform/commonUI/edit
         */
        function SaveAction($q, $injector,  navigationService, policyService, dialogService, context) {
            this.domainObject = (context || {}).domainObject;
            this.injectObjectService = function(){
                this.objectService = $injector.get("objectService");
            };
            this.navigationService = navigationService;
            this.policyService = policyService;
            this.dialogService = dialogService;
            this.$q = $q;
        }

        SaveAction.prototype.getObjectService = function(){
            // Lazily acquire object service (avoids cyclical dependency)
            if (!this.objectService) {
                this.injectObjectService();
            }
            return this.objectService;
        };

        /**
         * Save changes and conclude editing.
         *
         * @returns {Promise} a promise that will be fulfilled when
         *          cancellation has completed
         * @memberof platform/commonUI/edit.SaveAction#
         */
        SaveAction.prototype.perform = function () {
            var domainObject = this.domainObject,
                isNewObject = !(domainObject.getModel().persisted),
                self = this;

            function resolveWith(object){
                return function() {
                    return object;
                };
            }

            function doWizardSave(parent) {
                var context = domainObject.getCapability("context"),
                    wizard = new CreateWizard(parent, self.policyService, domainObject);


                return self.dialogService
                    .getUserInput(wizard.getFormStructure(), wizard.getInitialFormValue())
                    .then(function(formValue) {
                        return wizard.buildObjectFromInput(formValue);
                    });
            }


            function persistObject(object){
                if (object.hasCapability('editor')) {
                    return object.getCapability('editor').save(true);
                } else {
                    return object.getCapability('persistence').persist();
                }
            }

            function fetchObject(objectId){
                return self.getObjectService().getObjects([objectId]).then(function(objects){
                    return objects[objectId];
                });
            }

            function getParent(object){
                //Skip lookup if parent is the navigated object
                if (object.getModel().location === self.navigationService.getNavigation().getId()){
                    return self.$q.when(self.navigationService.getNavigation());
                } else {
                    return fetchObject(object.getModel().location);
                }
            }

            function locateObjectInParent(parent){
                parent.getCapability('composition').add(domainObject.getId());
                if (!parent.getCapability('status').get('editing')){
                    persistObject(parent);
                }
                return parent;
            }

            function doNothing() {
                // Create cancelled, do nothing
                return false;
            }

            // Invoke any save behavior introduced by the editor capability;
            // this is introduced by EditableDomainObject which is
            // used to insulate underlying objects from changes made
            // during editing.
            function doSave() {
                if (isNewObject){
                    return getParent(domainObject)
                            .then(doWizardSave)
                            .then(persistObject)
                            .then(getParent)//Parent may have changed based
                                            // on user selection
                            .then(locateObjectInParent)
                            .catch(doNothing)
                } else {
                    return domainObject.getCapability("editor").save()
                        .then(resolveWith(domainObject.getOriginalObject()));
                }
            }

            // Discard the current root view (which will be the editing
            // UI, which will have been pushed atop the Browse UI.)
            function returnToBrowse(object) {
                //Navigate to non-editable version of object. But first
                // check if parent is being edited (ie. this was a
                // sub-object creation)
                if (object && !object.getCapability('status').get('editing')) {
                    self.navigationService.setNavigation(object.hasCapability('editor') ? object.getOriginalObject() : object);
                }
                return object;
            }

            //return doSave().then(returnToBrowse);
            return doSave().then(returnToBrowse);
        };

        /**
         * Check if this action is applicable in a given context.
         * This will ensure that a domain object is present in the context,
         * and that this domain object is in Edit mode.
         * @returns true if applicable
         */
        SaveAction.appliesTo = function (context) {
            var domainObject = (context || {}).domainObject;
            return domainObject !== undefined &&
                domainObject.hasCapability("editor");
        };

        return SaveAction;
    }
);

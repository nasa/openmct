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
/*jslint es5: true */


define(
    ['../../../browse/src/creation/CreateWizard'],
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
        function SaveAction($q, $location, $injector, urlService, navigationService, policyService, dialogService, creationService, context) {
            this.domainObject = (context || {}).domainObject;
            this.$location = $location;
            this.injectObjectService = function(){
                this.objectService = $injector.get("objectService");
            };
            this.urlService = urlService;
            this.navigationService = navigationService;
            this.policyService = policyService;
            this.dialogService = dialogService;
            this.creationService = creationService;
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
                $location = this.$location,
                urlService = this.urlService,
                self = this;

            function resolveWith(object){
                return function() {
                    return object;
                };
            }

            function doWizardSave(parent) {
                var context = domainObject.getCapability("context"),
                    wizard = new CreateWizard(domainObject.useCapability('type'), parent, self.policyService, domainObject.getModel());

                function mergeObjects(fromObject, toObject){
                    Object.keys(fromObject).forEach(function(key) {
                        toObject[key] = fromObject[key];
                    });
                }

                // Create and persist the new object, based on user
                // input.
                function buildObjectFromInput(formValue) {
                    var parent = wizard.getLocation(formValue),
                        formModel = wizard.createModel(formValue);

                        formModel.location = parent.getId();
                        //Replace domain object model with model collected
                        // from user form.
                        domainObject.useCapability("mutation", function(){
                            //Replace object model with the model from the form
                            return formModel;
                        });
                        return domainObject;
                }

                function getAllComposees(domainObject){
                    return domainObject.useCapability('composition');
                }

                function addComposeesToObject(object){
                    return function(composees){
                        return self.$q.all(composees.map(function (composee) {
                            return object.getCapability('composition').add(composee);
                        })).then(resolveWith(object));
                    };
                }

                /**
                 * Add the composees of the 'virtual' object to the
                 * persisted object
                 * @param object
                 * @returns {*}
                 */
                function composeNewObject(object){
                    if (self.$q.when(object.hasCapability('composition') && domainObject.hasCapability('composition'))) {
                        return getAllComposees(domainObject)
                            .then(addComposeesToObject(object));
                    }
                }

                return self.dialogService
                    .getUserInput(wizard.getFormStructure(), wizard.getInitialFormValue())
                    .then(buildObjectFromInput);
            }


            function persistObject(object){
                return  ((object.hasCapability('editor') && object.getCapability('editor').save(true)) ||
                        object.getCapability('persistence').persist())
                        .then(resolveWith(object));
            }

            function fetchObject(objectId){
                return self.getObjectService().getObjects([objectId]).then(function(objects){
                    return objects[objectId];
                });
            }

            function getParent(object){
                return fetchObject(object.getModel().location);
            }

            function locateObjectInParent(parent){
                parent.getCapability('composition').add(domainObject.getId());
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
                //This is a new 'virtual object' that has not been persisted
                // yet.
                if (!domainObject.getModel().persisted){
                    return getParent(domainObject)
                            .then(doWizardSave)
                            .then(persistObject)
                            .then(getParent)//Parent may have changed based
                                            // on user selection
                            .then(locateObjectInParent)
                            .then(persistObject)
                            .then(function(){
                                return fetchObject(domainObject.getId());
                            })
                        .catch(doNothing);
                } else {
                    return domainObject.getCapability("editor").save()
                        .then(resolveWith(domainObject.getOriginalObject()));
                }
            }

            // Discard the current root view (which will be the editing
            // UI, which will have been pushed atop the Browse UI.)
            function returnToBrowse(object) {
                if (object) {
                    self.navigationService.setNavigation(object);
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

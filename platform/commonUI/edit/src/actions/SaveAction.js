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
    ['../../../browse/src/creation/createWizard'],
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
            }
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
        }

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

            function doWizardSave(domainObject, parent) {
                var context = domainObject.getCapability("context");
                var wizard = new CreateWizard(domainObject.useCapability('type'), parent, self.policyService);

                // Create and persist the new object, based on user
                // input.
                function persistResult(formValue) {
                    var parent = wizard.getLocation(formValue),
                        newModel = wizard.createModel(formValue);
                    return self.creationService.createObject(newModel, parent);
                }

                function doNothing() {
                    // Create cancelled, do nothing
                    return false;
                }

                /**
                 * Add the composees of the 'virtual' object to the
                 * persisted object
                 * @param object
                 * @returns {*}
                 */
                function composeObject(object){
                    return object && self.$q.when(object.hasCapability('composition') && domainObject.hasCapability('composition'))
                    .then(function(){
                        return domainObject.useCapability('composition')
                        .then(function(composees){
                            return self.$q.all(composees.map(function(composee){
                                object.getCapability('composition').add(composee);
                                return object;
                            })).then(function(){return object});
                        });
                    });
                }

                return self.dialogService.getUserInput(
                    wizard.getFormStructure(),
                    wizard.getInitialFormValue()
                ).then(persistResult, doNothing).then(composeObject);
            }

            // Invoke any save behavior introduced by the editor capability;
            // this is introduced by EditableDomainObject which is
            // used to insulate underlying objects from changes made
            // during editing.
            function doSave() {
                //WARNING: HACK
                //This is a new 'virtual panel' that has not been persisted
                // yet.
                if (domainObject.getModel().type === 'telemetry.panel' && !domainObject.getModel().persisted){
                    return self.getObjectService()
                        .getObjects([domainObject.getModel().location])
                        .then(function(objs){ return doWizardSave(domainObject, objs[domainObject.getModel().location])});
                } else {
                    return domainObject.getCapability("editor").save().then(function(){return domainObject.getOriginalObject()});
                }
            }

            // Discard the current root view (which will be the editing
            // UI, which will have been pushed atop the Browse UI.)
            function returnToBrowse(object) {
                self.navigationService.setNavigation(object)
            }

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

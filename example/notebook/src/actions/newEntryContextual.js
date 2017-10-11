/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    [],
    function () {

        var NEW_TASK_FORM = {
            name: "Create a Notebook Entry",
            hint: "Please select one Notebook",
            sections: [{
                rows: [{
                    name: 'Entry',
                    key: 'entry',
                    control: 'textarea',
                    "cssClass": "l-textarea-sm"
                },
                {
                    name: 'Embed Type',
                    key: 'withSnapshot',
                    control: 'select',
                    "options": [{
                            "name": "Link and Snapshot", 
                            "value": true
                        },
                        {
                            "name": "Link only", 
                            "value": false
                        }                        
                    ],
                    required:true
                },
                {
                    name: 'Save in Notebook',
                    key: 'saveNotebook',
                    control: 'locator',
                    validate: validateLocation
                },
                {
                    name: 'Embed',
                    key: 'embedSnapshot',
                    control: 'embed-control'
                }]
            }]
        };

        function newEntryContextual(dialogService,notificationService,linkService,context) {
            context = context || {};
            this.domainObject = context.selectedObject || context.domainObject;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            this.linkService = linkService;
        }      

        function validateLocation(newParentObj) {
            return newParentObj.model.type == 'notebook';
        }


        newEntryContextual.prototype.perform = function () {
            this.dialogService.getUserInput(NEW_TASK_FORM, {}).then(addNewEntry);
            var domainObj = this.domainObject;  
            var notification = this.notificationService; 
            var linkService = this.linkService;            

            function addNewEntry(options){
                   options.selectedModel = domainObj.getModel();
                   options.cssClass= domainObj.getCapability('type').typeDef.cssClass;
                   options.snapshot= false;
                   if(!options.withSnapshot){
                     options.snapshot = '';
                   } 

                   if (options.saveNotebook.getModel().composition.indexOf(domainObj.getId()) !== -1) {
                        createSnap(options)
                   }else{
                        linkService.perform(domainObj, options.saveNotebook).then(createSnap(options));
                   } 
            }

            function createSnap(options){
                options.saveNotebook.useCapability('mutation', function(model) {
                    model.entries.push({'createdOn':Date.now(),
                        'text': options.entry,
                        'embeds':[{'type':domainObj.getId(),
                                   'id':''+Date.now(),
                                   'cssClass':options.cssClass,
                                   'name':options.selectedModel.name,
                                   'snapshot':options.snapshot
                                 }]   
                    }); 
                });

                notification.info({
                    title: "Notebook Entry created"
                }); 
            }
        };

        newEntryContextual.appliesTo = function (context) {
            var domainObject = context.domainObject;
            return domainObject && domainObject.hasCapability("notebook") &&
                domainObject.getCapability("notebook").isNotebook();
        };

        return newEntryContextual;
    }
);

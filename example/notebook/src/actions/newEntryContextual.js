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

        var SNAPSHOT_TEMPLATE = '<mct-representation key="\'draggedEntry\'"'+
                                    'class="t-rep-frame holder"'+
                                    'mct-object="selObj">'+
                                '</mct-representation>';

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
                    control: 'snapshot-select',
                    "options": [
                        {
                            "name": "Link and Snapshot", 
                            "value": true
                        },
                        {
                            "name": "Link only", 
                            "value": false
                        }                        
                    ]
                },
                {
                    name: 'Embed',
                    key: 'embedObject',
                    control: 'embed-control'
                },
                {
                    name: 'Save in Notebook',
                    key: 'saveNotebook',
                    control: 'locator',
                    validate: validateLocation
                }]
            }]
        };

        function newEntryContextual($compile,$rootScope,dialogService,notificationService,linkService,context) {
            context = context || {};
            this.domainObject = context.selectedObject || context.domainObject;
            this.dialogService = dialogService;
            this.notificationService = notificationService;
            this.linkService = linkService;
            this.$rootScope = $rootScope;
            this.$compile = $compile;
        }      

        function validateLocation(newParentObj) {
            return newParentObj.model.type == 'notebook';
        }


        newEntryContextual.prototype.perform = function () {

            var self = this;
            var domainObj = this.domainObject;  
            var notification = this.notificationService; 
            var linkService = this.linkService; 
            var dialogService = this.dialogService;

             // Create the overlay element and add it to the document's body
            this.$rootScope.selObj = domainObj;
            this.$rootScope.selValue = "";
            var element = this.$compile(SNAPSHOT_TEMPLATE)(this.$rootScope);

            this.$rootScope.$watch("snapshot", setSnapshot);

            function setSnapshot(value){
                if(value){
                    dialogService.getUserInput(NEW_TASK_FORM,{}).then(addNewEntry);
                }                
            }

            function addNewEntry(options){
               options.selectedModel = options.embedObject.getModel();
               options.cssClass= options.embedObject.getCapability('type').typeDef.cssClass;
               if(self.$rootScope.snapshot){
                    options.snapshot= self.$rootScope.snapshot;
                    self.$rootScope.snapshot = undefined;
               }else{
                    options.snapshot = undefined;
               }
               
               if(!options.withSnapshot){
                 options.snapshot = '';
               } 

               if (options.saveNotebook.getModel().composition.indexOf(options.embedObject.getId()) !== -1) {
                    createSnap(options)
               }else{
                    linkService.perform(options.embedObject, options.saveNotebook).then(createSnap(options));
               } 
            }

            function createSnap(options){
                options.saveNotebook.useCapability('mutation', function(model) {
                    var entries = model.entries;
                    var lastEntry= entries[entries.length-1];
                    if(lastEntry==undefined || lastEntry.text || lastEntry.embeds){
                        model.entries.push({
                            'createdOn':Date.now(),
                            'text': options.entry,
                            'embeds':[{'type':options.embedObject.getId(),
                                       'id':''+Date.now(),
                                       'cssClass':options.cssClass,
                                       'name':options.selectedModel.name,
                                       'snapshot':options.snapshot
                                     }]   
                        }); 
                    }else{
                        model.entries[entries.length-1] = {
                            'createdOn':Date.now(),
                            'text': options.entry,
                            'embeds':[{'type':options.embedObject.getId(),
                                       'id':''+Date.now(),
                                       'cssClass':options.cssClass,
                                       'name':options.selectedModel.name,
                                       'snapshot':options.snapshot
                                     }]   
                        };
                    }                                 
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

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

/**
 * Module defining viewSnapshot (Originally NewWindowAction). Created by vwoeltje on 11/18/14.
 */
define(
    ['../../lib/painterro'],
    function () {

        var ANNOTATION_STRUCT = {
            title: "Annotate Snapshot",
            template: "annotate-snapshot",
            options: [{
                name: "OK",
                key: "ok",
                description:"save annotation"
            },
            {
                name: "Cancel",
                key: "cancel",
                description:"cancel editing"
            }]            
        };

        function annotateSnapshot(dialogService,dndService,$rootScope,context) {
            context = context || {};

            // Choose the object to be opened into a new tab
            this.domainObject = context.selectedObject || context.domainObject;
            this.dialogService = dialogService;
            this.dndService = dndService;
            this.$rootScope = $rootScope;
        }

        


        annotateSnapshot.prototype.perform = function ($event,snapshot,embedId,entryId,$scope) {
            
            var domainObject = this.domainObject;
           
            this.dialogService.getUserChoice(ANNOTATION_STRUCT)
                        .then(saveNotes);

            var rootscope = this.$rootScope;

            var painterro;

            var tracker = function(){
                $(document.body).find('.l-dialog .outer-holder').addClass('annotation-dialog');
                painterro = Painterro({
                id: 'snap-annotation',
                backgroundFillColor: '#eee',
                hiddenTools:['save', 'open', 'close','eraser'],
                saveHandler: function (image, done) {
                        if(entryId && embedId){
                            var elementPos = domainObject.model.entries.map(function(x) {return x.createdOn; }).indexOf(entryId)
                            var entryEmbeds = domainObject.model.entries[elementPos].embeds;
                            var embedPos = entryEmbeds.map(function(x) {return x.id; }).indexOf(embedId);
                            $scope.saveSnap(image.asBlob(),embedPos,elementPos);
                        }else{  
                            rootscope.snapshot = {'src':image.asDataURL('image/png'),
                                                  'modified':Date.now()};                             
                        }
                        
                   done(true); 
               }
                }).show(snapshot);

            }

            ANNOTATION_STRUCT.model = {'tracker':tracker};



            function saveNotes(param){
                if(param=='ok'){
                    painterro.save();
                }else{
                    rootscope.snapshot = "annotationCancelled";
                }
            }

        };

        return annotateSnapshot;
    }
);

/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define([
], function (
) {

    var SNAPSHOT_TEMPLATE = '<mct-representation key="\'draggedEntry\'"'+
                                    'parameters="{entry:entryId,embed:embedId}"'+
                                    'class="t-rep-frame holder"'+
                                    'mct-object="selObj">'+
                                '</mct-representation>';

    function entryDnd($rootScope,$compile,dndService,typeService) {

        function link($scope, $element) {
            var domainObj = $scope.domainObject;

            function drop(e) {
                var event = (e || {}).originalEvent || e,
                    selectedObject = dndService.getData('mct-domain-object');

                var selectedModel = selectedObject.getModel();
                var cssClass= selectedObject.getCapability('type').typeDef.cssClass;
                var entryId = -1;
                var embedId = -1;
               
                $scope.clearSearch();
                if($element[0].id == 'newEntry'){
                    entryId = domainObj.model.entries.length;
                    embedId = 0;
                    var lastEntry= domainObj.model.entries[entryId-1];
                    if(lastEntry==undefined || lastEntry.text || lastEntry.embeds){
                        domainObj.model.entries.push({'createdOn':+Date.now(),
                                            'embeds':[{'type':selectedObject.getId(),
                                                       'id':''+Date.now(),
                                                       'cssClass':cssClass,
                                                       'name':selectedModel.name,
                                                       'snapshot':''
                                                     }]
                                            });
                    }else{
                        domainObj.model.entries[entryId-1] = 
                                                    {'createdOn':+Date.now(),
                                                     'embeds':[{'type':selectedObject.getId(),
                                                                'id':''+Date.now(),
                                                                'cssClass':cssClass,
                                                                'name':selectedModel.name,
                                                                'snapshot':''
                                                               }]
                                                    };
                    } 

                    $scope.scrollToTop();

                }else{  
                    
                    entryId = domainObj.model.entries.map(function(x) {
                        return x.createdOn;
                    }).indexOf(+($element[0].id.replace('entry_','')));
                    if(!domainObj.model.entries[entryId].embeds){
                        domainObj.model.entries[entryId].embeds = [];
                    }
                    

                    domainObj.model.entries[entryId].embeds.push({'type':selectedObject.getId(),
                                                                      'id':''+Date.now(),
                                                                      'cssClass':cssClass,
                                                                      'name':selectedModel.name,
                                                                      'snapshot':''
                                                                    });

                    embedId = domainObj.model.entries[entryId].embeds.length-1;
                  
                    if (selectedObject) {
                        e.preventDefault();

                    }
                }

                if(entryId >= 0 && embedId >= 0){
                    $scope.selObj = selectedObject;
                    $scope.entryId = entryId;
                    $scope.embedId = embedId;
                    var element = $compile(SNAPSHOT_TEMPLATE)($scope);
                }

                if($(e.currentTarget).hasClass('drag-active')){
                    $(e.currentTarget).removeClass('drag-active');
                } 
            }

            function dragover(e) {
                if(!$(e.currentTarget).hasClass('drag-active')){
                    $(e.currentTarget).addClass('drag-active');
                }              
            }
            
            // Listen for the drop itself
            $element.on('dragover', dragover);
            $element.on('drop', drop);
            

            $scope.$on('$destroy', function () {
                
            });
        }

        return {
            restrict: 'A',
            link: link
        };
    }

    return entryDnd;

});

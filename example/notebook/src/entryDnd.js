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
    $
) {

    function entryDnd($document,dndService,typeService) {
        var document = $document[0];

        function link($scope, $element) {
            var frame = $element.parent();
            var actionCapability = $scope.domainObject.getCapability('action');
            var domainObj = $scope.domainObject;

            function drop(e) {
                var event = (e || {}).originalEvent || e,
                    selectedObject = dndService.getData('mct-domain-object');

                var selectedModel = selectedObject.getModel();
                var cssClass= selectedObject.getCapability('type').typeDef.cssClass;

                if($element[0].id == 'newEntry'){
                    
                    var lastEntry= domainObj.model.entries[domainObj.model.entries.length-1];
                    if(lastEntry==undefined || lastEntry.text || lastEntry.embeds){
                        domainObj.model.entries.push({'createdOn':+Date.now(),
                                            'embeds':[{'type':selectedObject.getId(),
                                                       'id':''+Date.now(),
                                                       'cssClass':cssClass,
                                                       'name':selectedModel.name,
                                                       'snapshot':false
                                                     }]
                                            });
                    }else{
                        domainObj.model.entries[domainObj.model.entries.length-1] = 
                                                    {'createdOn':+Date.now(),
                                                     'embeds':[{'type':selectedObject.getId(),
                                                                'id':''+Date.now(),
                                                                'cssClass':cssClass,
                                                                'name':selectedModel.name,
                                                                'snapshot':false
                                                               }]
                                                    };
                    } 

                }else{  
                    
                    var elementPos = domainObj.model.entries.map(function(x) {
                        return x.createdOn;
                    }).indexOf(+($element[0].id));
                    if(!domainObj.model.entries[elementPos].embeds){
                        domainObj.model.entries[elementPos].embeds = [];
                    }
                    

                    domainObj.model.entries[elementPos].embeds.push({'type':selectedObject.getId(),
                                                                      'id':''+Date.now(),
                                                                      'cssClass':cssClass,
                                                                      'name':selectedModel.name,
                                                                      'snapshot':false
                                                                    });
                  
                    if (selectedObject) {
                        e.preventDefault();

                    }
                }
            }

          
            // Listen for the drop itself
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

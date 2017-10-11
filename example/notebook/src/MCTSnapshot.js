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

    /**

     */
    function MCTSnapshot($document,exportImageService,dialogService,notificationService) {
        var document = $document[0];

        function link($scope, $element) {

            var element = $element[0];
            var layoutContainer = element.parentElement,
                isOpen = false,
                toggleOverlay,
                snapshot = document.createElement('div');

            function openOverlay() {
                // Remove frame classes from being applied in a non-frame context
               
                $(snapshot).addClass('abs overlay l-large-view snapshot');
                snapshot.appendChild(element);
                document.body.appendChild(snapshot);             
            }

            function closeOverlay() {
                if(snapshot){
                    snapshot.removeChild(element);
                    document.body.removeChild(snapshot);                 

                    layoutContainer.remove();           
                    snapshot = undefined; 
                }
                   
            }

            toggleOverlay = function () {
                    openOverlay();
                    isOpen = true;
                    
                    makeImg(element);
            };

            makeImg =function(element){
                  var scope = $scope;
                  var dialog = dialogService.showBlockingMessage({
                        title: "Saving...",
                        hint: "Taking Snapshot...",
                        unknownProgress: true,
                        severity: "info",
                        delay: true
                    });
                  this.$timeout(function () {
                        window.EXPORT_IMAGE_TIMEOUT = 5000;
                        exportImageService.exportPNGtoSRC(element).then(function (img) {
                            
                                if(img){
                                    if(dialog){
                                        dialog.dismiss();
                                        notificationService.info({
                                            title: "Snapshot created"
                                        });    
                                    }                                                                    
                                    saveImg(img);
                                    closeOverlay();
                                }else{
                                    console.log('no url');
                                }
                               
                        },function(error){
                            console.log('error');
                            console.log(error);
                             closeOverlay();
                        });
                    }, 500);
                   window.EXPORT_IMAGE_TIMEOUT = 500;
            }

            saveImg = function(url){
                
                var entryId = +($element[0].dataset.entry);
                var elementPos = $scope.$parent.$parent.model.entries.map(function(x) {return x.createdOn; }).indexOf(entryId)
                var entryEmbeds = $scope.$parent.$parent.model.entries[elementPos].embeds;
                var embedPos = entryEmbeds.map(function(x) {return x.id; }).indexOf($element[0].dataset.embed);
                $scope.$parent.$parent.saveSnap(url,embedPos,elementPos);                
            }

            toggleOverlay();
            $scope.$on('$destroy', function () {
                $element.off('click', toggleOverlay);
            });
        }

        return {
            restrict: 'A',
            link: link
        };
    }

    return MCTSnapshot;

});

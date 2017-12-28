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
    function MCTSnapshot($rootScope,$document,exportImageService,dialogService,notificationService) {
        var document = $document[0];

        function link($scope, $element,$attrs) {
            var element = $element[0];
            var layoutContainer = element.parentElement,
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
                    layoutContainer.remove(); 
                }   
                document.body.removeChild(snapshot); 
                snapshot = undefined;   
                $element.remove();                          
            }

            toggleOverlay = function () {
                openOverlay();
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
                                    } 
                                    if($element[0].dataset.entry && $element[0].dataset.embed){
                                        saveImg(img,+$element[0].dataset.entry,+$element[0].dataset.embed);
                                        closeOverlay(false);
                                    }else{
                                        var reader = new window.FileReader();
                                        reader.readAsDataURL(img); 
                                        reader.onloadend = function() {
                                            //closeOverlay(true);
                                            $($element[0]).attr("data-snapshot",reader.result);
                                            $rootScope.snapshot = {'src':reader.result,
                                                                     'type':img.type,
                                                                     'size':img.size,
                                                                     'modified':Date.now()
                                                                  };
                                            closeOverlay(false);
                                            scope.$destroy();
                                        };
                                        
                                    } 
                                    
                                }else{
                                    console.log('no url');
                                    dialog.dismiss();
                                }
                               
                        },function(error){
                            console.log('error',error);
                            if(dialog){
                                dialog.dismiss();
                            }
                            closeOverlay();
                        });
                    }, 500);
                   window.EXPORT_IMAGE_TIMEOUT = 500;
            }

            saveImg = function(url,entryId,embedId){         
                $scope.$parent.$parent.$parent.saveSnap(url,embedId,entryId);                
            }
            if($(document.body).find('.overlay.snapshot').length == 0){
                toggleOverlay();
            }

            $scope.$on('$destroy', function () {
                $element.off('click', toggleOverlay);
                $element.remove();
            });
        }

        return {
            restrict: 'A',
            link: link
        };
    }

    return MCTSnapshot;

});

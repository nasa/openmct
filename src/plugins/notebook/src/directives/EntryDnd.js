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

define(['zepto'], function ($) {

    function EntryDnd($rootScope,$compile,dndService,typeService,notificationService) {

        function link($scope, $element) {

            function drop(e) {
                var selectedObject = dndService.getData('mct-domain-object');
                var selectedModel = selectedObject.getModel();
                var cssClass = selectedObject.getCapability('type').typeDef.cssClass;
                var entryId = -1;
                var embedId = -1;
                $scope.clearSearch();
                if ($element[0].id === 'newEntry') {
                    entryId = $scope.domainObject.model.entries.length;
                    embedId = 0;
                    var lastEntry = $scope.domainObject.model.entries[entryId - 1];
                    if (lastEntry === undefined || lastEntry.text || lastEntry.embeds) {
                        $scope.domainObject.useCapability('mutation', function (model) {
                            model.entries.push({'createdOn': +Date.now(),
                                                'id': +Date.now(),
                                                'embeds': [{'type': selectedObject.getId(),
                                                       'id': '' + Date.now(),
                                                       'cssClass': cssClass,
                                                       'name': selectedModel.name,
                                                       'snapshot': ''
                                                     }]
                                            });
                        });
                    }else {
                        $scope.domainObject.useCapability('mutation', function (model) {
                            model.entries[entryId - 1] =
                                                    {'createdOn': +Date.now(),
                                                     'embeds': [{'type': selectedObject.getId(),
                                                                'id': '' + Date.now(),
                                                                'cssClass': cssClass,
                                                                'name': selectedModel.name,
                                                                'snapshot': ''
                                                               }]
                                                    };
                        });
                    }

                    $scope.scrollToTop();
                    notificationService.info({
                        title: "Notebook Entry created"
                    });

                }else {
                    entryId = $scope.findEntryPositionById(Number($element[0].id.replace('entry_', '')));

                    if (!$scope.domainObject.model.entries[entryId].embeds) {
                        $scope.domainObject.model.entries[entryId].embeds = [];
                    }

                    $scope.domainObject.useCapability('mutation', function (model) {
                        model.entries[entryId].embeds.push({'type': selectedObject.getId(),
                                                                          'id': '' + Date.now(),
                                                                          'cssClass': cssClass,
                                                                          'name': selectedModel.name,
                                                                          'snapshot': ''
                                                                        });
                    });

                    embedId = $scope.domainObject.model.entries[entryId].embeds.length - 1;

                    if (selectedObject) {
                        e.preventDefault();

                    }
                }

                if ($(e.currentTarget).hasClass('drag-active')) {
                    $(e.currentTarget).removeClass('drag-active');
                }

            }

            function dragover(e) {
                if (!$(e.currentTarget).hasClass('drag-active')) {
                    $(e.currentTarget).addClass('drag-active');
                }
            }

            // Listen for the drop itself
            $element.on('dragover', dragover);
            $element.on('drop', drop);


            $scope.$on('$destroy', function () {
                $element.off('dragover', dragover);
                $element.off('drop', drop);
            });
        }

        return {
            restrict: 'A',
            link: link
        };
    }

    return EntryDnd;

});

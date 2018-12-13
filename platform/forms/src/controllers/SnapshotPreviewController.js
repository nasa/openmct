/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    [
        'painterro'
    ],
    function (Painterro) {

        function SnapshotPreviewController($scope, openmct) {

            $scope.previewImage = function (imageUrl) {
                var image = document.createElement('img');
                image.src = imageUrl;

                openmct.overlays.overlay(
                    {
                        element: image,
                        size: 'large'
                    }
                );
            };

            $scope.annotateImage = function (ngModel, field, imageUrl) {
                $scope.imageUrl = imageUrl;

                var div = document.createElement('div'),
                    painterroInstance = {},
                    save = false;

                div.id = 'snap-annotation';

                openmct.overlays.overlay(
                    {
                        element: div,
                        size: 'large',
                        buttons: [
                            {
                                label: 'Cancel',
                                callback: function () {
                                    save = false;
                                    painterroInstance.save();
                                }
                            },
                            {
                                label: 'Save',
                                callback: function () {
                                    save = true;
                                    painterroInstance.save();
                                }
                            }
                        ]
                    }
                );

                painterroInstance = Painterro({
                    id: 'snap-annotation',
                    activeColor: '#ff0000',
                    activeColorAlpha: 1.0,
                    activeFillColor: '#fff',
                    activeFillColorAlpha: 0.0,
                    backgroundFillColor: '#000',
                    backgroundFillColorAlpha: 0.0,
                    defaultFontSize: 16,
                    defaultLineWidth: 2,
                    defaultTool: 'ellipse',
                    hiddenTools: ['save', 'open', 'close', 'eraser', 'pixelize', 'rotate', 'settings', 'resize'],
                    translation: {
                        name: 'en',
                        strings: {
                            lineColor: 'Line',
                            fillColor: 'Fill',
                            lineWidth: 'Size',
                            textColor: 'Color',
                            fontSize: 'Size',
                            fontStyle: 'Style'
                        }
                    },
                    saveHandler: function (image, done) {
                        if (save) {
                            var url = image.asBlob(),
                                reader = new window.FileReader();

                            reader.readAsDataURL(url);
                            reader.onloadend = function () {
                                $scope.imageUrl = reader.result;
                                ngModel[field] = reader.result;
                            };
                        } else {
                            ngModel.field = imageUrl;
                            console.warn('You cancelled the annotation!!!');
                        }
                        done(true);
                    }
                }).show(imageUrl);
            };
        }

        return SnapshotPreviewController;
    }
);

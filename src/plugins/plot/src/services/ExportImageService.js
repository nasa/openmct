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
/* global console*/
/**
 * Module defining ExportImageService. Created by hudsonfoo on 09/02/16
 */
define(
    [
        "html2canvas",
        "saveAs"
    ],
    function (
        html2canvas,
        saveAs
    ) {

        /**
         * The export image service will export any HTML node to
         * JPG, or PNG.
         * @param {object} dialogService
         * @constructor
         */
        function ExportImageService(dialogService) {
            this.exportCount = 0;
            this.dialogService = dialogService;
        }

        /**
         * Converts an HTML element into a PNG or JPG Blob.
         * @private
         * @param {node} element that will be converted to an image
         * @param {string} type of image to convert the element to.
         * @returns {promise}
         */
        ExportImageService.prototype.renderElement = function (element, imageType, color) {
            var dialogService = this.dialogService,
                dialog = dialogService.showBlockingMessage({
                    title: "Capturing...",
                    hint: "Capturing an image",
                    unknownProgress: true,
                    severity: "info",
                    delay: true
                });

            var mimeType = "image/png";
            if (imageType === "jpg") {
                mimeType = "image/jpeg";
            }

            var exportId = 'export-element-' + this.exportCount;
            this.exportCount++;
            var oldId = element.id;
            element.id = exportId;

            return html2canvas(element, {
                onclone: function (document) {
                    // Make export style changes to cloned document so that
                    // users don't see view flickering.
                    var clonedElement = document.getElementById(exportId);
                    if (clonedElement && color) {
                        clonedElement.style.backgroundColor = color;
                    }
                    element.id = oldId;
                }
            }).then(function (canvas) {
                dialog.dismiss();
                return new Promise(function (resolve, reject) {
                    return canvas.toBlob(resolve, mimeType);
                });
            }, function (error) {
                console.log('error capturing image', error);
                dialog.dismiss();
                var errorDialog = dialogService.showBlockingMessage({
                        title: "Error capturing image",
                        severity: "error",
                        hint: "Image was not captured successfully!",
                        options: [{
                            label: "OK",
                            callback: function () {
                                errorDialog.dismiss();
                            }
                        }]
                    });
            });
        };

        /**
         * Takes a screenshot of a DOM node and exports to JPG.
         * @param {node} element to be exported
         * @param {string} filename the exported image
         * @returns {promise}
         */
        ExportImageService.prototype.exportJPG = function (element, filename, color) {
            return this.renderElement(element, "jpg", color).then(function (img) {
                saveAs(img, filename);
            });
        };

        /**
         * Takes a screenshot of a DOM node and exports to PNG.
         * @param {node} element to be exported
         * @param {string} filename the exported image
         * @returns {promise}
         */
        ExportImageService.prototype.exportPNG = function (element, filename, color) {
            return this.renderElement(element, "png", color).then(function (img) {
                saveAs(img, filename);
            });
        };

        /**
         * Takes a screenshot of a DOM node in PNG format.
         * @param {node} element to be exported
         * @param {string} filename the exported image
         * @returns {promise}
         */

        ExportImageService.prototype.exportPNGtoSRC = function (element) {
            return this.renderElement(element, "png");
        };

        /**
         * canvas.toBlob() not supported in IE < 10, Opera, and Safari. This polyfill
         * implements the method in browsers that would not otherwise support it.
         * https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
         */
        function polyfillToBlob() {
            if (!HTMLCanvasElement.prototype.toBlob) {
                Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
                    value: function (callback, mimeType, quality) {

                        var binStr = atob(this.toDataURL(mimeType, quality).split(',')[1]),
                            len = binStr.length,
                            arr = new Uint8Array(len);

                        for (var i = 0; i < len; i++) {
                            arr[i] = binStr.charCodeAt(i);
                        }

                        callback(new Blob([arr], {type: mimeType || "image/png"}));
                    }
                });
            }
        }

        polyfillToBlob();

        return ExportImageService;
    }
);

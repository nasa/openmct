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

/**
 * Module defining ExportImageService. Created by hudsonfoo on 09/02/16
 */
define(
    [
        "dom-to-image",
        "saveAs"
    ],
    function (
        domToImage,
        saveAs
    ) {
        var validTypes = ["png", "jpg", "jpeg"];

        /**
         * The export image service will export any HTML node to
         * JPG, or PNG.
         * @param {object} $q
         * @param {object} $timeout
         * @param {object} $log
         * @constructor
         */
        function ExportImageService($q, $timeout, $log, dialogService) {
            this.$q = $q;
            this.$timeout = $timeout;
            this.$log = $log;
            this.dialogService = dialogService;
        }

        function changeBackgroundColor(element, color) {
            element.style.backgroundColor = color;
        }

        /**
         * Renders an HTML element into a base64 encoded image
         * as a BLOB, PNG, or JPG.
         * @param {node} element that will be converted to an image
         * @param {string} type of image to convert the element to
         * @returns {promise}
         */
        ExportImageService.prototype.renderElement = function (element, type, color) {

            if (validTypes.indexOf(type) === -1) {
                this.$log.error("Invalid type requested. Try: (" + validTypes.join(",") + ")");
                return;
            }

            var defer = this.$q.defer(),
                originalColor,
                log = this.$log,
                dialogService = this.dialogService,
                dialog = dialogService.showBlockingMessage({
                    title: "Capturing...",
                    hint: "Capturing an image",
                    unknownProgress: true,
                    severity: "info",
                    delay: true
                });

            if (color) {
                // Save color to be restored later
                originalColor = element.style.backgroundColor || '';
                // Defaulting to white so we can see the chart when printed
                changeBackgroundColor(element, color);
            }

            function captureSuccess(image) {
                if (defer) {
                    defer.resolve(image);
                }
            }

            function captureFail(error) {
                if (dialog) {
                    dialog.dismiss();
                }

                if (defer) {
                    defer.reject(error);
                }

                var errorDialog,
                    errorMessage = {
                        title: "Error capturing image",
                        severity: "error",
                        hint: "Image was not captured successfully!",
                        options: [{
                            label: "OK",
                            callback: function () {
                                errorDialog.dismiss();
                            }
                        }]
                    };

                errorDialog = dialogService.showBlockingMessage(errorMessage);

                log.warn("dom-to-image failed with error: " + error);
            }

            domToImage.toBlob(element).then(captureSuccess, captureFail);

            defer.promise.finally(function () {
                if (color) {
                    changeBackgroundColor(element, originalColor);
                }

                if (dialog) {
                    dialog.dismiss();
                    dialog = undefined;
                }
            });

            return defer.promise;
        };

        /**
         * Takes a screenshot of a DOM node and exports to JPG.
         * @param {node} element to be exported
         * @param {string} filename the exported image
         * @returns {promise}
         */
        ExportImageService.prototype.exportJPG = function (element, filename, color) {
            return this.renderElement(element, "jpeg", color).then(function (img) {
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
                    value: function (callback, type, quality) {

                        var binStr = atob(this.toDataURL(type, quality).split(',')[1]),
                            len = binStr.length,
                            arr = new Uint8Array(len);

                        for (var i = 0; i < len; i++) {
                            arr[i] = binStr.charCodeAt(i);
                        }

                        callback(new Blob([arr], {type: type || "image/png"}));
                    }
                });
            }
        }

        polyfillToBlob();

        return ExportImageService;
    }
);

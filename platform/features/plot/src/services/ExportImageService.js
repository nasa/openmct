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

/**
 * Module defining ExportImageService. Created by hudsonfoo on 09/02/16
 */
define(
    [
        "html2canvas",
        "jsPDF",
        "saveAs"
    ],
    function (
        html2canvas,
        jsPDF,
        saveAs
    ) {
        var self = this;

        /**
         * The export image service will export any HTML node to
         * PDF, JPG, or PNG.
         * @param {object} $q
         * @param {object} $timeout
         * @param {object} $log
         * @param {constant} EXPORT_IMAGE_TIMEOUT time in milliseconds before a timeout error is returned
         * @constructor
         */
        function ExportImageService($q, $timeout, $log, EXPORT_IMAGE_TIMEOUT, injHtml2Canvas, injJsPDF, injSaveAs, injFileReader) {
            self.$q = $q;
            self.$timeout = $timeout;
            self.$log = $log;
            self.EXPORT_IMAGE_TIMEOUT = EXPORT_IMAGE_TIMEOUT;
            self.html2canvas = injHtml2Canvas || html2canvas;
            self.jsPDF = injJsPDF || jsPDF;
            self.saveAs = injSaveAs || saveAs;
            self.reader = injFileReader || new FileReader();
        }

        /**
         * Renders an HTML element into a base64 encoded image
         * as a BLOB, PNG, or JPG.
         * @param {node} element that will be converted to an image
         * @param {string} type of image to convert the element to
         * @returns {promise}
         */
        function renderElement(element, type) {
            var defer = self.$q.defer(),
                validTypes = ["png", "jpg", "jpeg"],
                renderTimeout;

            if (validTypes.indexOf(type) === -1) {
                self.$log.error("Invalid type requested. Try: (" + validTypes.join(",") + ")");
                return;
            }

            renderTimeout = self.$timeout(function () {
                defer.reject("html2canvas timed out");
                self.$log.warn("html2canvas timed out");
            }, self.EXPORT_IMAGE_TIMEOUT);

            try {
                self.html2canvas(element, {
                    onrendered: function (canvas) {
                        switch (type.toLowerCase()) {
                            case "png":
                                canvas.toBlob(defer.resolve, "image/png");
                                break;

                            default:
                            case "jpg":
                            case "jpeg":
                                canvas.toBlob(defer.resolve, "image/jpeg");
                                break;
                        }
                    }
                });
            } catch (e) {
                defer.reject(e);
                self.$log.warn("html2canvas failed with error: " + e);
            }

            defer.promise.finally(renderTimeout.cancel);

            return defer.promise;
        }

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

        /**
         * Takes a screenshot of a DOM node and exports to PDF.
         * @param {node} element to be exported
         * @param {string} filename the exported image
         * @returns {promise}
         */
        ExportImageService.prototype.exportPDF = function (element, filename) {
            return renderElement(element, "jpeg").then(function (img) {
                self.reader.readAsDataURL(img);
                self.reader.onloadend = function () {
                    var pdf = new self.jsPDF("l", "px", [element.offsetHeight, element.offsetWidth]);
                    pdf.addImage(self.reader.result, "JPEG", 0, 0, element.offsetWidth, element.offsetHeight);
                    pdf.save(filename);
                };
            });
        };

        /**
         * Takes a screenshot of a DOM node and exports to JPG.
         * @param {node} element to be exported
         * @param {string} filename the exported image
         * @returns {promise}
         */
        ExportImageService.prototype.exportJPG = function (element, filename) {
            return renderElement(element, "jpeg").then(function (img) {
                self.saveAs(img, filename);
            });
        };

        /**
         * Takes a screenshot of a DOM node and exports to PNG.
         * @param {node} element to be exported
         * @param {string} filename the exported image
         * @returns {promise}
         */
        ExportImageService.prototype.exportPNG = function (element, filename) {
            return renderElement(element, "png").then(function (img) {
                self.saveAs(img, filename);
            });
        };

        polyfillToBlob();

        return ExportImageService;
    }
);

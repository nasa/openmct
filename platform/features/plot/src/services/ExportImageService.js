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
    function (html2canvas, JsPdf, saveAs) {

        /**
         * The export image service will export any HTML node to
         * PDF, JPG, or PNG.
         * @constructor
         */
        function ExportImageService() {
        }

        /**
         * Renders an HTML element into a base64 encoded image
         * as a BLOB, PNG, or JPG.
         * @param {node} element that will be converted to an image
         * @param {function} callback for passing the resulting image
         * @param {string} type of image to convert the element to
         * @returns {string} the color, in #RRGGBB form
         */
        function renderElement(element, callback, type) {
            type = type || "jpeg";

            html2canvas(element, {
                onrendered: function (canvas) {
                    switch (type.toLowerCase()) {
                        case "blob":
                            canvas.toBlob(callback);
                            break;

                        case "png":
                            callback(canvas.toDataURL("image/png", 1.0));
                            break;

                        default:
                        case "jpg":
                        case "jpeg":
                            callback(canvas.toDataURL("image/jpeg", 1.0));
                            break;
                    }
                }
            });
        }

        ExportImageService.prototype.exportPDF = function (element, filename, callback) {
            callback = typeof callback === "function" ? callback : function () {};

            renderElement(element, function (img) {
                var pdf = new JsPdf("l", "px", [element.offsetHeight, element.offsetWidth]);
                pdf.addImage(img, "JPEG", 0, 0, element.offsetWidth, element.offsetHeight);
                pdf.save(filename);
                callback();
            }, "jpeg");
        };

        ExportImageService.prototype.exportJPG = function (element, filename, callback) {
            callback = typeof callback === "function" ? callback : function () {};

            renderElement(element, function (img) {
                saveAs(img, filename);
                callback();
            }, "blob");
        };

        ExportImageService.prototype.exportPNG = function (element, filename, callback) {
            callback = typeof callback === "function" ? callback : function () {};

            renderElement(element, function (img) {
                saveAs(img, filename);
                callback();
            }, "blob");
        };

        return ExportImageService;
    }
);

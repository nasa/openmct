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
         * @param {object} $q
         * @param {object} $timeout
         * @param {object} $log
         * @param {constant} EXPORT_IMAGE_TIMEOUT time in milliseconds before a timeout error is returned
         * @constructor
         */
        function ExportImageService($q, $timeout, $log) {
            this.$q = $q;
            this.$timeout = $timeout;
            this.$log = $log;
            this.EXPORT_IMAGE_TIMEOUT = 1000;
        }

        function addOrRemoveClass(element, className, action) {
            if (action === 'add') {
                element.classList.add(className);
            } else if (action === 'remove') {
                element.classList.remove(className);
            }
        }

        /**
         * Renders an HTML element into a base64 encoded image
         * as a BLOB, PNG, or JPG.
         * @param {node} element that will be converted to an image
         * @param {string} type of image to convert the element to
         * @param {string} object getting captured (for adding and removing corresponding class in exportObject)
         * @returns {promise}
         */
        ExportImageService.prototype.renderElement = function (element, type, className) {

            var defer = this.$q.defer(),
                validTypes = ["png", "jpg", "jpeg"],
                renderTimeout;

            if (validTypes.indexOf(type) === -1) {
                this.$log.error("Invalid type requested. Try: (" + validTypes.join(",") + ")");
                return;
            }

            if (className) {
                addOrRemoveClass(element, className, 'add');
            }

            renderTimeout = this.$timeout(function () {
                defer.reject("html2canvas timed out");
                this.$log.warn("html2canvas timed out");
            }.bind(this), this.EXPORT_IMAGE_TIMEOUT);

            try {
                html2canvas(element, {
                    onrendered: function (canvas) {

                        if (className) {
                            addOrRemoveClass(element, className, 'remove');
                        }

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
                this.$log.warn("html2canvas failed with error: " + e);
            }

            defer.promise.finally(function () {
                renderTimeout.cancel();
                if (className) {
                    addOrRemoveClass(element, className, 'remove');
                }
            });

            return defer.promise;
        };

        /**
         * Takes a screenshot of a DOM node and exports to JPG.
         * @param {node} element to be exported
         * @param {string} filename the exported image
         * @param {string} className to be added to element before capturing (optional)
         * @returns {promise}
         */
        ExportImageService.prototype.exportJPG = function (element, filename, className) {
            return this.renderElement(element, "jpeg", className).then(function (img) {
                saveAs(img, filename);
            });
        };

        /**
         * Takes a screenshot of a DOM node and exports to PNG.
         * @param {node} element to be exported
         * @param {string} filename the exported image
         * @param {string} className to be added to element before capturing (optional)
         * @returns {promise}
         */
        ExportImageService.prototype.exportPNG = function (element, filename, className) {
            return this.renderElement(element, "png", className).then(function (img) {
                saveAs(img, filename);
            });
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

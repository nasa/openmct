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
 * ExportImageServiceSpec. Created by hudsonfoo on 09/03/16.
 */
define(
    ["../../src/services/ExportImageService"],
    function (ExportImageService) {
        var mockQ,
            mockDeferred,
            mockPromise,
            mockTimeout,
            mockLog,
            mockHtml2Canvas,
            mockCanvas,
            mockJsPDF,
            mockJsPDFSave,
            mockSaveAs,
            mockFileReader,
            mockExportTimeoutConstant,
            testElement,
            exportImageService;

        describe("ExportImageService", function () {
            beforeEach(function () {
                mockDeferred = jasmine.createSpyObj(
                    "deferred",
                    ["reject", "resolve"]
                );
                mockPromise = jasmine.createSpyObj(
                    "promise",
                    ["then", "finally"]
                );
                mockPromise.then = function (callback) {
                    callback();
                };
                mockQ = {
                    "defer": function () {
                        return {
                            "resolve": mockDeferred.resolve,
                            "reject": mockDeferred.reject,
                            "promise": mockPromise
                        };
                    }
                };
                mockTimeout = function (fn, time) {
                    return {
                        "cancel": function () {}
                    };
                };
                mockLog = jasmine.createSpyObj(
                    "$log",
                    ["warn"]
                );
                mockHtml2Canvas = jasmine.createSpy("html2canvas").andCallFake(function (element, opts) {
                    opts.onrendered(mockCanvas);
                });
                mockCanvas = jasmine.createSpyObj(
                    "canvas",
                    ["toBlob"]
                );
                mockJsPDFSave = jasmine.createSpy("jsPDFSave");
                mockJsPDF = function () {
                    return {
                        "addImage": function () {},
                        "save": mockJsPDFSave
                    };
                };
                mockSaveAs = jasmine.createSpy("saveAs");
                mockFileReader = jasmine.createSpyObj(
                    "FileReader",
                    ["readAsDataURL", "onloadend"]
                );
                mockExportTimeoutConstant = 0;
                testElement = {};

                exportImageService = new ExportImageService(
                    mockQ,
                    mockTimeout,
                    mockLog,
                    mockExportTimeoutConstant,
                    mockHtml2Canvas,
                    mockJsPDF,
                    mockSaveAs,
                    mockFileReader
                );
            });

            it("runs html2canvas and tries to save a pdf", function () {
                exportImageService.exportPDF(testElement, "plot.pdf");
                mockFileReader.onloadend();

                expect(mockHtml2Canvas).toHaveBeenCalledWith(testElement, { onrendered: jasmine.any(Function) });
                expect(mockCanvas.toBlob).toHaveBeenCalledWith(mockDeferred.resolve, "image/jpeg");
                expect(mockDeferred.reject).not.toHaveBeenCalled();
                expect(mockJsPDFSave).toHaveBeenCalled();
                expect(mockPromise.finally).toHaveBeenCalled();
            });

            it("runs html2canvas and tries to save a png", function () {
                exportImageService.exportPNG(testElement, "plot.png");

                expect(mockHtml2Canvas).toHaveBeenCalledWith(testElement, { onrendered: jasmine.any(Function) });
                expect(mockCanvas.toBlob).toHaveBeenCalledWith(mockDeferred.resolve, "image/png");
                expect(mockDeferred.reject).not.toHaveBeenCalled();
                expect(mockSaveAs).toHaveBeenCalled();
                expect(mockPromise.finally).toHaveBeenCalled();
            });

            it("runs html2canvas and tries to save a jpg", function () {
                exportImageService.exportJPG(testElement, "plot.png");

                expect(mockHtml2Canvas).toHaveBeenCalledWith(testElement, { onrendered: jasmine.any(Function) });
                expect(mockCanvas.toBlob).toHaveBeenCalledWith(mockDeferred.resolve, "image/jpeg");
                expect(mockDeferred.reject).not.toHaveBeenCalled();
                expect(mockSaveAs).toHaveBeenCalled();
                expect(mockPromise.finally).toHaveBeenCalled();
            });
        });
    }
);

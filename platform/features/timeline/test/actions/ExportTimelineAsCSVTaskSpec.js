/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/actions/ExportTimelineAsCSVTask'],
    function (ExportTimelineAsCSVTask) {
        'use strict';

        // Note that most responsibility is delegated to helper
        // classes, so testing here is minimal.
        describe("EXportTimelineAsCSVTask", function () {
            var mockExportService,
                mockDomainObject,
                task;

            beforeEach(function () {
                mockExportService = jasmine.createSpyObj(
                    'exportService',
                    [ 'exportCSV' ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [
                        'getCapability',
                        'useCapability',
                        'hasCapability',
                        'getId',
                        'getModel'
                    ]
                );

                mockDomainObject.getId.andReturn('mock');
                mockDomainObject.getModel.andReturn({});

                task = new ExportTimelineAsCSVTask(
                    mockExportService,
                    mockDomainObject
                );
            });

            describe("when run", function () {
                var mockCallback;

                beforeEach(function () {
                    mockCallback = jasmine.createSpy('callback');
                    task.run().then(mockCallback);
                    waitsFor(function () {
                        return mockCallback.calls.length > 0;
                    });
                });

                it("exports to CSV", function () {
                    expect(mockExportService.exportCSV)
                        .toHaveBeenCalled();
                });
            });
        });
    }
);

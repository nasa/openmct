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
    ['../../../src/controllers/drag/TimelineEndHandle', '../../../src/TimelineConstants'],
    function (TimelineEndHandle, TimelineConstants) {
        'use strict';

        describe("A Timeline end drag handle", function () {
            var mockDragHandler,
                mockSnapHandler,
                mockZoomController,
                handle;

            beforeEach(function () {
                mockDragHandler = jasmine.createSpyObj(
                    'dragHandler',
                    [ 'end', 'persist' ]
                );
                mockSnapHandler = jasmine.createSpyObj(
                    'snapHandler',
                    [ 'snap' ]
                );
                mockZoomController = jasmine.createSpyObj(
                    'zoom',
                    [ 'toMillis', 'toPixels' ]
                );

                mockDragHandler.end.andReturn(12321);

                // Echo back the value from snapper for most tests
                mockSnapHandler.snap.andCallFake(function (ts) {
                    return ts;
                });

                // Double pixels to get millis, for test purposes
                mockZoomController.toMillis.andCallFake(function (px) {
                    return px * 2;
                });

                mockZoomController.toPixels.andCallFake(function (ms) {
                    return ms / 2;
                });

                handle = new TimelineEndHandle(
                    'test-id',
                    mockDragHandler,
                    mockSnapHandler
                );
            });

            it("provides a style for templates", function () {
                var w = TimelineConstants.HANDLE_WIDTH;
                expect(handle.style(mockZoomController)).toEqual({
                    // Left should be adjusted by zoom controller
                    left: (12321 / 2) - w + 'px',
                    // Width should match the defined constant
                    width: w + 'px'
                });
            });

            it("forwards drags to the drag handler", function () {
                handle.begin();
                handle.drag(100, mockZoomController);
                // Should have been interpreted as a +200 ms change
                expect(mockDragHandler.end).toHaveBeenCalledWith(
                    "test-id",
                    12521
                );
            });

            it("snaps drags to other end points", function () {
                mockSnapHandler.snap.andReturn(42);
                handle.begin();
                handle.drag(-10, mockZoomController);
                // Should have used snap-to timestamp
                expect(mockDragHandler.end).toHaveBeenCalledWith(
                    "test-id",
                    42
                );
            });

            it("persists when a move is complete", function () {
                // Simulate normal drag cycle
                handle.begin();
                handle.drag(100, mockZoomController);
                // Should not have persisted yet
                expect(mockDragHandler.persist).not.toHaveBeenCalled();
                // Finish the drag
                handle.finish();
                // Now it should have persisted
                expect(mockDragHandler.persist).toHaveBeenCalled();
            });

        });
    }
);
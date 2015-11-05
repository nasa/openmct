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
    ['../../../src/controllers/drag/TimelineMoveHandle', '../../../src/TimelineConstants'],
    function (TimelineMoveHandle, TimelineConstants) {
        'use strict';

        describe("A Timeline move drag handle", function () {
            var mockDragHandler,
                mockSnapHandler,
                mockZoomController,
                handle;

            beforeEach(function () {
                mockDragHandler = jasmine.createSpyObj(
                    'dragHandler',
                    [ 'start', 'duration', 'end', 'move', 'persist' ]
                );
                mockSnapHandler = jasmine.createSpyObj(
                    'snapHandler',
                    [ 'snap' ]
                );
                mockZoomController = jasmine.createSpyObj(
                    'zoom',
                    [ 'toMillis', 'toPixels' ]
                );

                mockDragHandler.start.andReturn(12321);
                mockDragHandler.duration.andReturn(4200);
                mockDragHandler.end.andReturn(12321 + 4200);

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

                handle = new TimelineMoveHandle(
                    'test-id',
                    mockDragHandler,
                    mockSnapHandler
                );
            });

            it("provides a style for templates", function () {
                var w = TimelineConstants.HANDLE_WIDTH;
                expect(handle.style(mockZoomController)).toEqual({
                    // Left should be adjusted by zoom controller
                    left: (12321 / 2) + w + 'px',
                    // Width should be duration minus end points
                    width: 2100 - (w * 2) + 'px'
                });
            });

            it("forwards drags to the drag handler", function () {
                handle.begin();
                handle.drag(100, mockZoomController);
                // Should have been interpreted as a +200 ms change
                expect(mockDragHandler.move).toHaveBeenCalledWith(
                    "test-id",
                    200
                );
            });

            it("tracks drags incrementally", function () {
                handle.begin();

                handle.drag(100, mockZoomController);
                // Should have been interpreted as a +200 ms change...
                expect(mockDragHandler.move).toHaveBeenCalledWith(
                    "test-id",
                    200
                );

                // Reflect the change from the drag handler
                mockDragHandler.start.andReturn(12521);
                mockDragHandler.end.andReturn(12521 + 4200);

                // ....followed by a +100 ms change.
                handle.drag(150, mockZoomController);
                expect(mockDragHandler.move).toHaveBeenCalledWith(
                    "test-id",
                    100
                );
            });

            it("snaps drags to other end points", function () {
                mockSnapHandler.snap.andCallFake(function (ts) {
                    return ts + 10;
                });
                handle.begin();
                handle.drag(100, mockZoomController);
                // Should have used snap-to timestamp, which was 10
                // ms greater than the provided one
                expect(mockDragHandler.move).toHaveBeenCalledWith(
                    "test-id",
                    210
                );
            });

            it("considers snaps for both endpoints", function () {
                handle.begin();
                expect(mockSnapHandler.snap).not.toHaveBeenCalled();
                handle.drag(100, mockZoomController);
                expect(mockSnapHandler.snap.calls.length).toEqual(2);
            });

            it("chooses the closest snap-to location", function () {
                // Use a toggle to give snapped timestamps that are
                // different distances away from the original.
                // The move handle needs to choose the closest snap-to,
                // regardless of whether it is the start/end (which
                // will vary based on the initial state of this toggle.)
                var toggle = false;
                mockSnapHandler.snap.andCallFake(function (ts) {
                    toggle = !toggle;
                    return ts + (toggle ? -5 : 10);
                });
                handle.begin();
                handle.drag(100, mockZoomController);
                expect(mockDragHandler.move).toHaveBeenCalledWith(
                    "test-id",
                    195 // Chose the -5
                );

                // Reflect the change from the drag handler
                mockDragHandler.start.andReturn(12521 - 5);
                mockDragHandler.end.andReturn(12521 + 4200 - 5);

                toggle = true; // Change going-in state
                handle.drag(300, mockZoomController);
                // Note that the -5 offset is shown in the current state,
                // so snapping to the -5 implies that the full 400ms will
                // be moved (again, relative to dragHandler's reported state)
                expect(mockDragHandler.move).toHaveBeenCalledWith(
                    "test-id",
                    400 // Still chose the -5
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
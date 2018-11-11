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
    ['../src/FixedDragHandle'],
    function (FixedDragHandle) {

        var TEST_GRID_SIZE = [13, 33];

        describe("A fixed position drag handle", function () {
            var mockElementHandle,
                mockConfigPath,
                mockFixedControl,
                handle;

            beforeEach(function () {
                mockElementHandle = jasmine.createSpyObj(
                    'elementHandle',
                    ['x', 'y','getGridSize']
                );
                mockElementHandle.x.and.returnValue(6);
                mockElementHandle.y.and.returnValue(8);
                mockElementHandle.getGridSize.and.returnValue(TEST_GRID_SIZE);

                mockFixedControl = jasmine.createSpyObj(
                    'fixedControl',
                    ['updateSelectionStyle', 'mutate']
                );
                mockFixedControl.updateSelectionStyle.and.returnValue();
                mockFixedControl.mutate.and.returnValue();

                mockConfigPath = jasmine.createSpy('configPath');

                handle = new FixedDragHandle(
                    mockElementHandle,
                    mockConfigPath,
                    mockFixedControl
                );
            });

            it("provides a style for positioning", function () {
                var style = handle.style();
                // 6 grid coords * 13 pixels - 3 pixels for centering
                expect(style.left).toEqual('75px');
                // 8 grid coords * 33 pixels - 3 pixels for centering
                expect(style.top).toEqual('261px');
            });

            it("allows handles to be dragged", function () {
                handle.startDrag();
                handle.continueDrag([16, 8]);

                // Should update x/y, snapped to grid
                expect(mockElementHandle.x).toHaveBeenCalledWith(7);
                expect(mockElementHandle.y).toHaveBeenCalledWith(8);

                handle.continueDrag([-16, -35]);

                // Should have interpreted relative to initial state
                expect(mockElementHandle.x).toHaveBeenCalledWith(5);
                expect(mockElementHandle.y).toHaveBeenCalledWith(7);

                // Should have called updateSelectionStyle once per continueDrag
                expect(mockFixedControl.updateSelectionStyle.calls.count()).toEqual(2);

                // Finally, ending drag should mutate
                handle.endDrag();
                expect(mockFixedControl.mutate).toHaveBeenCalled();
            });

        });
    }
);

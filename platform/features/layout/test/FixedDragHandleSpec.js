/*global define,describe,it,expect,beforeEach,jasmine,xit*/

define(
    ['../src/FixedDragHandle'],
    function (FixedDragHandle) {
        "use strict";

        var TEST_GRID_SIZE = [ 13, 33 ];

        describe("A fixed position drag handle", function () {
            var mockElementHandle,
                mockCommit,
                handle;

            beforeEach(function () {
                mockElementHandle = jasmine.createSpyObj(
                    'elementHandle',
                    [ 'x', 'y' ]
                );
                mockCommit = jasmine.createSpy('commit');

                mockElementHandle.x.andReturn(6);
                mockElementHandle.y.andReturn(8);

                handle = new FixedDragHandle(
                    mockElementHandle,
                    TEST_GRID_SIZE,
                    mockCommit
                );
            });

            it("provides a style for positioning", function () {
                var style = handle.style();
                // 6 grid coords * 13 pixels - 4 pixels for centering
                expect(style.left).toEqual('74px');
                // 8 grid coords * 33 pixels - 4 pixels for centering
                expect(style.top).toEqual('260px');
            });

            it("allows handles to be dragged", function () {
                handle.startDrag();
                handle.continueDrag([ 16, 8 ]);

                // Should update x/y, snapped to grid
                expect(mockElementHandle.x).toHaveBeenCalledWith(7);
                expect(mockElementHandle.y).toHaveBeenCalledWith(8);

                handle.continueDrag([ -16, -35 ]);

                // Should have interpreted relative to initial state
                expect(mockElementHandle.x).toHaveBeenCalledWith(5);
                expect(mockElementHandle.y).toHaveBeenCalledWith(7);

                // Finally, ending drag should commit
                expect(mockCommit).not.toHaveBeenCalled();
                handle.endDrag();
                expect(mockCommit).toHaveBeenCalled();
            });

        });
    }
);
define(
    ['../../src/elements/UnitAccessorMutator'],
    function (UnitAccessorMutator) {

        var GRID_SIZE = [13,17];

        describe("An elementProxy.gridSize accessor-mutator", function () {
            var mockElementProxy,
                testElement,
                uAM;

            beforeEach(function () {
                testElement = {
                    x: 2,
                    y: 3,
                    width: 4,
                    height: 5,
                    useGrid: true
                };

                mockElementProxy = {
                    element: testElement,
                    gridSize: GRID_SIZE,
                    getMinHeight: jasmine.createSpy('minHeight'),
                    getMinWidth: jasmine.createSpy('minWidth')
                };

                uAM = new UnitAccessorMutator(mockElementProxy);

                mockElementProxy.getMinWidth.andReturn(1);
                mockElementProxy.getMinHeight.andReturn(1);

            });

            it("allows access to useGrid", function () {
                expect(uAM()).toEqual(mockElementProxy.element.useGrid);
            });

            it("allows mutation of useGrid", function () {
                uAM(false);
                expect(mockElementProxy.element.useGrid).toEqual(false);
            });

            it("converts coordinates appropriately", function () {
                uAM(false);
                expect(mockElementProxy.element.x).toEqual(26);
                expect(mockElementProxy.element.y).toEqual(51);
                expect(mockElementProxy.element.width).toEqual(52);
                expect(mockElementProxy.element.height).toEqual(85);
                uAM(true);
                expect(mockElementProxy.element.x).toEqual(2);
                expect(mockElementProxy.element.y).toEqual(3);
                expect(mockElementProxy.element.width).toEqual(4);
                expect(mockElementProxy.element.height).toEqual(5);
            });

            it("doesn't covert coordinates unecessarily", function () {
                uAM(false);
                expect(mockElementProxy.element.x).toEqual(26);
                expect(mockElementProxy.element.y).toEqual(51);
                expect(mockElementProxy.element.width).toEqual(52);
                expect(mockElementProxy.element.height).toEqual(85);
                uAM(false);
                expect(mockElementProxy.element.x).toEqual(26);
                expect(mockElementProxy.element.y).toEqual(51);
                expect(mockElementProxy.element.width).toEqual(52);
                expect(mockElementProxy.element.height).toEqual(85);
            });

        });
    }
);

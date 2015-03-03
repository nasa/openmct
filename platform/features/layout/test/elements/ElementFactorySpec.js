/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ['../../src/elements/ElementFactory'],
    function (ElementFactory) {
        "use strict";

        var DIALOG_ELEMENTS = [ 'image', 'text' ],
            NON_DIALOG_ELEMENTS = [ 'box', 'line' ];

        describe("The fixed position element factory", function () {
            var mockDialogService,
                mockPromise,
                factory;

            beforeEach(function () {
                mockDialogService = jasmine.createSpyObj(
                    'dialogService',
                    [ 'getUserInput' ]
                );
                mockPromise = jasmine.createSpyObj(
                    'promise',
                    [ 'then' ]
                );

                mockDialogService.getUserInput.andReturn(mockPromise);
                mockPromise.then.andReturn(mockPromise);

                factory = new ElementFactory(mockDialogService);
            });

            DIALOG_ELEMENTS.forEach(function (type) {
                it("shows a dialog for " + type + " elements", function () {
                    expect(factory.createElement('fixed.' + type))
                        .toEqual(mockPromise);
                    expect(mockDialogService.getUserInput).toHaveBeenCalled();
                });
            });

            NON_DIALOG_ELEMENTS.forEach(function (type) {
                it("immediately provides " + type + " elements", function () {
                    var result = factory.createElement('fixed.' + type);
                    expect(result).toBeDefined();
                    expect(result).not.toEqual(mockPromise);
                    expect(mockDialogService.getUserInput).not.toHaveBeenCalled();
                });
            });
        });
    }
);
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/creation/CreateAction"],
    function (CreateAction) {
        "use strict";

        describe("The create action", function () {
            var mockType,
                mockParent,
                mockContext,
                mockDialogService,
                mockCreationService,
                action;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockType = jasmine.createSpyObj(
                    "type",
                    [
                        "getKey",
                        "getGlyph",
                        "getName",
                        "getDescription",
                        "getProperties",
                        "getInitialModel"
                    ]
                );
                mockParent = jasmine.createSpyObj(
                    "domainObject",
                    [
                        "getId",
                        "getModel",
                        "getCapability"
                    ]
                );
                mockContext = {
                    domainObject: mockParent
                };
                mockDialogService = jasmine.createSpyObj(
                    "dialogService",
                    [ "getUserInput" ]
                );
                mockCreationService = jasmine.createSpyObj(
                    "creationService",
                    [ "createObject" ]
                );

                mockType.getKey.andReturn("test");
                mockType.getGlyph.andReturn("T");
                mockType.getDescription.andReturn("a test type");
                mockType.getName.andReturn("Test");
                mockType.getProperties.andReturn([]);
                mockType.getInitialModel.andReturn({});

                mockDialogService.getUserInput.andReturn(mockPromise({}));

                action = new CreateAction(
                    mockType,
                    mockParent,
                    mockContext,
                    mockDialogService,
                    mockCreationService
                );
            });

            it("exposes type-appropriate metadata", function () {
                var metadata = action.getMetadata();

                expect(metadata.name).toEqual("Test");
                expect(metadata.description).toEqual("a test type");
                expect(metadata.glyph).toEqual("T");
            });

            it("invokes the creation service when performed", function () {
                action.perform();
                expect(mockCreationService.createObject).toHaveBeenCalledWith(
                    { type: "test" },
                    mockParent
                );
            });

            it("does not create an object if the user cancels", function () {
                mockDialogService.getUserInput.andReturn({
                    then: function (callback, fail) {
                        fail();
                    }
                });

                action.perform();

                expect(mockCreationService.createObject)
                    .not.toHaveBeenCalled();

            });

        });
    }
);
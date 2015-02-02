/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MCTRepresentationSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/creation/CreateActionProvider"],
    function (CreateActionProvider) {
        "use strict";

        describe("The create action provider", function () {
            var mockTypeService,
                mockDialogService,
                mockCreationService,
                mockTypes,
                provider;

            function createMockType(name) {
                var mockType = jasmine.createSpyObj(
                    "type" + name,
                    [
                        "getKey",
                        "getGlyph",
                        "getName",
                        "getDescription",
                        "getProperties",
                        "getInitialModel",
                        "hasFeature"
                    ]
                );
                mockType.hasFeature.andReturn(true);
                mockType.getName.andReturn(name);
                return mockType;
            }

            beforeEach(function () {
                mockTypeService = jasmine.createSpyObj(
                    "typeService",
                    [ "listTypes" ]
                );
                mockDialogService = jasmine.createSpyObj(
                    "dialogService",
                    [ "getUserInput" ]
                );
                mockCreationService = jasmine.createSpyObj(
                    "creationService",
                    [ "createObject" ]
                );
                mockTypes = [ "A", "B", "C" ].map(createMockType);

                mockTypeService.listTypes.andReturn(mockTypes);

                provider = new CreateActionProvider(
                    mockTypeService,
                    mockDialogService,
                    mockCreationService
                );
            });

            it("exposes one create action per type", function () {
                expect(provider.getActions({
                    key: "create",
                    domainObject: {}
                }).length).toEqual(3);
            });

            it("exposes no non-create actions", function () {
                expect(provider.getActions({
                    key: "somethingElse",
                    domainObject: {}
                }).length).toEqual(0);
            });

            it("does not expose non-creatable types", function () {
                // One of the types won't have the creation feature...
                mockTypes[1].hasFeature.andReturn(false);
                // ...so it should have been filtered out.
                expect(provider.getActions({
                    key: "create",
                    domainObject: {}
                }).length).toEqual(2);
                // Make sure it was creation which was used to check
                expect(mockTypes[1].hasFeature)
                    .toHaveBeenCalledWith("creation");
            });
        });
    }
);
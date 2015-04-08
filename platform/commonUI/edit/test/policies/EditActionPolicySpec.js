/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/policies/EditActionPolicy"],
    function (EditActionPolicy) {
        "use strict";

        describe("The Edit action policy", function () {
            var editableView,
                nonEditableView,
                undefinedView,
                testViews,
                testContext,
                mockDomainObject,
                mockEditAction,
                mockPropertiesAction,
                policy;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'useCapability' ]
                );
                mockEditAction = jasmine.createSpyObj('edit', ['getMetadata']);
                mockPropertiesAction = jasmine.createSpyObj('edit', ['getMetadata']);

                editableView = { editable: true };
                nonEditableView = { editable: false };
                undefinedView = { someKey: "some value" };
                testViews = [];

                mockDomainObject.useCapability.andCallFake(function (c) {
                    // Provide test views, only for the view capability
                    return c === 'view' && testViews;
                });

                mockEditAction.getMetadata.andReturn({ key: 'edit' });
                mockPropertiesAction.getMetadata.andReturn({ key: 'properties' });

                testContext = {
                    domainObject: mockDomainObject,
                    category: 'view-control'
                };

                policy = new EditActionPolicy();
            });

            it("allows the edit action when there are editable views", function () {
                testViews = [ editableView ];
                expect(policy.allow(mockEditAction, testContext)).toBeTruthy();
                // No edit flag defined; should be treated as editable
                testViews = [ undefinedView, undefinedView ];
                expect(policy.allow(mockEditAction, testContext)).toBeTruthy();
            });

            it("allows the edit properties action when there are no editable views", function () {
                testViews = [ nonEditableView, nonEditableView ];
                expect(policy.allow(mockPropertiesAction, testContext)).toBeTruthy();
            });

            it("disallows the edit action when there are no editable views", function () {
                testViews = [ nonEditableView, nonEditableView ];
                expect(policy.allow(mockEditAction, testContext)).toBeFalsy();
            });

            it("disallows the edit properties action when there are editable views", function () {
                testViews = [ editableView ];
                expect(policy.allow(mockPropertiesAction, testContext)).toBeFalsy();
            });

            it("allows the edit properties outside of the 'view-control' category", function () {
                testViews = [ nonEditableView ];
                testContext.category = "something-else";
                expect(policy.allow(mockPropertiesAction, testContext)).toBeTruthy();
            });
        });
    }
);
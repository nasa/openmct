/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/policies/EditableViewPolicy"],
    function (EditableViewPolicy) {
        "use strict";

        describe("The editable view policy", function () {
            var testView,
                mockDomainObject,
                testMode,
                policy;

            beforeEach(function () {
                testMode = true; // Act as if we're in Edit mode by default
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['hasCapability']
                );
                mockDomainObject.hasCapability.andCallFake(function (c) {
                    return (c === 'editor') && testMode;
                });

                policy = new EditableViewPolicy();
            });

            it("disallows views in edit mode that are flagged as non-editable", function () {
                expect(policy.allow({ editable: false }, mockDomainObject))
                    .toBeFalsy();
            });

            it("allows views in edit mode that are flagged as editable", function () {
                expect(policy.allow({ editable: true }, mockDomainObject))
                    .toBeTruthy();
            });

            it("allows any view outside of edit mode", function () {
                var testViews = [
                    { editable: false },
                    { editable: true },
                    { someKey: "some value" }
                ];
                testMode = false; // Act as if we're not in Edit mode

                testViews.forEach(function (testView) {
                    expect(policy.allow(testView, mockDomainObject)).toBeTruthy();
                });
            });

            it("treats views with no defined 'editable' property as editable", function () {
                expect(policy.allow({ someKey: "some value" }, mockDomainObject))
                    .toBeTruthy();
            });
        });
    }
);
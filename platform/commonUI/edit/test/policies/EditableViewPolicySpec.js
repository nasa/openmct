/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/policies/EditableViewPolicy"],
    function (EditableViewPolicy) {
        "use strict";

        describe("The editable view policy", function () {
            it("disallows views in edit mode that are flagged as non-editable", function () {

            });
            it("allows any view outside of edit mode", function () {

            });
            it("treats views with no defined 'editable' property as editable", function () {

            });
        });
    }
);
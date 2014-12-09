/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * MergeModelsSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../src/NameColumn"],
    function (NameColumn) {
        "use strict";

        describe("A name column", function () {
            var mockDomainObject,
                column;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getModel" ]
                );
                mockDomainObject.getModel.andReturn({
                    name: "Test object name"
                });
                column = new NameColumn();
            });

            it("reports a column header", function () {
                expect(column.getTitle()).toEqual("Name");
            });

            it("looks up name from an object's model", function () {
                expect(column.getValue(mockDomainObject))
                    .toEqual("Test object name");
            });

        });
    }
);
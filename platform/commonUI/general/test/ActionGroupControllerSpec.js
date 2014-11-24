/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../src/ActionGroupController"],
    function (ActionGroupController) {
        "use strict";

        describe("The domain object provider", function () {
            var mockScope,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj("$scope", ["$watch"]);
                controller = new ActionGroupController(mockScope);
            });
        });
    }
);
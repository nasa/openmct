/*global define,describe,it,expect,beforeEach,jasmine,xit*/

define(
    ['../src/FixedProxy'],
    function (FixedProxy) {
        "use strict";

        describe("Fixed Position view's selection proxy", function () {
            it("has a placeholder message when clicked", function () {
                var oldAlert = window.alert;
                window.alert = jasmine.createSpy('alert');
                new FixedProxy({}).add('');
                expect(window.alert).toHaveBeenCalledWith(jasmine.any(String));
                window.alert = oldAlert;
            });
        });
    }
);

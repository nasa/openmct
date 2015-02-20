/*global define,describe,it,expect,beforeEach,jasmine,xit*/

define(
    ['../src/FixedProxy'],
    function (FixedProxy) {
        "use strict";

        describe("Fixed Position view's selection proxy", function () {
            var mockCallback,
                mockQ,
                mockDialogService,
                mockPromise,
                proxy;

            beforeEach(function () {
                mockCallback = jasmine.createSpy('callback');
                mockQ = jasmine.createSpyObj('$q', ['when']);
                mockDialogService = jasmine.createSpyObj('dialogService', ['getUserInput']);
                mockPromise = jasmine.createSpyObj('promise', ['then']);

                mockQ.when.andReturn(mockPromise);

                proxy = new FixedProxy(mockCallback, mockQ, mockDialogService);
            });

            it("handles promised element creation", function () {
                // The element factory may return promises (e.g. if
                // user input is required) so make sure proxy is wrapping these
                proxy.add("fixed.box");
                expect(mockQ.when).toHaveBeenCalled();
            });
        });
    }
);

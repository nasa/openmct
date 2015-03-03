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

            it("notifies its callback when an element is created", function () {
                proxy.add("fixed.box");
                // Callback should not have been invoked yet
                expect(mockCallback).not.toHaveBeenCalled();
                // Resolve the promise
                mockPromise.then.mostRecentCall.args[0]({});
                // Should have fired the callback
                expect(mockCallback).toHaveBeenCalledWith({
                    type: "fixed.box",
                    x: 0,
                    y: 0,
                    width: 1,
                    height: 1
                });
            });

        });
    }
);

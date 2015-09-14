/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ["../../src/controllers/RefreshingController"],
    function (RefreshingController) {
        "use strict";



        describe("The refreshing controller", function () {
            var mockScope,
                mockTicker,
                mockUnticker,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj('$scope', ['$on']);
                mockTicker = jasmine.createSpyObj('ticker', ['listen']);
                mockUnticker = jasmine.createSpy('unticker');

                mockTicker.listen.andReturn(mockUnticker);

                controller = new RefreshingController(mockScope, mockTicker);
            });

            it("refreshes the represented object on every tick", function () {
                var mockDomainObject = jasmine.createSpyObj(
                        'domainObject',
                        [ 'getCapability' ]
                    ),
                    mockPersistence = jasmine.createSpyObj(
                        'persistence',
                        [ 'persist', 'refresh' ]
                    );

                mockDomainObject.getCapability.andCallFake(function (c) {
                    return (c === 'persistence') && mockPersistence;
                });

                mockScope.domainObject = mockDomainObject;

                mockTicker.listen.mostRecentCall.args[0](12321);
                expect(mockPersistence.refresh).toHaveBeenCalled();
                expect(mockPersistence.persist).not.toHaveBeenCalled();
            });

            it("subscribes to clock ticks", function () {
                expect(mockTicker.listen)
                    .toHaveBeenCalledWith(jasmine.any(Function));
            });

            it("unsubscribes to ticks when destroyed", function () {
                // Make sure $destroy is being listened for...
                expect(mockScope.$on.mostRecentCall.args[0]).toEqual('$destroy');
                expect(mockUnticker).not.toHaveBeenCalled();

                // ...and makes sure that its listener unsubscribes from ticker
                mockScope.$on.mostRecentCall.args[1]();
                expect(mockUnticker).toHaveBeenCalled();
            });
        });
    }
);

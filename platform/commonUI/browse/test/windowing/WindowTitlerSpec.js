/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * WindowTitlerSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/windowing/WindowTitler"],
    function (WindowTitler) {
        "use strict";

        describe("The window titler", function () {
            var mockNavigationService,
                mockRootScope,
                mockDocument,
                mockDomainObject,
                titler;

            beforeEach(function () {
                mockNavigationService = jasmine.createSpyObj(
                    'navigationService',
                    [ 'getNavigation' ]
                );
                mockRootScope = jasmine.createSpyObj(
                    '$rootScope',
                    [ '$watch' ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getModel']
                );
                mockDocument = [{}];

                mockDomainObject.getModel.andReturn({ name: 'Test name' });
                mockNavigationService.getNavigation.andReturn(mockDomainObject);

                titler = new WindowTitler(
                    mockNavigationService,
                    mockRootScope,
                    mockDocument
                );
            });

            it("listens for changes to the name of the navigated object", function () {
                expect(mockRootScope.$watch).toHaveBeenCalledWith(
                    jasmine.any(Function),
                    jasmine.any(Function)
                );
                expect(mockRootScope.$watch.mostRecentCall.args[0]())
                    .toEqual('Test name');
            });

            it("sets the title to the name of the navigated object", function () {
                mockRootScope.$watch.mostRecentCall.args[1]("Some name");
                expect(mockDocument[0].title).toEqual("Some name");
            });

        });
    }
);
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * ViewCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/views/ViewCapability"],
    function (ViewCapability) {
        "use strict";

        describe("A view capability", function () {
            var mockViewService,
                mockDomainObject,
                views = [ {key: "someView"} ],
                view;

            beforeEach(function () {
                mockViewService = jasmine.createSpyObj(
                    "viewService",
                    [ "getViews" ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    "domainObject",
                    [ "getId", "getModel", "getCapability" ]
                );
                mockViewService.getViews.andReturn(views);
                view = new ViewCapability(mockViewService, mockDomainObject);
            });

            it("issues invocations to the view service", function () {
                expect(view.invoke()).toEqual(views);
                expect(mockViewService.getViews).toHaveBeenCalledWith(
                    mockDomainObject
                );
            });

        });
    }
);
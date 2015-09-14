/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../../src/controllers/drag/TimelineDragHandleFactory'],
    function (TimelineDragHandleFactory) {
        'use strict';

        describe("A Timeline drag handle factory", function () {
            var mockDragHandler,
                mockSnapHandler,
                mockDomainObject,
                mockType,
                testType,
                factory;

            beforeEach(function () {
                mockDragHandler = jasmine.createSpyObj(
                    'dragHandler',
                    [ 'start' ]
                );
                mockSnapHandler = jasmine.createSpyObj(
                    'snapHandler',
                    [ 'snap' ]
                );
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getCapability', 'getId' ]
                );
                mockType = jasmine.createSpyObj(
                    'type',
                    [ 'instanceOf' ]
                );

                mockDomainObject.getId.andReturn('test-id');
                mockDomainObject.getCapability.andReturn(mockType);
                mockType.instanceOf.andCallFake(function (t) {
                    return t === testType;
                });

                factory = new TimelineDragHandleFactory(
                    mockDragHandler,
                    mockSnapHandler
                );
            });

            it("inspects an object's type capability", function () {
                factory.handles(mockDomainObject);
                expect(mockDomainObject.getCapability)
                    .toHaveBeenCalledWith('type');
            });

            it("provides three handles for activities", function () {
                testType = "warp.activity";
                expect(factory.handles(mockDomainObject).length)
                    .toEqual(3);
            });

            it("provides two handles for timelines", function () {
                testType = "warp.timeline";
                expect(factory.handles(mockDomainObject).length)
                    .toEqual(2);
            });

        });
    }
);

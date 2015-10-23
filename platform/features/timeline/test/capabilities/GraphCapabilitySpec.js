/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/capabilities/GraphCapability'],
    function (GraphCapability) {
        'use strict';

        describe("A Timeline's graph capability", function () {
            var mockQ,
                mockDomainObject,
                testModel,
                capability;

            function asPromise(v) {
                return (v || {}).then ? v : {
                    then: function (cb) {
                        return asPromise(cb(v));
                    }
                };
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj('$q', ['when']);
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getId', 'getModel', 'useCapability' ]
                );

                testModel = {
                    type: "activity",
                    resources: {
                        abc: 100,
                        xyz: 42
                    }
                };

                mockQ.when.andCallFake(asPromise);
                mockDomainObject.getModel.andReturn(testModel);

                capability = new GraphCapability(
                    mockQ,
                    mockDomainObject
                );
            });

            it("is applicable to timelines", function () {
                expect(GraphCapability.appliesTo({
                    type: "timeline"
                })).toBeTruthy();
            });

            it("is applicable to activities", function () {
                expect(GraphCapability.appliesTo(testModel))
                    .toBeTruthy();
            });

            it("is not applicable to other objects", function () {
                expect(GraphCapability.appliesTo({
                    type: "something"
                })).toBeFalsy();
            });

            it("provides one graph per resource type", function () {
                var mockCallback = jasmine.createSpy('callback');

                mockDomainObject.useCapability.andReturn(asPromise([
                    { key: "abc", start: 0, end: 15 },
                    { key: "abc", start: 0, end: 15 },
                    { key: "def", start: 4, end: 15 },
                    { key: "xyz", start: 0, end: 20 }
                ]));

                capability.invoke().then(mockCallback);

                expect(mockCallback).toHaveBeenCalledWith({
                    abc: jasmine.any(Object),
                    def: jasmine.any(Object),
                    xyz: jasmine.any(Object)
                });
            });

            it("provides a battery graph for timelines with capacity", function () {
                var mockCallback = jasmine.createSpy('callback');
                testModel.capacity = 1000;
                testModel.type = "timeline";
                mockDomainObject.useCapability.andReturn(asPromise([
                    { key: "power", start: 0, end: 15 }
                ]));
                capability.invoke().then(mockCallback);
                expect(mockCallback).toHaveBeenCalledWith({
                    power: jasmine.any(Object),
                    battery: jasmine.any(Object)
                });
            });

        });
    }
);

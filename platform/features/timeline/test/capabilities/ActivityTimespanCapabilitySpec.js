/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/capabilities/ActivityTimespanCapability'],
    function (ActivityTimespanCapability) {
        'use strict';

        describe("An Activity's timespan capability", function () {
            var mockQ,
                mockDomainObject,
                capability;

            function asPromise(v) {
                return (v || {}).then ? v : {
                    then: function (callback) {
                        return asPromise(callback(v));
                    }
                };
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj('$q', ['when']);
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getModel', 'getCapability' ]
                );

                mockQ.when.andCallFake(asPromise);
                mockDomainObject.getModel.andReturn({
                    start: {
                        timestamp: 42000,
                        epoch: "TEST"
                    },
                    duration: {
                        timestamp: 12321
                    }
                });

                capability = new ActivityTimespanCapability(
                    mockQ,
                    mockDomainObject
                );
            });

            it("applies only to activity objects", function () {
                expect(ActivityTimespanCapability.appliesTo({
                    type: 'activity'
                })).toBeTruthy();
                expect(ActivityTimespanCapability.appliesTo({
                    type: 'folder'
                })).toBeFalsy();
            });

            it("provides timespan based on model", function () {
                var mockCallback = jasmine.createSpy('callback');
                capability.invoke().then(mockCallback);
                // We verify other methods in ActivityTimespanSpec,
                // so just make sure we got something that looks right.
                expect(mockCallback).toHaveBeenCalledWith({
                    getStart: jasmine.any(Function),
                    getEnd: jasmine.any(Function),
                    getDuration: jasmine.any(Function),
                    setStart: jasmine.any(Function),
                    setEnd: jasmine.any(Function),
                    setDuration: jasmine.any(Function),
                    getEpoch: jasmine.any(Function)
                });
            });
        });
    }
);

define([
    './TelemetryAPI'
], function (
    TelemetryAPI
) {
    describe('Telemetry API', function () {
        var openmct;
        var telemetryAPI;

        beforeEach(function () {
            openmct = {
                time: jasmine.createSpyObj('timeAPI', [
                    'timeSystem',
                    'bounds'
                ])
            };
            openmct.time.timeSystem.andReturn({key: 'system'});
            openmct.time.bounds.andReturn({start: 0, end: 1});
            telemetryAPI = new TelemetryAPI(openmct);

        });

        describe('telemetry providers', function () {
            var telemetryProvider,
                domainObject;

            beforeEach(function () {
                telemetryProvider = jasmine.createSpyObj('telemetryProvider', [
                    'supportsSubscribe',
                    'subscribe',
                    'supportsRequest',
                    'request'
                ]);
                domainObject = {
                    identifier: {
                        key: 'a',
                        namespace: 'b'
                    },
                    type: 'sample-type'
                };
            });

            it('provides consistent results without providers', function () {
                var unsubscribe = telemetryAPI.subscribe(domainObject);
                expect(unsubscribe).toEqual(jasmine.any(Function));

                var response = telemetryAPI.request(domainObject);
                expect(response).toEqual(jasmine.any(Promise));
            });

            it('skips providers that do not match', function () {
                telemetryProvider.supportsSubscribe.andReturn(false);
                telemetryProvider.supportsRequest.andReturn(false);
                telemetryAPI.addProvider(telemetryProvider);

                var callback = jasmine.createSpy('callback');
                var unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                expect(telemetryProvider.supportsSubscribe)
                    .toHaveBeenCalledWith(domainObject);
                expect(telemetryProvider.subscribe).not.toHaveBeenCalled();
                expect(unsubscribe).toEqual(jasmine.any(Function));

                var response = telemetryAPI.request(domainObject);
                expect(telemetryProvider.supportsRequest)
                    .toHaveBeenCalledWith(domainObject, jasmine.any(Object));
                expect(telemetryProvider.request).not.toHaveBeenCalled();
                expect(response).toEqual(jasmine.any(Promise));
            });

            it('sends subscribe calls to matching providers', function () {
                var unsubFunc = jasmine.createSpy('unsubscribe');
                telemetryProvider.subscribe.andReturn(unsubFunc);
                telemetryProvider.supportsSubscribe.andReturn(true);
                telemetryAPI.addProvider(telemetryProvider);

                var callback = jasmine.createSpy('callback');
                var unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                expect(telemetryProvider.supportsSubscribe.calls.length).toBe(1);
                expect(telemetryProvider.supportsSubscribe)
                    .toHaveBeenCalledWith(domainObject);
                expect(telemetryProvider.subscribe.calls.length).toBe(1);
                expect(telemetryProvider.subscribe)
                    .toHaveBeenCalledWith(domainObject, jasmine.any(Function));

                var notify = telemetryProvider.subscribe.mostRecentCall.args[1];
                notify('someValue');
                expect(callback).toHaveBeenCalledWith('someValue');

                expect(unsubscribe).toEqual(jasmine.any(Function));
                expect(unsubFunc).not.toHaveBeenCalled();
                unsubscribe();
                expect(unsubFunc).toHaveBeenCalled();

                notify('otherValue');
                expect(callback).not.toHaveBeenCalledWith('otherValue');
            });

            it('subscribes once per object', function () {
                var unsubFunc = jasmine.createSpy('unsubscribe');
                telemetryProvider.subscribe.andReturn(unsubFunc);
                telemetryProvider.supportsSubscribe.andReturn(true);
                telemetryAPI.addProvider(telemetryProvider);

                var callback = jasmine.createSpy('callback');
                var callbacktwo = jasmine.createSpy('callback two');
                var unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                var unsubscribetwo = telemetryAPI.subscribe(domainObject, callbacktwo);

                expect(telemetryProvider.subscribe.calls.length).toBe(1);

                var notify = telemetryProvider.subscribe.mostRecentCall.args[1];
                notify('someValue');
                expect(callback).toHaveBeenCalledWith('someValue');
                expect(callbacktwo).toHaveBeenCalledWith('someValue');

                unsubscribe();
                expect(unsubFunc).not.toHaveBeenCalled();
                notify('otherValue');
                expect(callback).not.toHaveBeenCalledWith('otherValue');
                expect(callbacktwo).toHaveBeenCalledWith('otherValue');

                unsubscribetwo();
                expect(unsubFunc).toHaveBeenCalled();
                notify('anotherValue');
                expect(callback).not.toHaveBeenCalledWith('anotherValue');
                expect(callbacktwo).not.toHaveBeenCalledWith('anotherValue');
            });

            it('does subscribe/unsubscribe', function () {
                var unsubFunc = jasmine.createSpy('unsubscribe');
                telemetryProvider.subscribe.andReturn(unsubFunc);
                telemetryProvider.supportsSubscribe.andReturn(true);
                telemetryAPI.addProvider(telemetryProvider);

                var callback = jasmine.createSpy('callback');
                var unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                expect(telemetryProvider.subscribe.calls.length).toBe(1);
                unsubscribe();

                unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                expect(telemetryProvider.subscribe.calls.length).toBe(2);
                unsubscribe();
            });

            it('subscribes for different object', function () {
                var unsubFuncs = [];
                var notifiers = [];
                telemetryProvider.supportsSubscribe.andReturn(true);
                telemetryProvider.subscribe.andCallFake(function (obj, cb) {
                    var unsubFunc = jasmine.createSpy('unsubscribe ' + unsubFuncs.length);
                    unsubFuncs.push(unsubFunc);
                    notifiers.push(cb);
                    return unsubFunc;
                });
                telemetryAPI.addProvider(telemetryProvider);

                var otherDomainObject = JSON.parse(JSON.stringify(domainObject));
                otherDomainObject.identifier.namespace = 'other';

                var callback = jasmine.createSpy('callback');
                var callbacktwo = jasmine.createSpy('callback two');

                var unsubscribe = telemetryAPI.subscribe(domainObject, callback);
                var unsubscribetwo = telemetryAPI.subscribe(otherDomainObject, callbacktwo);

                expect(telemetryProvider.subscribe.calls.length).toBe(2);

                notifiers[0]('someValue');
                expect(callback).toHaveBeenCalledWith('someValue');
                expect(callbacktwo).not.toHaveBeenCalledWith('someValue');

                notifiers[1]('anotherValue');
                expect(callback).not.toHaveBeenCalledWith('anotherValue');
                expect(callbacktwo).toHaveBeenCalledWith('anotherValue');

                unsubscribe();
                expect(unsubFuncs[0]).toHaveBeenCalled();
                expect(unsubFuncs[1]).not.toHaveBeenCalled();

                unsubscribetwo();
                expect(unsubFuncs[1]).toHaveBeenCalled();
            });

            it('sends requests to matching providers', function () {
                var telemPromise = Promise.resolve([]);
                telemetryProvider.supportsRequest.andReturn(true);
                telemetryProvider.request.andReturn(telemPromise);
                telemetryAPI.addProvider(telemetryProvider);

                var result = telemetryAPI.request(domainObject);
                expect(result).toBe(telemPromise);
                expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(
                    domainObject,
                    jasmine.any(Object)
                );
                expect(telemetryProvider.request).toHaveBeenCalledWith(
                    domainObject,
                    jasmine.any(Object)
                );
            });

            it('generates default request options', function () {
                telemetryProvider.supportsRequest.andReturn(true);
                telemetryAPI.addProvider(telemetryProvider);

                telemetryAPI.request(domainObject);
                expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 0,
                        end: 1,
                        domain: 'system'
                    }
                );

                expect(telemetryProvider.request).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 0,
                        end: 1,
                        domain: 'system'
                    }
                );

                telemetryProvider.supportsRequest.reset();
                telemetryProvider.request.reset();

                telemetryAPI.request(domainObject, {});
                expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 0,
                        end: 1,
                        domain: 'system'
                    }
                );

                expect(telemetryProvider.request).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 0,
                        end: 1,
                        domain: 'system'
                    }
                );
            });

            it('does not overwrite existing request options', function () {
                telemetryProvider.supportsRequest.andReturn(true);
                telemetryAPI.addProvider(telemetryProvider);

                telemetryAPI.request(domainObject, {
                    start: 20,
                    end: 30,
                    domain: 'someDomain'
                });

                expect(telemetryProvider.supportsRequest).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 20,
                        end: 30,
                        domain: 'someDomain'
                    }
                );

                expect(telemetryProvider.request).toHaveBeenCalledWith(
                    jasmine.any(Object),
                    {
                        start: 20,
                        end: 30,
                        domain: 'someDomain'
                    }
                );
            });
        });
    });
});

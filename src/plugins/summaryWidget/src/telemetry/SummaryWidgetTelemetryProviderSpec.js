define([
    './SummaryWidgetTelemetryProvider'
], function (
    SummaryWidgetTelemetryProvider
) {

    describe('SummaryWidgetTelemetryProvider', function () {
        var telemObjectA;
        var telemObjectB;
        var summaryWidgetObject;
        var openmct;
        var telemUnsubscribes;
        var unobserver;
        var composition;
        var telemetryProvider;
        var loader;

        beforeEach(function () {
            telemObjectA = {
                identifier: {
                    namespace: 'a',
                    key: 'telem'
                }
            };
            telemObjectB = {
                identifier: {
                    namespace: 'b',
                    key: 'telem'
                }
            };
            summaryWidgetObject = {
                name: "Summary Widget",
                type: "summary-widget",
                identifier: {
                    namespace: 'base',
                    key: 'widgetId'
                },
                composition: [
                    'a:telem',
                    'b:telem'
                ],
                configuration: {
                    ruleOrder: [
                        "default",
                        "rule0",
                        "rule1"
                    ],
                    ruleConfigById: {
                        "default": {
                            name: "safe",
                            label: "Don't Worry",
                            message: "It's Ok",
                            id: "default",
                            icon: "a-ok",
                            style: {
                                "color": "#ffffff",
                                "background-color": "#38761d",
                                "border-color": "rgba(0,0,0,0)"
                            },
                            conditions: [
                                {
                                    object: "",
                                    key: "",
                                    operation: "",
                                    values: []
                                }
                            ],
                            trigger: "any"
                        },
                        "rule0": {
                            name: "A High",
                            label: "Start Worrying",
                            message: "A is a little high...",
                            id: "rule0",
                            icon: "a-high",
                            style: {
                                "color": "#000000",
                                "background-color": "#ffff00",
                                "border-color": "rgba(1,1,0,0)"
                            },
                            conditions: [
                                {
                                    object: "a:telem",
                                    key: "measurement",
                                    operation: "greaterThan",
                                    values: [
                                        50
                                    ]
                                }
                            ],
                            trigger: "any"
                        },
                        rule1: {
                            name: "B Low",
                            label: "WORRY!",
                            message: "B is Low",
                            id: "rule1",
                            icon: "b-low",
                            style: {
                                "color": "#ff00ff",
                                "background-color": "#ff0000",
                                "border-color": "rgba(1,0,0,0)"
                            },
                            conditions: [
                                {
                                    object: "b:telem",
                                    key: "measurement",
                                    operation: "lessThan",
                                    values: [
                                        10
                                    ]
                                }
                            ],
                            trigger: "any"
                        }
                    }
                }
            };
            openmct = {
                objects: jasmine.createSpyObj('objectAPI', [
                    'get',
                    'observe'
                ]),
                telemetry: jasmine.createSpyObj('telemetryAPI', [
                    'getMetadata',
                    'getFormatMap',
                    'request',
                    'subscribe',
                    'addProvider'
                ]),
                composition: jasmine.createSpyObj('compositionAPI', [
                    'get'
                ]),
                time: jasmine.createSpyObj('timeAPI', [
                    'getAllTimeSystems',
                    'timeSystem'
                ])
            };


            openmct.time.getAllTimeSystems.andReturn([{key: 'timestamp'}]);
            openmct.time.timeSystem.andReturn({key: 'timestamp'});


            unobserver = jasmine.createSpy('unobserver');
            openmct.objects.observe.andReturn(unobserver);


            composition = jasmine.createSpyObj('compositionCollection', [
                'on',
                'off',
                'load'
            ]);

            function notify(eventName, a, b) {
                composition.on.calls.filter(function (c) {
                    return c.args[0] === eventName;
                }).forEach(function (c) {
                    if (c.args[2]) { // listener w/ context.
                        c.args[1].call(c.args[2], a, b);
                    } else { // listener w/o context.
                        c.args[1](a, b);
                    }
                });
            }

            loader = {};
            loader.promise = new Promise(function (resolve, reject) {
                loader.resolve = resolve;
                loader.reject = reject;
            });

            composition.load.andCallFake(function () {
                setTimeout(function () {
                    notify('add', telemObjectA);
                    setTimeout(function () {
                        notify('add', telemObjectB);
                        setTimeout(function () {
                            loader.resolve();
                            setTimeout(function () {
                                loader.loaded = true;
                            });
                        });
                    });
                });
                return loader.promise;
            });
            openmct.composition.get.andReturn(composition);


            telemUnsubscribes = [];
            openmct.telemetry.subscribe.andCallFake(function () {
                var unsubscriber = jasmine.createSpy('unsubscriber' + telemUnsubscribes.length);
                telemUnsubscribes.push(unsubscriber);
                return unsubscriber;
            });

            openmct.telemetry.getMetadata.andCallFake(function (object) {
                return {
                    name: 'fake metadata manager',
                    object: object,
                    keys: ['timestamp', 'measurement']
                };
            });

            openmct.telemetry.getFormatMap.andCallFake(function (metadata) {
                expect(metadata.name).toBe('fake metadata manager');
                return {
                    metadata: metadata,
                    timestamp: {
                        parse: function (datum) {
                            return datum.t;
                        }
                    },
                    measurement: {
                        parse: function (datum) {
                            return datum.m;
                        }
                    }
                };
            });
            telemetryProvider = new SummaryWidgetTelemetryProvider(openmct);
        });

        it("supports subscription for summary widgets", function () {
            expect(telemetryProvider.supportsSubscribe(summaryWidgetObject))
                .toBe(true);
        });

        it("supports requests for summary widgets", function () {
            expect(telemetryProvider.supportsRequest(summaryWidgetObject))
                .toBe(true);
        });

        it("does not support other requests or subscriptions", function () {
            expect(telemetryProvider.supportsSubscribe(telemObjectA))
                .toBe(false);
            expect(telemetryProvider.supportsRequest(telemObjectA))
                .toBe(false);
        });

        it("Returns no results for basic requests", function () {
            var result;
            telemetryProvider.request(summaryWidgetObject, {})
                .then(function (r) {
                    result = r;
                });
            waitsFor(function () {
                return !!result;
            });
            runs(function () {
                expect(result).toEqual([]);
            });
        });

        it('provides realtime telemetry', function () {
            var callback = jasmine.createSpy('callback');
            telemetryProvider.subscribe(summaryWidgetObject, callback);

            waitsFor(function () {
                return loader.loaded;
            });

            runs(function () {
                expect(openmct.telemetry.subscribe.calls.length).toBe(2);
                expect(openmct.telemetry.subscribe)
                    .toHaveBeenCalledWith(telemObjectA, jasmine.any(Function));
                expect(openmct.telemetry.subscribe)
                    .toHaveBeenCalledWith(telemObjectB, jasmine.any(Function));

                var aCallback = openmct.telemetry.subscribe.calls[0].args[1];
                var bCallback = openmct.telemetry.subscribe.calls[1].args[1];

                aCallback({
                    t: 123,
                    m: 25
                });
                expect(callback).not.toHaveBeenCalled();
                bCallback({
                    t: 123,
                    m: 25
                });
                expect(callback).toHaveBeenCalledWith({
                    timestamp: 123,
                    ruleLabel: "Don't Worry",
                    ruleName: "safe",
                    message: "It's Ok",
                    ruleIndex: 0,
                    backgroundColor: '#38761d',
                    textColor: '#ffffff',
                    borderColor: 'rgba(0,0,0,0)',
                    icon: 'a-ok'
                });
                callback.reset();
                aCallback({
                    t: 140,
                    m: 55
                });
                expect(callback).toHaveBeenCalledWith({
                    timestamp: 140,
                    ruleLabel: "Start Worrying",
                    ruleName: "A High",
                    message: "A is a little high...",
                    ruleIndex: 1,
                    backgroundColor: '#ffff00',
                    textColor: '#000000',
                    borderColor: 'rgba(1,1,0,0)',
                    icon: 'a-high'
                });
                callback.reset();
                bCallback({
                    t: 140,
                    m: -10
                });
                expect(callback).toHaveBeenCalledWith({
                    timestamp: 140,
                    ruleLabel: "WORRY!",
                    ruleName: "B Low",
                    message: "B is Low",
                    ruleIndex: 2,
                    backgroundColor: '#ff0000',
                    textColor: '#ff00ff',
                    borderColor: 'rgba(1,0,0,0)',
                    icon: 'b-low'
                });
                callback.reset();
                aCallback({
                    t: 160,
                    m: 25
                });
                expect(callback).toHaveBeenCalledWith({
                    timestamp: 160,
                    ruleLabel: "WORRY!",
                    ruleName: "B Low",
                    message: "B is Low",
                    ruleIndex: 2,
                    backgroundColor: '#ff0000',
                    textColor: '#ff00ff',
                    borderColor: 'rgba(1,0,0,0)',
                    icon: 'b-low'
                });
                callback.reset();
                bCallback({
                    t: 160,
                    m: 25
                });
                expect(callback).toHaveBeenCalledWith({
                    timestamp: 160,
                    ruleLabel: "Don't Worry",
                    ruleName: "safe",
                    message: "It's Ok",
                    ruleIndex: 0,
                    backgroundColor: '#38761d',
                    textColor: '#ffffff',
                    borderColor: 'rgba(0,0,0,0)',
                    icon: 'a-ok'
                });
            });
        });

        describe('providing lad telemetry', function () {
            var isResolved;
            var resolver;
            var responseDatums;
            var resultsShouldBe;

            beforeEach(function () {
                isResolved = false;
                resolver = jasmine.createSpy('resolved')
                    .andCallFake(function () {
                        isResolved = true;
                    });

                openmct.telemetry.request.andCallFake(function (rObj, options) {
                    expect(rObj).toEqual(jasmine.any(Object));
                    expect(options).toEqual({size: 1, strategy: 'latest', domain: 'timestamp'});
                    expect(responseDatums[rObj.identifier.namespace]).toBeDefined();
                    return Promise.resolve([responseDatums[rObj.identifier.namespace]]);
                });
                responseDatums = {};

                resultsShouldBe = function (results) {
                    telemetryProvider
                        .request(summaryWidgetObject, {size: 1, strategy: 'latest', domain: 'timestamp'})
                        .then(resolver);

                    waitsFor(function () {
                        return isResolved;
                    });

                    runs(function () {
                        expect(resolver).toHaveBeenCalledWith(results);
                    });
                };
            });

            it("returns default when no rule matches", function () {
                responseDatums = {
                    a: {
                        t: 122,
                        m: 25
                    },
                    b: {
                        t: 111,
                        m: 25
                    }
                };

                resultsShouldBe([{
                    timestamp: 122,
                    ruleLabel: "Don't Worry",
                    ruleName: "safe",
                    message: "It's Ok",
                    ruleIndex: 0,
                    backgroundColor: '#38761d',
                    textColor: '#ffffff',
                    borderColor: 'rgba(0,0,0,0)',
                    icon: 'a-ok'
                }]);
            });

            it("returns highest priority when multiple match", function () {
                responseDatums = {
                    a: {
                        t: 131,
                        m: 55
                    },
                    b: {
                        t: 139,
                        m: 5
                    }
                };

                resultsShouldBe([{
                    timestamp: 139,
                    ruleLabel: "WORRY!",
                    ruleName: "B Low",
                    message: "B is Low",
                    ruleIndex: 2,
                    backgroundColor: '#ff0000',
                    textColor: '#ff00ff',
                    borderColor: 'rgba(1,0,0,0)',
                    icon: 'b-low'
                }]);
            });

            it("returns matching rule", function () {
                responseDatums = {
                    a: {
                        t: 144,
                        m: 55
                    },
                    b: {
                        t: 141,
                        m: 15
                    }
                };

                resultsShouldBe([{
                    timestamp: 144,
                    ruleLabel: "Start Worrying",
                    ruleName: "A High",
                    message: "A is a little high...",
                    ruleIndex: 1,
                    backgroundColor: '#ffff00',
                    textColor: '#000000',
                    borderColor: 'rgba(1,1,0,0)',
                    icon: 'a-high'
                }]);
            });

        });

    });
});

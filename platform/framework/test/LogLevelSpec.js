/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ['../src/LogLevel'],
    function (LogLevel) {
        "use strict";

        var LOG_METHODS = [
            'error',
            'warn',
            'info',
            'log',
            'debug'
        ];

        describe("The logging level handler", function () {
            var mockLog,
                mockApp,
                mockProvide,
                mockDelegate,
                mockMethods;

            function logAll(v) {
                LOG_METHODS.forEach(function (m) {
                    mockLog[m](v);
                    mockDelegate[m](v);
                });
            }

            function expectCalls(calls, v) {
                LOG_METHODS.forEach(function (m) {
                    if (calls.indexOf(m) > -1) {
                        expect(mockMethods[m]).toHaveBeenCalledWith(v);
                    } else {
                        expect(mockMethods[m]).not.toHaveBeenCalledWith(v);
                    }
                });
            }

            beforeEach(function () {
                mockMethods = jasmine.createSpyObj("levels", LOG_METHODS);
                mockLog = jasmine.createSpyObj('$log', LOG_METHODS);
                mockApp = jasmine.createSpyObj('app', ['config']);
                mockProvide = jasmine.createSpyObj('$provide', ['decorator']);
                mockDelegate = jasmine.createSpyObj('$delegate', LOG_METHODS);

                LOG_METHODS.forEach(function (m) {
                    mockLog[m].andCallFake(mockMethods[m]);
                    mockDelegate[m].andCallFake(mockMethods[m]);
                });

                mockApp.config.andCallFake(function (callback) {
                    callback(mockProvide);
                });

                mockProvide.decorator.andCallFake(function (key, callback) {
                    // Only $log should be configured in any case
                    expect(key).toEqual('$log');
                    callback(mockDelegate);
                });
            });

            it("defaults to 'warn' level", function () {
                new LogLevel("garbage").configure(mockApp, mockLog);
                logAll("test");
                expectCalls(['error', 'warn'], 'test');
            });

            LOG_METHODS.forEach(function (m, i) {
                it("supports log level '" + m + "'", function () {
                    // Note: This is sensitive to ordering of LOG_METHODS,
                    // which needs to be highest-level-first above.
                    var expected = LOG_METHODS.slice(0, i + 1),
                        message = "test " + m;

                    new LogLevel(m).configure(mockApp, mockLog);
                    logAll(message);
                    expectCalls(expected, message);
                });
            });

        });
    }
);
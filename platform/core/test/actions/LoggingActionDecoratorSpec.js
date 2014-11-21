/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * LoggingActionDecoratorSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/actions/LoggingActionDecorator"],
    function (LoggingActionDecorator) {
        "use strict";

        describe("The logging action decorator", function () {
            var mockLog,
                mockAction,
                mockActionService,
                decorator;

            beforeEach(function () {
                mockAction = jasmine.createSpyObj(
                    "action",
                    [ "perform", "getMetadata" ]
                );
                mockActionService = jasmine.createSpyObj(
                    "actionService",
                    [ "getActions" ]
                );
                mockLog = jasmine.createSpyObj(
                    "$log",
                    [ "error", "warn", "info", "debug" ]
                );

                mockActionService.getActions.andReturn([mockAction]);

                decorator = new LoggingActionDecorator(
                    mockLog,
                    mockActionService
                );
            });

            it("logs when actions are performed", function () {
                // Verify precondition
                expect(mockLog.info).not.toHaveBeenCalled();

                // Perform an action, retrieved through the decorator
                decorator.getActions()[0].perform();

                // That should have been logged.
                expect(mockLog.info).toHaveBeenCalled();
            });



        });
    }
);
/*global define,describe,it,xit,expect,beforeEach*/

define(
    ['../../src/actions/PropertiesAction'],
    function (PropertiesAction) {
        "use strict";

        describe("Properties action", function () {
            var captured, model, object, context, input, dialogService, action;

            function capture(k) { return function (v) { captured[k] = v; }; }

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                var capabilities = {
                    type: { getProperties: function () { return []; } },
                    persistence: {},
                    mutation: {}
                };
                model = {};
                input = {};
                object = {
                    getId: function () { return 'test-id'; },
                    getCapability: function (k) { return capabilities[k]; },
                    getModel: function () { return model; }
                };
                context = { someKey: "some value", domainObject: object };
                dialogService = {
                    getUserInput: function () {
                        return mockPromise(input);
                    }
                };
                captured = {};
                action = new PropertiesAction(object, context, dialogService);
            });

            it("persists when an action is performed", function () {

            });

            it("does not persist any changes upon cancel", function () {
//                input = undefined;
//                action.perform();
//                expect(captured.persisted).toBeFalsy();
            });
        });
    }
);

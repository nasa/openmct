/*global define,describe,it,xit,expect,beforeEach,jasmine*/

define(
    ['../../src/actions/PropertiesAction'],
    function (PropertiesAction) {
        "use strict";

        describe("Properties action", function () {
            var capabilities, model, object, context, input, dialogService, action;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                capabilities = {
                    type: { getProperties: function () { return []; } },
                    persistence: jasmine.createSpyObj("persistence", ["persist"]),
                    mutation: jasmine.createSpy("mutation")
                };
                model = {};
                input = {};
                object = {
                    getId: function () { return 'test-id'; },
                    getCapability: function (k) { return capabilities[k]; },
                    getModel: function () { return model; },
                    useCapability: function (k, v) { return capabilities[k](v); },
                    hasCapability: function () { return true; }
                };
                context = { someKey: "some value", domainObject: object };
                dialogService = {
                    getUserInput: function () {
                        return mockPromise(input);
                    }
                };

                capabilities.mutation.andReturn(true);

                action = new PropertiesAction(dialogService, context);
            });

            it("persists when an action is performed", function () {
                action.perform();
                expect(capabilities.persistence.persist)
                    .toHaveBeenCalled();
            });

            it("does not persist any changes upon cancel", function () {
                input = undefined;
                action.perform();
                expect(capabilities.persistence.persist)
                    .not.toHaveBeenCalled();
            });

            it("mutates an object when performed", function () {
                action.perform();
                expect(capabilities.mutation).toHaveBeenCalled();
                capabilities.mutation.mostRecentCall.args[0]({});
            });

            it("is only applicable when a domain object is in context", function () {
                expect(PropertiesAction.appliesTo(context)).toBeTruthy();
                expect(PropertiesAction.appliesTo({})).toBeFalsy();
            });
        });
    }
);

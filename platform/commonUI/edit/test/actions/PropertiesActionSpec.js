/*global define,describe,it,xit,expect,beforeEach*/

define(
    ['../../src/actions/PropertiesAction'],
    function (PropertiesAction) {
        "use strict";

        describe("Properties action", function () {
            var captured, model, object, context, input, dialogService, action;

            function capture(k) { return function (v) { captured[k] = v; }; }

            beforeEach(function () {
                var capabilities = {
                    type: { getProperties: function () { return []; } },
                    persistence: {
                        persist: function () {
                            captured.persisted = true;
                            return promises.as(true);
                        }
                    },
                    mutation: {
                        mutate: function (c) {
                            captured.mutated = true;
                            return promises.as(c(model));
                        }
                    }
                };
                model = {};
                input = {};
                object = {
                    getId: function () { return 'test-id'; },
                    getCapability: function (k) {
                        return promises.as(capabilities[k]);
                    },
                    getModel: function () { return model; }
                };
                context = { someKey: "some value "};
                dialogService = {
                    getUserInput: function () {
                        return promises.as(input);
                    }
                };
                captured = {};
                action = new PropertiesAction(object, context, dialogService);
            });


            it("provides action metadata", function () {
                var metadata = action.metadata();
                expect(metadata.context).toEqual(context);
                expect(metadata.category).toEqual('contextual');
            });

            it("persists when an action is performed", function () {
                action.perform();
                expect(captured.persisted).toBeTruthy();
            });

            it("does not persist any changes upon cancel", function () {
                input = undefined;
                action.perform();
                expect(captured.persisted).toBeFalsy();
            });
        });
    }
);

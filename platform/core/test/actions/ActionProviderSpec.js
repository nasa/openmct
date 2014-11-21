/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

/**
 * ActionProviderSpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/actions/ActionProvider"],
    function (ActionProvider) {
        "use strict";

        describe("The action provider", function () {
            var actions,
                actionProvider;

            function SimpleAction() {
                return { perform: function () { return "simple"; } };
            }

            function CategorizedAction() {
                return { perform: function () { return "categorized"; } };
            }
            CategorizedAction.category = "someCategory";

            function KeyedAction() {
                return { perform: function () { return "keyed"; } };
            }
            KeyedAction.key = "someKey";

            function CategorizedKeyedAction() {
                return { perform: function () { return "both"; } };
            }
            CategorizedKeyedAction.key = "someKey";
            CategorizedKeyedAction.category = "someCategory";

            function MetadataAction() {
                return {
                    perform: function () { return "metadata"; },
                    getMetadata: function () { return "custom metadata"; }
                };
            }
            MetadataAction.key = "metadata";

            beforeEach(function () {
                actions = [
                    SimpleAction,
                    CategorizedAction,
                    KeyedAction,
                    CategorizedKeyedAction,
                    MetadataAction
                ];
                actionProvider = new ActionProvider(actions);
            });

            it("exposes provided action extensions", function () {
                var provided = actionProvider.getActions();

                // Should have gotten all actions
                expect(provided.length).toEqual(actions.length);

                // Verify that this was the action we expected
                expect(provided[0].perform()).toEqual("simple");
            });

            it("matches provided actions by key", function () {
                var provided = actionProvider.getActions({ key: "someKey" });

                // Only two should have matched
                expect(provided.length).toEqual(2);

                // Verify that this was the action we expected
                expect(provided[0].perform()).toEqual("keyed");
            });

            it("matches provided actions by category", function () {
                var provided = actionProvider.getActions({ category: "someCategory" });

                // Only two should have matched
                expect(provided.length).toEqual(2);

                // Verify that this was the action we expected
                expect(provided[0].perform()).toEqual("categorized");
            });

            it("matches provided actions by both category and key", function () {
                var provided = actionProvider.getActions({
                    category: "someCategory",
                    key: "someKey"
                });

                // Only two should have matched
                expect(provided.length).toEqual(1);

                // Verify that this was the action we expected
                expect(provided[0].perform()).toEqual("both");
            });

            it("adds a getMetadata method when none is defined", function () {
                var provided = actionProvider.getActions({
                    category: "someCategory",
                    key: "someKey"
                });

                // Should be defined, even though the action didn't define this
                expect(provided[0].getMetadata).toBeDefined();

                // Should have static fields, plus context
                expect(provided[0].getMetadata().context).toEqual({
                    key: "someKey",
                    category: "someCategory"
                });

            });

            it("does not override defined getMetadata methods", function () {
                var provided = actionProvider.getActions({ key: "metadata" });
                expect(provided[0].getMetadata()).toEqual("custom metadata");
            });

        });
    }
);
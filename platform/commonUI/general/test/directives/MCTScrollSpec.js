/*global define,describe,it,expect,jasmine,beforeEach*/
define(
    ['../../src/directives/MCTScroll'],
    function (MCTScroll) {
        "use strict";

        var EVENT_PROPERTY = "testProperty",
            ATTRIBUTE = "testAttribute",
            EXPRESSION = "some.expression";


        // MCTScroll is the commonality between mct-scroll-x and
        // mct-scroll-y; it gets the event property to watch and
        // the attribute which contains the associated assignable
        // expression.
        describe("An mct-scroll-* directive", function () {
            var mockParse,
                mockParsed,
                mockScope,
                mockElement,
                testAttrs,
                mctScroll;

            beforeEach(function () {
                mockParse = jasmine.createSpy('$parse');
                mockParsed = jasmine.createSpy('parsed');
                mockParsed.assign = jasmine.createSpy('assign');

                mockScope = jasmine.createSpyObj('$scope', ['$watch', '$apply']);
                mockElement = [{ testProperty: 42 }];
                mockElement.on = jasmine.createSpy('on');

                mockParse.andReturn(mockParsed);

                testAttrs = {};
                testAttrs[ATTRIBUTE] = EXPRESSION;

                mctScroll = new MCTScroll(
                    mockParse,
                    EVENT_PROPERTY,
                    ATTRIBUTE
                );
                mctScroll.link(mockScope, mockElement, testAttrs);
            });

            it("is available for attributes", function () {
                expect(mctScroll.restrict).toEqual('A');
            });

            it("does not create an isolate scope", function () {
                expect(mctScroll.scope).toBeUndefined();
            });

            it("watches for changes in observed expression", function () {
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    EXPRESSION,
                    jasmine.any(Function)
                );
                // Should have been only watch (other tests need this to be true)
                expect(mockScope.$watch.calls.length).toEqual(1);
            });

            it("listens for scroll events", function () {
                expect(mockElement.on).toHaveBeenCalledWith(
                    'scroll',
                    jasmine.any(Function)
                );
                // Should have been only listener (other tests need this to be true)
                expect(mockElement.on.calls.length).toEqual(1);
            });

            it("publishes initial scroll state", function () {
                expect(mockParse).toHaveBeenCalledWith(EXPRESSION);
                expect(mockParsed.assign).toHaveBeenCalledWith(mockScope, 42);
            });

            it("updates scroll state when scope changes", function () {
                mockScope.$watch.mostRecentCall.args[1](64);
                expect(mockElement[0].testProperty).toEqual(64);
            });

            it("updates scope when scroll state changes", function () {
                mockElement[0].testProperty = 12321;
                mockElement.on.mostRecentCall.args[1]({ target: mockElement[0] });
                expect(mockParsed.assign).toHaveBeenCalledWith(mockScope, 12321);
                expect(mockScope.$apply).toHaveBeenCalledWith(EXPRESSION);
            });

            // This would trigger an infinite digest exception
            it("does not call $apply during construction", function () {
                expect(mockScope.$apply).not.toHaveBeenCalled();
            });

        });
    }
);
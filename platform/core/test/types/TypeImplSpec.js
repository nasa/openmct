/*global define,describe,it,expect,beforeEach*/

define(
    ['../../src/types/TypeImpl'],
    function (typeImpl) {
        "use strict";

        describe("Type definition wrapper", function () {
            var testTypeDef,
                type;

            beforeEach(function () {
                testTypeDef = {
                    key: 'test-type',
                    name: 'Test Type',
                    description: 'A type, for testing',
                    glyph: 't',
                    inherits: ['test-parent-1', 'test-parent-2']
                };
                type = typeImpl(testTypeDef);
            });

            it("exposes key from definition", function () {
                expect(type.getKey()).toEqual('test-type');
            });

            it("exposes name from definition", function () {
                expect(type.getName()).toEqual('Test Type');
            });

            it("exposes description from definition", function () {
                expect(type.getDescription()).toEqual('A type, for testing');
            });

            it("exposes glyph from definition", function () {
                expect(type.getGlyph()).toEqual('t');
            });

            it("exposes its underlying type definition", function () {
                expect(type.getDefinition()).toEqual(testTypeDef);
            });

            it("supports instance-of checks by type key", function () {
                expect(type.instanceOf('test-parent-1')).toBeTruthy();
                expect(type.instanceOf('test-parent-2')).toBeTruthy();
                expect(type.instanceOf('some-other-type')).toBeFalsy();
            });

            it("supports instance-of checks by specific type key", function () {
                expect(type.instanceOf('test-type')).toBeTruthy();
            });

            it("supports instance-of checks by type object", function () {
                expect(type.instanceOf({
                    getKey: function () { return 'test-parent-1'; }
                })).toBeTruthy();
                expect(type.instanceOf({
                    getKey: function () { return 'some-other-type'; }
                })).toBeFalsy();
            });

            it("correctly recognizes instance-of checks upon itself", function () {
                expect(type.instanceOf(type)).toBeTruthy();
            });

            it("recognizes that all types are instances of the undefined type", function () {
                expect(type.instanceOf()).toBeTruthy();
                expect(type.instanceOf({ getKey: function () {} })).toBeTruthy();
            });
        });
    }
);
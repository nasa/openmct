/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(['./NumberFormat'], function (NumberFormat) {
    describe("The NumberFormat class", function () {
        var format;
        beforeEach(function () {
            format = new NumberFormat();
        });

        it("The format function takes a string and produces a number", function () {
            var text = format.format(1);
            expect(text).toBe("1");
            expect(typeof text).toBe("string");
        });

        it("The parse function takes a string and produces a number", function () {
            var number = format.parse("1");
            expect(number).toBe(1);
            expect(typeof number).toBe("number");
        });

        it("validates that the input is a number", function () {
            expect(format.validate("1")).toBe(true);
            expect(format.validate(1)).toBe(true);
            expect(format.validate("1.1")).toBe(true);
            expect(format.validate("abc")).toBe(false);
        });
    });
});

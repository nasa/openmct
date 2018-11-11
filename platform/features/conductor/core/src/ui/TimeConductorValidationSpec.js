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

define(['./TimeConductorValidation'], function (TimeConductorValidation) {
    describe("The Time Conductor Validation class", function () {
        var timeConductorValidation,
            mockTimeConductor;

        beforeEach(function () {
            mockTimeConductor = jasmine.createSpyObj("timeConductor", [
                "validateBounds",
                "bounds"
            ]);
            timeConductorValidation = new TimeConductorValidation(mockTimeConductor);
        });

        describe("Validates start and end values using Time Conductor", function () {
            beforeEach(function () {
                var mockBounds = {
                    start: 10,
                    end: 20
                };

                mockTimeConductor.bounds.and.returnValue(mockBounds);

            });
            it("Validates start values using Time Conductor", function () {
                var startValue = 30;
                timeConductorValidation.validateStart(startValue);
                expect(mockTimeConductor.validateBounds).toHaveBeenCalled();
            });
            it("Validates end values using Time Conductor", function () {
                var endValue = 40;
                timeConductorValidation.validateEnd(endValue);
                expect(mockTimeConductor.validateBounds).toHaveBeenCalled();
            });
        });

        it("Validates that start Offset is valid number > 0", function () {
            expect(timeConductorValidation.validateStartOffset(-1)).toBe(false);
            expect(timeConductorValidation.validateStartOffset("abc")).toBe(false);
            expect(timeConductorValidation.validateStartOffset("1")).toBe(true);
            expect(timeConductorValidation.validateStartOffset(1)).toBe(true);
        });

        it("Validates that end Offset is valid number >= 0", function () {
            expect(timeConductorValidation.validateEndOffset(-1)).toBe(false);
            expect(timeConductorValidation.validateEndOffset("abc")).toBe(false);
            expect(timeConductorValidation.validateEndOffset("1")).toBe(true);
            expect(timeConductorValidation.validateEndOffset(0)).toBe(true);
            expect(timeConductorValidation.validateEndOffset(1)).toBe(true);
        });
    });
});

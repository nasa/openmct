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

define(['./TimeConductorValidation'], (TimeConductorValidation) => {
    describe("The Time Conductor Validation class", () => {
        let timeConductorValidation,
            mockTimeConductor;

        beforeEach( () => {
            mockTimeConductor = jasmine.createSpyObj("timeConductor", [
                "validateBounds",
                "bounds"
            ]);
            timeConductorValidation = new TimeConductorValidation(mockTimeConductor);
        });

        describe("Validates start and end values using Time Conductor", () => {
            beforeEach( () => {
                let mockBounds = {
                    start: 10,
                    end: 20
                };

                mockTimeConductor.bounds.andReturn(mockBounds);

            });
            it("Validates start values using Time Conductor", () => {
                let startValue = 30;
                timeConductorValidation.validateStart(startValue);
                expect(mockTimeConductor.validateBounds).toHaveBeenCalled();
            });
            it("Validates end values using Time Conductor", () => {
                let endValue = 40;
                timeConductorValidation.validateEnd(endValue);
                expect(mockTimeConductor.validateBounds).toHaveBeenCalled();
            });
        });

        it("Validates that start delta is valid number > 0", () => {
            expect(timeConductorValidation.validateStartDelta(-1)).toBe(false);
            expect(timeConductorValidation.validateStartDelta("abc")).toBe(false);
            expect(timeConductorValidation.validateStartDelta("1")).toBe(true);
            expect(timeConductorValidation.validateStartDelta(1)).toBe(true);
        });

        it("Validates that end delta is valid number >= 0", () => {
            expect(timeConductorValidation.validateEndDelta(-1)).toBe(false);
            expect(timeConductorValidation.validateEndDelta("abc")).toBe(false);
            expect(timeConductorValidation.validateEndDelta("1")).toBe(true);
            expect(timeConductorValidation.validateEndDelta(0)).toBe(true);
            expect(timeConductorValidation.validateEndDelta(1)).toBe(true);
        });
    });
});

/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import UTCTimeFormat from './UTCTimeFormat.js';

describe('the plugin', () => {
    const UTC_KEY = 'utc';
    const JUNK = 'junk';
    const MOON_LANDING_TIMESTAMP = -14256000000;
    const MOON_LANDING_DEFAULT_FORMAT = '1969-07-20 00:00:00.000Z';
    const MOON_LANDING_FORMATTED_DATES = [
        '1969-07-20 00:00:00.000',
        '1969-07-20 00:00:00.000+00:00',
        '1969-07-20 00:00:00',
        '1969-07-20 00:00',
        '1969-07-20'
    ];

    let utcFormatter;

    beforeEach(() => {
        utcFormatter = new UTCTimeFormat();
    });

    describe('creates a new UTC based formatter', function () {
        it("with the key 'utc'", () => {
            expect(utcFormatter.key).toBe(UTC_KEY);
        });

        it('that will format a timestamp in UTC Standard Date', () => {
            //default format
            expect(utcFormatter.format(MOON_LANDING_TIMESTAMP)).toBe(
                MOON_LANDING_DEFAULT_FORMAT
            );

            //possible formats
            const formattedDates = utcFormatter.DATE_FORMATS.map((format) =>
                utcFormatter.format(MOON_LANDING_TIMESTAMP, format)
            );

            expect(formattedDates).toEqual(MOON_LANDING_FORMATTED_DATES);
        });

        it('that will parse an UTC Standard Date into milliseconds', () => {
            //default format
            expect(utcFormatter.parse(MOON_LANDING_DEFAULT_FORMAT)).toBe(
                MOON_LANDING_TIMESTAMP
            );

            //possible formats
            const parsedDates = MOON_LANDING_FORMATTED_DATES.map((format) =>
                utcFormatter.parse(format)
            );

            parsedDates.forEach((v) => expect(v).toEqual(MOON_LANDING_TIMESTAMP));
        });

        it('that will validate correctly', () => {
            //default format
            expect(utcFormatter.validate(MOON_LANDING_DEFAULT_FORMAT)).toBe(
                true
            );

            //possible formats
            const validatedFormats = MOON_LANDING_FORMATTED_DATES.map((date) =>
                utcFormatter.validate(date)
            );

            validatedFormats.forEach((v) => expect(v).toBe(true));

            //junk
            expect(utcFormatter.validate(JUNK)).toBe(false);
        });
    });
});

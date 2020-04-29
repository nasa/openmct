/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

import { keyBy, flatten, flattenDeep, isEmpty } from 'arrayUtils';
const getArrayDepth = (obj => {
    if (Array.isArray(obj)) {
        return 1 + Math.max(...obj.map(t => getArrayDepth(t)));
    } else {
        return 0;
    }
});

describe("The keyBy method", function () {

    const input = [
        {
            "key":"name",
            "name":"Name",
            "source":"name",
            "hints":
            {
                "priority": 0
            }
        },
        {
            "key":"utc",
            "name":"Timestamp",
            "format":"utc",
            "hints":
            {
                "domain": 1,
                "priority": 1
            },
            "source":"utc"
        },
        {
            "key":"message",
            "name":"Message",
            "format":"string",
            "hints":
            {
                "range": 0,
                "priority": 2
            },
            "source":"message"
        }
    ];

    const output = keyBy(input, 'key');

    it('returns an object', () => {
        expect(typeof output).toEqual('object');
    });

    describe("returns an object", function () {

        it('with the input key values as key names', () => {
            expect(Object.keys(output)).toEqual(input.map(obj => obj.key));
        });

        it('with the input array objects as as properties of the name keys', () => {
            expect(Object.values(output)).toEqual(input);
        });
    });

});
describe("The flatten method", function () {

    it('returns a flat array', () => {
        expect(getArrayDepth(flatten([[1,2,3]]))).toEqual(1);
    });

    it('fails to return a flat array when passed an array deeper than two levels', () => {
        expect(getArrayDepth(flatten([[[1,2,3]]]))).not.toEqual(1);
    });


});
describe("The flattenDeep method", function () {

    it('returns a flat array when passed an array deeper than two levels', () => {
        expect(getArrayDepth(flattenDeep([[[1,[2,3]]]]))).toEqual(1);
    });


});
describe("The isEmpty method", function () {

    it('returns true when passed an empty array', () => {
        expect(isEmpty([])).toBeTrue();
    });

    it('returns false when passed a non-empty array', () => {
        expect(isEmpty([1,2,3])).not.toBeTrue();
    });

    it('returns true when passed an empty object', () => {
        expect(isEmpty({})).toBeTrue();
    });

    it('returns false when passed a non-empty object', () => {
        expect(isEmpty({1:1})).not.toBeTrue();
    });

    it('returns false when passed a Set', () => {
        expect(isEmpty(new Set())).not.toBeTrue();
    });

    it('returns false when passed a Map', () => {
        expect(isEmpty(new Map())).not.toBeTrue();
    });
});

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

export const COLOR_PALETTE = [
    [0x00, 0x37, 0xFF],
    [0xF0, 0x60, 0x00],
    [0x00, 0x70, 0x40],
    [0xFB, 0x49, 0x49],
    [0xC8, 0x00, 0xCF],
    [0x55, 0x77, 0xF2],
    [0xFF, 0xA6, 0x3D],
    [0x05, 0xA3, 0x00],
    [0xF0, 0x00, 0x6C],
    [0x77, 0x17, 0x7A],
    [0x23, 0xA9, 0xDB],
    [0xFA, 0xF0, 0x6F],
    [0x4E, 0xF0, 0x48],
    [0xAD, 0x50, 0x72],
    [0x94, 0x25, 0xEA],
    [0x21, 0x87, 0x82],
    [0x8F, 0x6E, 0x47],
    [0xf0, 0x59, 0xcb],
    [0x34, 0xB6, 0x7D],
    [0x6A, 0x36, 0xFF],
    [0x56, 0xF0, 0xE8],
    [0xA1, 0x8C, 0x1C],
    [0xCB, 0xE1, 0x44],
    [0xFF, 0x84, 0x9E],
    [0xB7, 0x79, 0xE7],
    [0x8C, 0xC9, 0xFD],
    [0xDB, 0xAA, 0x6E],
    [0xB8, 0xDF, 0x97],
    [0xFF, 0xBC, 0xDA],
    [0xD3, 0xB6, 0xDE]
];

export function isDefaultColor(color) {
    const a = color.asIntegerArray();

    return COLOR_PALETTE.some(function (b) {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    });
}

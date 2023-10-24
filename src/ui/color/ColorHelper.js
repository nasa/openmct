/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
  [0x43, 0xb0, 0xff],
  [0xf0, 0x60, 0x00],
  [0x00, 0x70, 0x40],
  [0xfb, 0x49, 0x49],
  [0xc8, 0x00, 0xcf],
  [0x55, 0x77, 0xf2],
  [0xff, 0xa6, 0x3d],
  [0x05, 0xa3, 0x00],
  [0xf0, 0x00, 0x6c],
  [0xac, 0x54, 0xae],
  [0x23, 0xa9, 0xdb],
  [0xc7, 0xbe, 0x52],
  [0x5a, 0xbd, 0x56],
  [0xad, 0x50, 0x72],
  [0x94, 0x25, 0xea],
  [0x21, 0x87, 0x82],
  [0x8f, 0x6e, 0x47],
  [0xf0, 0x59, 0xcb],
  [0x34, 0xb6, 0x7d],
  [0x7f, 0x52, 0xff],
  [0x46, 0xc7, 0xc0],
  [0xa1, 0x8c, 0x1c],
  [0x95, 0xb1, 0x26],
  [0xff, 0x84, 0x9e],
  [0xb7, 0x79, 0xe7],
  [0x8c, 0xc9, 0xfd],
  [0xdb, 0xaa, 0x6e],
  [0x93, 0xb5, 0x77],
  [0xff, 0xbc, 0xda],
  [0xd3, 0xb6, 0xde]
];

export function isDefaultColor(color) {
  const a = color.asIntegerArray();

  return COLOR_PALETTE.some(function (b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  });
}

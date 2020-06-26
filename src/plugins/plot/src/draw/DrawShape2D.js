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

define([], function () {
    const draw = {
        point: {
            label: 'Point',
            method: function (x, y, size) {
                const offset = size / 2;
                this.c2d.fillRect(x - offset, y - offset, size, size);
            }
        },
        circle: {
            label: 'Circle',
            method: function (x, y, size) {
                const radius = size / 2;

                this.c2d.beginPath();
                this.c2d.arc(x, y, radius, 0, 2 * Math.PI, false);
                this.c2d.closePath();
                this.c2d.fill();
            }
        },
        cross: {
            label: 'Cross',
            method: function (xOrigin, yOrigin, size) {
                const offset = size / 2;
                const x = xOrigin - offset;
                const y = yOrigin - offset;

                this.c2d.fillRect(x + size, y, size, size);
                this.c2d.fillRect(x, y + size, size, size);
                this.c2d.fillRect(x - size, y, size, size);
                this.c2d.fillRect(x, y - size, size, size);
            }
        },
        star: {
            label: 'Star',
            method: function (xOrigin, yOrigin, size) {
                const spikes = 5;
                const step = Math.PI / spikes;
                const outerRadius = size * 2;
                const innerRadius = size;
                let rot = Math.PI / 2 * 3;
                let x = xOrigin, y = yOrigin;

                this.c2d.beginPath();
                this.c2d.moveTo(xOrigin, yOrigin - outerRadius)

                for (let i = 0; i < spikes; i++) {
                    x = xOrigin + Math.cos(rot) * outerRadius;
                    y = yOrigin + Math.sin(rot) * outerRadius;
                    this.c2d.lineTo(x, y)
                    rot += step

                    x = xOrigin + Math.cos(rot) * innerRadius;
                    y = yOrigin + Math.sin(rot) * innerRadius;
                    this.c2d.lineTo(x, y)
                    rot += step
                }

                this.c2d.lineTo(xOrigin, yOrigin - outerRadius)
                this.c2d.closePath();
                this.c2d.fill();
            }
        }
    };

    return draw;
});

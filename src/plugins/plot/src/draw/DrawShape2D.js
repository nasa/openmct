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
        cross: {
            label: 'Cross',
            method: function (originalX, originalY, size) {
                const offset = size / 2;
                const x = originalX - offset;
                const y = originalY - offset;

                this.c2d.fillRect(x + size, y, size, size);
                this.c2d.fillRect(x, y + size, size, size);
                this.c2d.fillRect(x - size, y, size, size);
                this.c2d.fillRect(x, y - size, size, size);
            }
        },
        star: {
            label: 'Star',
            method: function (cx, cy, size) {
                const spikes = 5;
                const step = Math.PI / spikes;
                const outerRadius = size * 2;
                const innerRadius = size;
                let rot = Math.PI / 2 * 3;
                let x = cx, y = cy;

                this.c2d.beginPath();
                this.c2d.moveTo(cx, cy - outerRadius)

                for (let i = 0; i < spikes; i++) {
                    x = cx + Math.cos(rot) * outerRadius;
                    y = cy + Math.sin(rot) * outerRadius;
                    this.c2d.lineTo(x, y)
                    rot += step

                    x = cx + Math.cos(rot) * innerRadius;
                    y = cy + Math.sin(rot) * innerRadius;
                    this.c2d.lineTo(x, y)
                    rot += step
                }

                this.c2d.lineTo(cx, cy - outerRadius)
                this.c2d.closePath();
                this.c2d.fill();
            }
        }
    };

    return draw;
});

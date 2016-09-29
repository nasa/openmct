/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define(['zepto'], function ($) {
    function ClickElsewhereGesture(body) {
        this.$body = $(body);
        this.pairs = [];

        this.handleClick = this.handleClick.bind(this);
    }

    ClickElsewhereGesture.prototype.handleClick = function (event) {
        this.pairs.forEach(function (pair) {
            var x = event.clientX,
                y = event.clientY,
                rect = pair.element.getBoundingClientRect(),
                xMin = rect.left,
                xMax = xMin + rect.width,
                yMin = rect.top,
                yMax = yMin + rect.height;

            if (x < xMin || x > xMax || y < yMin || y > yMax) {
                pair.callback();
            }
        });
    };

    ClickElsewhereGesture.prototype.apply = function (htmlElement, callback) {
        var pair = {
            element: htmlElement,
            callback: callback
        };

        if (this.pairs.length < 1) {
            this.$body.on('mousedown', this.handleClick);
        }

        this.pairs.push(pair);

        return function () {
            this.pairs = this.pairs.filter(function (p) {
                return p !== pair;
            });

            if (this.pairs.length < 1) {
                this.$body.off('mousedown', this.handleClick);
            }
        }.bind(this);
    };

    return ClickElsewhereGesture;
});

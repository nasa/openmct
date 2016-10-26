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

define(['EventEmitter'], function (EventEmitter) {

    /**
     * Manages selection state for Open MCT
     * @private
     */
    function Selection() {
        EventEmitter.call(this);
        this.selected = [];
    }

    Selection.prototype = Object.create(EventEmitter.prototype);

    Selection.prototype.add = function (context) {
        this.clear(); // Only allow single select as initial simplification
        this.selected.push(context);
        this.emit('change');
    };

    Selection.prototype.remove = function (path) {
        this.selected = this.selected.filter(function (otherPath) {
            return !path.matches(otherPath);
        });
        this.emit('change');
    };

    Selection.prototype.contains = function (path) {
        return this.selected.some(function (otherPath) {
            return path.matches(otherPath);
        });
    };

    Selection.prototype.clear = function () {
        this.selected = [];
        this.emit('change');
    };

    Selection.prototype.primary = function () {
        return this.selected[this.selected.length - 1];
    };

    Selection.prototype.all = function () {
        return this.selected;
    };

    return Selection;
});

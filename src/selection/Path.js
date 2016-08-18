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

define([], function () {
    var NULL_PATH;

    function Path(item, path) {
        this.item = item;
        this.parent = path || NULL_PATH;
    }

    Path.prototype.matches = function (path) {
        return (this.item === path.head()) && this.parent.matches(path.path());
    };

    Path.prototype.head = function () {
        return this.item;
    };

    Path.prototype.depth = function () {
        return 1 + this.parent.depth();
    };

    Path.prototype.tail = function () {
        return this.parent;
    };

    Path.prototype.append = function (item) {
        return new Path(item, this);
    };

    NULL_PATH = new Path(undefined, undefined);
    NULL_PATH.parent = NULL_PATH;
    NULL_PATH.depth = function () {
        return 0;
    };
    NULL_PATH.matches = function (path) {
        return path.depth() === 0;
    };

    return Path;
});

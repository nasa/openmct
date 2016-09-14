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

define(['./Path', 'zepto'], function (Path, $) {
    function ContextManager() {
        this.counter = 0;
        this.paths = {};
    }

    ContextManager.prototype.nextId = function () {
        this.counter += 1;
        return "context-" + this.counter;
    };

    ContextManager.prototype.path = function (item, htmlElement) {
        var $element = $(htmlElement);
        var id = $element.attr('data-context') || this.nextId();

        $element.attr('data-context', id);

        if (this.paths[id].head() !== item) {
            this.release(htmlElement);
        }

        if (!this.paths[id]) {
            var $parent = $element.closest('[data-context]');
            var parentId = $parent.attr('data-context');
            var parentPath = this.paths[parentId];
            this.paths[id] = new Path(item, parentPath);
        }

        return this.paths[id];
    };

    ContextManager.prototype.release = function (htmlElement) {
        var $element = $(htmlElement);
        var id = $element.attr('data-context');

        if (id) {
            delete this.paths[id];
            $element.removeAttr('data-context');
        }
    };

    return ContextManager;
});

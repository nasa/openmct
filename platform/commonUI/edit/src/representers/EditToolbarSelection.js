/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Tracks selection state for editable views. Selection is
         * implemented such that (from the toolbar's perspective)
         * up to two objects can be "selected" at any given time:
         *
         * * The view proxy (see the `proxy` method), which provides
         *   an interface for interacting with the view itself (e.g.
         *   for buttons like "Add")
         * * The selection, for single selected elements within the
         *   view.
         *
         * @memberof platform/commonUI/edit
         * @constructor
         */
        function EditToolbarSelection() {
            this.selection = [{}];
            this.selecting = false;
            this.selectedObj = undefined;
        }

        /**
         * Check if an object is currently selected.
         * @param {*} obj the object to check for selection
         * @returns {boolean} true if selected, otherwise false
         */
        EditToolbarSelection.prototype.selected = function (obj) {
            return (obj === this.selectedObj) || (obj === this.selection[0]);
        };

        /**
         * Select an object.
         * @param obj the object to select
         * @returns {boolean} true if selection changed
         */
        EditToolbarSelection.prototype.select = function (obj) {
            // Proxy is always selected
            if (obj === this.selection[0]) {
                return false;
            }

            // Clear any existing selection
            this.deselect();

            // Note the current selection state
            this.selectedObj = obj;
            this.selecting = true;

            // Add the selection
            this.selection.push(obj);
        };

        /**
         * Clear the current selection.
         * @returns {boolean} true if selection changed
         */
        EditToolbarSelection.prototype.deselect = function () {
            // Nothing to do if we don't have a selected object
            if (this.selecting) {
                // Clear state tracking
                this.selecting = false;
                this.selectedObj = undefined;

                // Remove the selection
                this.selection.pop();

                return true;
            }
            return false;
        };

        /**
         * Get the currently-selected object.
         * @returns the currently selected object
         */
        EditToolbarSelection.prototype.get = function () {
            return this.selectedObj;
        };

        /**
         * Get/set the view proxy (for toolbar actions taken upon
         * the view itself.)
         * @param [proxy] the view proxy (if setting)
         * @returns the current view proxy
         */
        EditToolbarSelection.prototype.proxy = function (p) {
            if (arguments.length > 0) {
                this.selection[0] = p;
            }
            return this.selection[0];
        };

        /**
         * Get an array containing all selections, including the
         * selection proxy. It is generally not advisable to
         * mutate this array directly.
         * @returns {Array} all selections
         */
        EditToolbarSelection.prototype.all = function () {
            return this.selection;
        };

        return EditToolbarSelection;
    }
);

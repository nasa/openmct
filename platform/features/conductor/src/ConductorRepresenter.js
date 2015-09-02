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

        var CONDUCTOR_HEIGHT = "100px",
            TEMPLATE = [
                '<div style="position: absolute; bottom: 0; width: 100%; height: ' + CONDUCTOR_HEIGHT + '">',
                "<mct-include key=\"'time-controller'\"></mct-include>",
                '</div>'
            ].join('');

        /**
         * The ConductorRepresenter attaches the universal time conductor
         * to views.
         *
         * @memberof platform/commonUI/edit
         * @implements {Representer}
         * @constructor
         */
        function ConductorRepresenter($compile, views, scope, element) {
            var conductorScope;

            // Angular doesn't like objects to retain references to scope
            this.getScope = function () { return scope; };
            this.conductorScope = function (s) {
                return (conductorScope = arguments.length > 0 ? s : conductorScope);
            };

            this.element = element;
            this.showing = false;
            this.views = views;
            this.$compile = $compile;

            this.originalHeight = element.css('height');
            this.hadAbs = element.hasClass('abs');
        }

        // Handle a specific representation of a specific domain object
        ConductorRepresenter.prototype.represent = function represent(representation, representedObject) {
            if (this.showing) {
                this.destroy();
            }

            if (this.views.indexOf(representation) !== -1) {
                // Create a new scope for the conductor
                this.conductorScope(this.getScope().$new());
                this.conductorElement =
                    this.$compile(TEMPLATE)(this.conductorScope());
                this.element.after(this.conductorElement[0]);
                this.element.addClass('abs');
                this.element.css('bottom', CONDUCTOR_HEIGHT);
                this.showing = true;
            }
        };

        // Respond to the destruction of the current representation.
        ConductorRepresenter.prototype.destroy = function destroy() {
            // Restore the original size of the mct-representation
            if (!this.hadAbs) {
                this.element.removeClass('abs');
            }
            this.element.css('height', this.originalHeight);

            // ...and remove the conductor
            if (this.conductorElement) {
                this.conductorElement.remove();
                this.conductorElement = undefined;
            }

            // Finally, destroy its scope
            if (this.conductorScope()) {
                this.conductorScope().$destroy();
                this.conductorScope(undefined);
            }

            this.showing = false;
        };

        return ConductorRepresenter;
    }
);


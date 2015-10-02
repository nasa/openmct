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
                '<div style=',
                '"position: absolute; bottom: 0; width: 100%; ',
                'overflow: hidden; ',
                'height: ' + CONDUCTOR_HEIGHT + '">',
                "<mct-include key=\"'time-controller'\" ng-model='conductor'>",
                "</mct-include>",
                '</div>'
            ].join(''),
            GLOBAL_SHOWING = false;

        /**
         * The ConductorRepresenter attaches the universal time conductor
         * to views.
         *
         * @implements {Representer}
         * @constructor
         * @memberof platform/features/conductor
         * @param {platform/features/conductor.ConductorService} conductorService
         *        service which provides the active time conductor
         * @param $compile Angular's $compile
         * @param {ViewDefinition[]} views all defined views
         * @param {Scope} the scope of the representation
         * @param element the jqLite-wrapped representation element
         */
        function ConductorRepresenter(conductorService, $compile, views, scope, element) {
            this.scope = scope;
            this.conductorService = conductorService;
            this.element = element;
            this.views = views;
            this.$compile = $compile;
        }

        // Update the time conductor from the scope
        function wireScope(conductor, conductorScope, repScope) {
            // Combine start/end times into a single object
            function bounds(start, end) {
                return {
                    start: conductor.displayStart(),
                    end: conductor.displayEnd()
                };
            }

            function updateConductorInner() {
                conductor.displayStart(conductorScope.conductor.inner.start);
                conductor.displayEnd(conductorScope.conductor.inner.end);
                repScope.$broadcast('telemetry:display:bounds', bounds());
            }

            conductorScope.conductor = { outer: bounds(), inner: bounds() };

            conductorScope
                .$watch('conductor.inner.start', updateConductorInner);
            conductorScope
                .$watch('conductor.inner.end', updateConductorInner);

            repScope.$on('telemetry:view', updateConductorInner);
        }

        ConductorRepresenter.prototype.conductorScope = function (s) {
            return (this.cScope = arguments.length > 0 ? s : this.cScope);
        };

        // Handle a specific representation of a specific domain object
        ConductorRepresenter.prototype.represent = function represent(representation, representedObject) {
            this.destroy();

            if (this.views.indexOf(representation) !== -1 && !GLOBAL_SHOWING) {
                // Track original states
                this.originalHeight = this.element.css('height');
                this.hadAbs = this.element.hasClass('abs');

                // Create a new scope for the conductor
                this.conductorScope(this.scope.$new());
                wireScope(
                    this.conductorService.getConductor(),
                    this.conductorScope(),
                    this.scope
                );
                this.conductorElement =
                    this.$compile(TEMPLATE)(this.conductorScope());
                this.element.after(this.conductorElement[0]);
                this.element.addClass('abs');
                this.element.css('bottom', CONDUCTOR_HEIGHT);
                GLOBAL_SHOWING = true;
            }
        };

        // Respond to the destruction of the current representation.
        ConductorRepresenter.prototype.destroy = function destroy() {
            // We may not have decided to show in the first place,
            // so circumvent any unnecessary cleanup
            if (!this.conductorElement) {
                return;
            }

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

            GLOBAL_SHOWING = false;
        };

        return ConductorRepresenter;
    }
);


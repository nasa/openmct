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

        var TEMPLATE = [
                "<mct-include key=\"'time-conductor'\" ",
                "ng-model='ngModel' ",
                "parameters='parameters' ",
                "class='holder flex-elem flex-fixed l-time-controller'>",
                "</mct-include>"
            ].join(''),
            THROTTLE_MS = 200,
            GLOBAL_SHOWING = false;

        /**
         * The ConductorRepresenter attaches the universal time conductor
         * to views.
         *
         * @implements {Representer}
         * @constructor
         * @memberof platform/features/conductor
         * @param {Function} throttle a function used to reduce the frequency
         *        of function invocations
         * @param {platform/features/conductor.ConductorService} conductorService
         *        service which provides the active time conductor
         * @param $compile Angular's $compile
         * @param {ViewDefinition[]} views all defined views
         * @param {Scope} the scope of the representation
         * @param element the jqLite-wrapped representation element
         */
        function ConductorRepresenter(
            throttle,
            conductorService,
            $compile,
            views,
            scope,
            element
        ) {
            this.throttle = throttle;
            this.scope = scope;
            this.conductorService = conductorService;
            this.element = element;
            this.views = views;
            this.$compile = $compile;
        }

        // Update the time conductor from the scope
        ConductorRepresenter.prototype.wireScope = function () {
            var conductor = this.conductorService.getConductor(),
                conductorScope = this.conductorScope(),
                repScope = this.scope,
                lastObservedBounds,
                broadcastBounds;

            // Combine start/end times into a single object
            function bounds() {
                return {
                    start: conductor.displayStart(),
                    end: conductor.displayEnd(),
                    domain: conductor.domain().key
                };
            }

            function boundsAreStable(newlyObservedBounds) {
                return !lastObservedBounds ||
                    (lastObservedBounds.start === newlyObservedBounds.start &&
                    lastObservedBounds.end === newlyObservedBounds.end);
            }

            function updateConductorInner() {
                var innerBounds = conductorScope.ngModel.conductor.inner;
                conductor.displayStart(innerBounds.start);
                conductor.displayEnd(innerBounds.end);
                lastObservedBounds = lastObservedBounds || bounds();
                broadcastBounds();
            }

            function updateDomain(value) {
                var newDomain = conductor.domain(value);
                conductorScope.parameters.format = newDomain.format;
                broadcastBounds();
            }

            // telemetry domain metadata -> option for a select control
            function makeOption(domainOption) {
                return {
                    name: domainOption.name,
                    value: domainOption.key
                };
            }

            broadcastBounds = this.throttle(function () {
                var newlyObservedBounds = bounds();

                if (boundsAreStable(newlyObservedBounds)) {
                    repScope.$broadcast('telemetry:display:bounds', bounds());
                    lastObservedBounds = undefined;
                } else {
                    lastObservedBounds = newlyObservedBounds;
                    broadcastBounds();
                }
            }, THROTTLE_MS);

            conductorScope.ngModel = {};
            conductorScope.ngModel.conductor =
                { outer: bounds(), inner: bounds() };
            conductorScope.ngModel.options =
                conductor.domainOptions().map(makeOption);
            conductorScope.ngModel.domain = conductor.domain().key;
            conductorScope.parameters = {};

            conductorScope
                .$watch('ngModel.conductor.inner.start', updateConductorInner);
            conductorScope
                .$watch('ngModel.conductor.inner.end', updateConductorInner);
            conductorScope
                .$watch('ngModel.domain', updateDomain);
        };

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
                this.wireScope();
                this.conductorElement =
                    this.$compile(TEMPLATE)(this.conductorScope());
                this.element.parent().parent().after(this.conductorElement[0]);
                this.element.parent().parent().addClass('l-controls-visible l-time-controller-visible');
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


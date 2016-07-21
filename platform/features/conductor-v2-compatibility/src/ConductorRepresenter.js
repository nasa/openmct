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

define(
    [],
    function () {

        function ConductorRepresenter(
            conductor,
            scope,
            element
        ) {
            this.conductor = conductor;
            this.scope = scope;
            this.element = element;

            this.boundsListener = this.boundsListener.bind(this);
            this.timeSystemListener = this.timeSystemListener.bind(this);
        }

        ConductorRepresenter.prototype.boundsListener = function (bounds) {
            this.scope.$broadcast('telemetry:display:bounds', {
                start: bounds.start,
                end: bounds.end,
                domain: this.conductor.timeSystem().metadata.key
            }, this.conductor.follow());
        };

        ConductorRepresenter.prototype.timeSystemListener = function (timeSystem) {
            var bounds = this.conductor.bounds();
            this.scope.$broadcast('telemetry:display:bounds', {
                start: bounds.start,
                end: bounds.end,
                domain: timeSystem.metadata.key
            });
        };

        // Handle a specific representation of a specific domain object
        ConductorRepresenter.prototype.represent = function represent(representation) {
            if (representation.key === 'browse-object') {
                this.destroy();

                this.conductor.on("bounds", this.boundsListener);
                this.conductor.on("timeSystem", this.timeSystemListener);
            }
        };

        ConductorRepresenter.prototype.destroy = function destroy() {
            this.conductor.off("bounds", this.boundsListener);
            this.conductor.off("timeSystem", this.timeSystemListener);
        };

        return ConductorRepresenter;
    }
);


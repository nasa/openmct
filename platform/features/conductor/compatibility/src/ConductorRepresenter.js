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

        /**
         * Representer that provides a compatibility layer between the new
         * time conductor and existing representations / views. Listens to
         * the v2 time conductor API and generates v1 style events using the
         * Angular event bus. This is transitional code code and will be
         * removed.
         *
         * Deprecated immediately as this is temporary code
         *
         * @deprecated
         * @constructor
         */
        function ConductorRepresenter(
            openmct,
            scope,
            element
        ) {
            this.timeAPI = openmct.time;
            this.scope = scope;
            this.element = element;

            this.boundsListener = this.boundsListener.bind(this);
            this.timeSystemListener = this.timeSystemListener.bind(this);
            this.followListener = this.followListener.bind(this);
        }

        ConductorRepresenter.prototype.boundsListener = function (bounds) {
            var timeSystem = this.timeAPI.timeSystem();
            this.scope.$broadcast('telemetry:display:bounds', {
                start: bounds.start,
                end: bounds.end,
                domain: timeSystem.key
            }, this.timeAPI.clock() !== undefined);
        };

        ConductorRepresenter.prototype.timeSystemListener = function (timeSystem) {
            var bounds = this.timeAPI.bounds();
            this.scope.$broadcast('telemetry:display:bounds', {
                start: bounds.start,
                end: bounds.end,
                domain: timeSystem.key
            }, this.timeAPI.clock() !== undefined);
        };

        ConductorRepresenter.prototype.followListener = function () {
            this.boundsListener(this.timeAPI.bounds());
        };

        // Handle a specific representation of a specific domain object
        ConductorRepresenter.prototype.represent = function represent(representation) {
            if (representation.key === 'browse-object') {
                this.destroy();

                this.timeAPI.on("bounds", this.boundsListener);
                this.timeAPI.on("timeSystem", this.timeSystemListener);
                this.timeAPI.on("follow", this.followListener);
            }
        };

        ConductorRepresenter.prototype.destroy = function destroy() {
            this.timeAPI.off("bounds", this.boundsListener);
            this.timeAPI.off("timeSystem", this.timeSystemListener);
            this.timeAPI.off("follow", this.followListener);
        };

        return ConductorRepresenter;
    }
);


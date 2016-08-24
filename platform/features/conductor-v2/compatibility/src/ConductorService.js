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

define([

], function (

) {

    function Conductor(timeConductorService) {
        this.timeConductor = timeConductorService.conductor();
    }

    Conductor.prototype.displayStart = function () {
        return this.timeConductor.bounds().start;
    };

    Conductor.prototype.displayEnd = function () {
        return this.timeConductor.bounds().end;
    };

    Conductor.prototype.domainOptions = function () {
        throw new Error([
            'domainOptions not implemented in compatibility layer,',
            ' you must be using some crazy unknown code'
        ].join(''));
    };

    Conductor.prototype.domain = function () {
        var system = this.timeConductor.timeSystem();
        return {
            key: system.metadata.key,
            name: system.metadata.name,
            format: system.formats()[0]
        };
    };

    /**
     * Small compatibility layer that implements old conductor service by
     * wrapping new time conductor.  This allows views that previously depended
     * directly on the conductor service to continue to do so without
     * modification.
     */
    function ConductorService(timeConductor) {
        this.tc = new Conductor(timeConductor);
    }

    ConductorService.prototype.getConductor = function () {
        return this.tc;
    };

    return ConductorService;
});

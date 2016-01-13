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
/*global define, window, requirejs*/

requirejs.config({
    "paths": {
        "legacyRegistry": "src/legacyRegistry",
        "angular": "platform/framework/lib/angular.min",
        "moment": 'platform/telemetry/lib/moment.min'
    },
    "shim": {
        "angular": {
            "exports": "angular"
        }
    }
});

define([
    './platform/framework/src/Main',
    'legacyRegistry',

    './platform/framework/bundle',
    './platform/core/bundle',
    './platform/representation/bundle',
    './platform/commonUI/about/bundle',
    './platform/commonUI/browse/bundle',
    './platform/commonUI/edit/bundle',
    './platform/commonUI/dialog/bundle',
    './platform/commonUI/formats/bundle',
    './platform/commonUI/general/bundle',
    './platform/commonUI/inspect/bundle',
    './platform/commonUI/mobile/bundle',
    './platform/commonUI/themes/espresso/bundle',
    './platform/commonUI/notification/bundle',
    './platform/containment/bundle',
    './platform/execution/bundle',
    './platform/telemetry/bundle',
    './platform/features/clock/bundle',
    './platform/features/events/bundle',
    './platform/features/imagery/bundle',
    './platform/features/layout/bundle',
    './platform/features/pages/bundle',
    './platform/features/plot/bundle',
    './platform/features/scrolling/bundle',
    './platform/features/timeline/bundle',
    './platform/forms/bundle',
    './platform/identity/bundle',
    './platform/persistence/aggregator/bundle',
    './platform/persistence/local/bundle',
    './platform/persistence/queue/bundle',
    './platform/policy/bundle',
    './platform/entanglement/bundle',
    './platform/search/bundle',
    './platform/status/bundle',

    './example/imagery/bundle',
    './example/eventGenerator/bundle',
    './example/generator/bundle'
], function (Main, legacyRegistry) {
    'use strict';
    new Main().run(legacyRegistry);
});
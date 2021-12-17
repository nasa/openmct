/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
const DEFAULTS = [
    'src/adapter',
    'platform/framework',
    'platform/core',
    'platform/representation',
    'platform/commonUI/browse',
    'platform/commonUI/edit',
    'platform/commonUI/dialog',
    'platform/commonUI/formats',
    'platform/commonUI/general',
    'platform/commonUI/inspect',
    'platform/commonUI/mobile',
    'platform/commonUI/notification',
    'platform/containment',
    'platform/exporters',
    'platform/telemetry',
    'platform/identity',
    'platform/persistence/aggregator',
    'platform/policy',
    'platform/entanglement',
    'platform/status',
    'platform/commonUI/regions'
];

import '../src/adapter/bundle';
import '../example/eventGenerator/bundle';
import '../example/export/bundle';
import '../example/forms/bundle';
import '../example/identity/bundle';
import '../example/mobile/bundle';
import '../example/msl/bundle';
import '../example/notifications/bundle';
import '../example/persistence/bundle';
import '../example/policy/bundle';
import '../example/profiling/bundle';
import '../example/scratchpad/bundle';
import '../example/styleguide/bundle';
import '../platform/commonUI/browse/bundle';
import '../platform/commonUI/dialog/bundle';
import '../platform/commonUI/edit/bundle';
import '../platform/commonUI/formats/bundle';
import '../platform/commonUI/general/bundle';
import '../platform/commonUI/inspect/bundle';
import '../platform/commonUI/mobile/bundle';
import '../platform/commonUI/notification/bundle';
import '../platform/commonUI/regions/bundle';
import '../platform/containment/bundle';
import '../platform/core/bundle';
import '../platform/entanglement/bundle';
import '../platform/exporters/bundle';
import '../platform/features/static-markup/bundle';
import '../platform/framework/bundle';
import '../platform/framework/src/load/Bundle';
import '../platform/identity/bundle';
import '../platform/persistence/aggregator/bundle';
import '../platform/persistence/elastic/bundle';
import '../platform/persistence/local/bundle';
import '../platform/persistence/queue/bundle';
import '../platform/policy/bundle';
import '../platform/representation/bundle';
import '../platform/status/bundle';
import '../platform/telemetry/bundle';
const LEGACY_BUNDLES = Array.from(arguments);

export default function installDefaultBundles(bundleRegistry) {
    registerLegacyBundles(LEGACY_BUNDLES);
    enableDefaultBundles();

    function registerLegacyBundles(bundles) {
        bundles.forEach((bundle, i) => {
            bundleRegistry.register(bundle.name, bundle.definition);
        });
    }

    function enableDefaultBundles() {
        DEFAULTS.forEach(function (bundlePath) {
            bundleRegistry.enable(bundlePath);
        });
    }
};
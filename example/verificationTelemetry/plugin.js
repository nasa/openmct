/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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

import { CAPSULE_TYPE, ROOT_IDENTIFIER, STREAM_TYPE, VERIFICATION_NAMESPACE } from './constants.js';
import VerificationCompositionProvider from './VerificationCompositionProvider.js';
import VerificationObjectProvider from './VerificationObjectProvider.js';
import VerificationTelemetryMetadataProvider from './VerificationTelemetryMetadataProvider.js';
import VerificationTelemetryProvider from './VerificationTelemetryProvider.js';
import VerificationTimelineViewProvider from './VerificationTimelineViewProvider.js';

export default function VerificationTelemetryPlugin(options = {}) {
  return function install(openmct) {
    openmct.types.addType(CAPSULE_TYPE, {
      name: 'Verification Capsule',
      description: 'A verification and provenance report represented as event telemetry.',
      cssClass: 'icon-telemetry'
    });

    openmct.types.addType(STREAM_TYPE, {
      name: 'Verification Event Stream',
      description: 'Verification, replay, lineage, semantic binding, witness, and mutation events.',
      cssClass: 'icon-generator-events'
    });

    openmct.objects.addRoot(ROOT_IDENTIFIER);
    openmct.objects.addProvider(VERIFICATION_NAMESPACE, new VerificationObjectProvider());
    openmct.composition.addProvider(new VerificationCompositionProvider());
    openmct.telemetry.addProvider(new VerificationTelemetryMetadataProvider());
    openmct.telemetry.addProvider(new VerificationTelemetryProvider(options));
    openmct.objectViews.addProvider(new VerificationTimelineViewProvider(openmct));
  };
}

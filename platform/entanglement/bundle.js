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

import SetPrimaryLocationAction from './src/actions/SetPrimaryLocationAction';

import LocatingCreationDecorator from './src/services/LocatingCreationDecorator';
import LocatingObjectDecorator from './src/services/LocatingObjectDecorator';
import CopyPolicy from './src/policies/CopyPolicy';
import CrossSpacePolicy from './src/policies/CrossSpacePolicy';
import LocationCapability from './src/capabilities/LocationCapability';
import CopyService from './src/services/CopyService';
import LocationService from './src/services/LocationService';

export default {
    name: "platform/entanglement",
    definition: {
        "name": "Entanglement",
        "description": "Tools to assist you in entangling the world of WARP.",
        "configuration": {},
        "extensions": {
            "actions": [
                {
                    "key": "locate",
                    "name": "Set Primary Location",
                    "description": "Set a domain object's primary location.",
                    "cssClass": "",
                    "category": "contextual",
                    "implementation": SetPrimaryLocationAction
                }
            ],
            "components": [
                {
                    "type": "decorator",
                    "provides": "creationService",
                    "implementation": LocatingCreationDecorator
                },
                {
                    "type": "decorator",
                    "provides": "objectService",
                    "implementation": LocatingObjectDecorator,
                    "depends": [
                        "$q",
                        "$log"
                    ]
                }
            ],
            "policies": [
                {
                    "category": "action",
                    "implementation": CrossSpacePolicy
                },
                {
                    "category": "action",
                    "implementation": CopyPolicy
                }
            ],
            "capabilities": [
                {
                    "key": "location",
                    "name": "Location Capability",
                    "description": "Provides a capability for retrieving the location of an object based upon it's context.",
                    "implementation": LocationCapability,
                    "depends": [
                        "$q",
                        "$injector"
                    ]
                }
            ],
            "services": [
                {
                    "key": "copyService",
                    "name": "Copy Service",
                    "description": "Provides a service for copying objects",
                    "implementation": CopyService,
                    "depends": [
                        "$q",
                        "policyService",
                        "openmct"
                    ]
                },
                {
                    "key": "locationService",
                    "name": "Location Service",
                    "description": "Provides a service for prompting a user for locations.",
                    "implementation": LocationService,
                    "depends": [
                        "dialogService"
                    ]
                }
            ],
            "licenses": []
        }
    }
};
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

define([
    "./src/actions/MoveAction",
    "./src/actions/CopyAction",
    "./src/actions/LinkAction",
    "./src/actions/GoToOriginalAction",
    "./src/actions/SetPrimaryLocationAction",
    "./src/services/LocatingCreationDecorator",
    "./src/services/LocatingObjectDecorator",
    "./src/policies/CopyPolicy",
    "./src/policies/CrossSpacePolicy",
    "./src/policies/MovePolicy",
    "./src/capabilities/LocationCapability",
    "./src/services/MoveService",
    "./src/services/LinkService",
    "./src/services/CopyService",
    "./src/services/LocationService",
    'legacyRegistry'
], function (
    MoveAction,
    CopyAction,
    LinkAction,
    GoToOriginalAction,
    SetPrimaryLocationAction,
    LocatingCreationDecorator,
    LocatingObjectDecorator,
    CopyPolicy,
    CrossSpacePolicy,
    MovePolicy,
    LocationCapability,
    MoveService,
    LinkService,
    CopyService,
    LocationService,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("platform/entanglement", {
        "name": "Entanglement",
        "description": "Tools to assist you in entangling the world of WARP.",
        "configuration": {},
        "extensions": {
            "actions": [
                {
                    "key": "move",
                    "name": "Move",
                    "description": "Move object to another location.",
                    "glyph": "f",
                    "category": "contextual",
                    "implementation": MoveAction,
                    "depends": [
                        "policyService",
                        "locationService",
                        "moveService"
                    ]
                },
                {
                    "key": "copy",
                    "name": "Duplicate",
                    "description": "Duplicate object to another location.",
                    "glyph": "+",
                    "category": "contextual",
                    "implementation": CopyAction,
                    "depends": [
                        "$log",
                        "policyService",
                        "locationService",
                        "copyService",
                        "dialogService",
                        "notificationService"
                    ]
                },
                {
                    "key": "link",
                    "name": "Create Link",
                    "description": "Create Link to object in another location.",
                    "glyph": "è",
                    "category": "contextual",
                    "implementation": LinkAction,
                    "depends": [
                        "policyService",
                        "locationService",
                        "linkService"
                    ]
                },
                {
                    "key": "follow",
                    "name": "Go To Original",
                    "description": "Go to the original, un-linked instance of this object.",
                    "glyph": "ô",
                    "category": "contextual",
                    "implementation": GoToOriginalAction
                },
                {
                    "key": "locate",
                    "name": "Set Primary Location",
                    "description": "Set a domain object's primary location.",
                    "glyph": "",
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
                        "contextualize",
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
                },
                {
                    "category": "action",
                    "implementation": MovePolicy
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
                    "key": "moveService",
                    "name": "Move Service",
                    "description": "Provides a service for moving objects",
                    "implementation": MoveService,
                    "depends": [
                        "policyService",
                        "linkService",
                        "$q"
                    ]
                },
                {
                    "key": "linkService",
                    "name": "Link Service",
                    "description": "Provides a service for linking objects",
                    "implementation": LinkService,
                    "depends": [
                        "policyService"
                    ]
                },
                {
                    "key": "copyService",
                    "name": "Copy Service",
                    "description": "Provides a service for copying objects",
                    "implementation": CopyService,
                    "depends": [
                        "$q",
                        "policyService",
                        "now"
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
    });
});

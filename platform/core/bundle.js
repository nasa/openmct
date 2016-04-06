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
    "./src/objects/DomainObjectProvider",
    "./src/capabilities/CoreCapabilityProvider",
    "./src/models/StaticModelProvider",
    "./src/models/RootModelProvider",
    "./src/models/ModelAggregator",
    "./src/models/ModelCacheService",
    "./src/models/PersistedModelProvider",
    "./src/models/CachingModelDecorator",
    "./src/models/MissingModelDecorator",
    "./src/types/TypeProvider",
    "./src/actions/ActionProvider",
    "./src/actions/ActionAggregator",
    "./src/actions/LoggingActionDecorator",
    "./src/views/ViewProvider",
    "./src/identifiers/IdentifierProvider",
    "./src/capabilities/CompositionCapability",
    "./src/capabilities/RelationshipCapability",
    "./src/types/TypeCapability",
    "./src/actions/ActionCapability",
    "./src/views/ViewCapability",
    "./src/capabilities/PersistenceCapability",
    "./src/capabilities/MetadataCapability",
    "./src/capabilities/MutationCapability",
    "./src/capabilities/DelegationCapability",
    "./src/capabilities/InstantiationCapability",
    "./src/services/Now",
    "./src/services/Throttle",
    "./src/services/Topic",
    "./src/services/Contextualize",
    "./src/services/Instantiate",
    'legacyRegistry'
], function (
    DomainObjectProvider,
    CoreCapabilityProvider,
    StaticModelProvider,
    RootModelProvider,
    ModelAggregator,
    ModelCacheService,
    PersistedModelProvider,
    CachingModelDecorator,
    MissingModelDecorator,
    TypeProvider,
    ActionProvider,
    ActionAggregator,
    LoggingActionDecorator,
    ViewProvider,
    IdentifierProvider,
    CompositionCapability,
    RelationshipCapability,
    TypeCapability,
    ActionCapability,
    ViewCapability,
    PersistenceCapability,
    MetadataCapability,
    MutationCapability,
    DelegationCapability,
    InstantiationCapability,
    Now,
    Throttle,
    Topic,
    Contextualize,
    Instantiate,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("platform/core", {
        "name": "Open MCT Web Core",
        "description": "Defines core concepts of Open MCT Web.",
        "sources": "src",
        "configuration": {
            "paths": {
                "uuid": "uuid"
            }
        },
        "extensions": {
            "versions": [
                {
                    "name": "Version",
                    "value": "@@version",
                    "priority": 999
                },
                {
                    "name": "Built",
                    "value": "@@timestamp",
                    "description": "The date on which this version of the client was built.",
                    "priority": 990
                },
                {
                    "name": "Revision",
                    "value": "@@revision",
                    "description": "A unique revision identifier for the client sources.",
                    "priority": 995
                },
                {
                    "name": "Branch",
                    "value": "@@branch",
                    "description": "The name of the branch that was used during the build.",
                    "priority": 994
                }
            ],
            "components": [
                {
                    "provides": "objectService",
                    "type": "provider",
                    "implementation": DomainObjectProvider,
                    "depends": [
                        "modelService",
                        "instantiate"
                    ]
                },
                {
                    "provides": "capabilityService",
                    "type": "provider",
                    "implementation": CoreCapabilityProvider,
                    "depends": [
                        "capabilities[]",
                        "$log"
                    ]
                },
                {
                    "provides": "modelService",
                    "type": "provider",
                    "implementation": StaticModelProvider,
                    "depends": [
                        "models[]",
                        "$q",
                        "$log"
                    ]
                },
                {
                    "provides": "modelService",
                    "type": "provider",
                    "implementation": RootModelProvider,
                    "depends": [
                        "roots[]",
                        "$q",
                        "$log"
                    ]
                },
                {
                    "provides": "modelService",
                    "type": "aggregator",
                    "implementation": ModelAggregator,
                    "depends": [
                        "$q"
                    ]
                },
                {
                    "provides": "modelService",
                    "type": "provider",
                    "implementation": PersistedModelProvider,
                    "depends": [
                        "persistenceService",
                        "$q",
                        "now",
                        "PERSISTENCE_SPACE"
                    ]
                },
                {
                    "provides": "modelService",
                    "type": "decorator",
                    "implementation": CachingModelDecorator,
                    "depends": [
                        "cacheService"
                    ]
                },
                {
                    "provides": "modelService",
                    "type": "decorator",
                    "priority": "fallback",
                    "implementation": MissingModelDecorator
                },
                {
                    "provides": "typeService",
                    "type": "provider",
                    "implementation": TypeProvider,
                    "depends": [
                        "types[]"
                    ]
                },
                {
                    "provides": "actionService",
                    "type": "provider",
                    "implementation": ActionProvider,
                    "depends": [
                        "actions[]",
                        "$log"
                    ]
                },
                {
                    "provides": "actionService",
                    "type": "aggregator",
                    "implementation": ActionAggregator
                },
                {
                    "provides": "actionService",
                    "type": "decorator",
                    "implementation": LoggingActionDecorator,
                    "depends": [
                        "$log"
                    ]
                },
                {
                    "provides": "viewService",
                    "type": "provider",
                    "implementation": ViewProvider,
                    "depends": [
                        "views[]",
                        "$log"
                    ]
                },
                {
                    "provides": "identifierService",
                    "type": "provider",
                    "implementation": IdentifierProvider,
                    "depends": [
                        "PERSISTENCE_SPACE"
                    ]
                }
            ],
            "types": [
                {
                    "properties": [
                        {
                            "control": "textfield",
                            "name": "Title",
                            "key": "name",
                            "property": "name",
                            "pattern": "\\S+",
                            "required": true,
                            "cssclass": "l-input-lg"
                        }
                    ]
                },
                {
                    "key": "root",
                    "name": "Root",
                    "glyph": "\u0046"
                },
                {
                    "key": "folder",
                    "name": "Folder",
                    "glyph": "\u0046",
                    "features": "creation",
                    "description": "Create folders to organize other objects or links to objects.",
                    "priority": 1000,
                    "model": {
                        "composition": []
                    }
                },
                {
                    "key": "unknown",
                    "name": "Unknown Type",
                    "glyph": "\u003f"
                },
                {
                    "name": "Unknown Type",
                    "glyph": "\u003f"
                }
            ],
            "capabilities": [
                {
                    "key": "composition",
                    "implementation": CompositionCapability,
                    "depends": [
                        "$injector",
                        "contextualize"
                    ]
                },
                {
                    "key": "relationship",
                    "implementation": RelationshipCapability,
                    "depends": [
                        "$injector"
                    ]
                },
                {
                    "key": "type",
                    "implementation": TypeCapability,
                    "depends": [
                        "typeService"
                    ]
                },
                {
                    "key": "action",
                    "implementation": ActionCapability,
                    "depends": [
                        "$q",
                        "actionService"
                    ]
                },
                {
                    "key": "view",
                    "implementation": ViewCapability,
                    "depends": [
                        "viewService"
                    ]
                },
                {
                    "key": "persistence",
                    "implementation": PersistenceCapability,
                    "depends": [
                        "cacheService",
                        "persistenceService",
                        "identifierService",
                        "notificationService",
                        "$q"
                    ]
                },
                {
                    "key": "metadata",
                    "implementation": MetadataCapability
                },
                {
                    "key": "mutation",
                    "implementation": MutationCapability,
                    "depends": [
                        "topic",
                        "now"
                    ]
                },
                {
                    "key": "delegation",
                    "implementation": DelegationCapability,
                    "depends": [
                        "$q"
                    ]
                },
                {
                    "key": "instantiation",
                    "implementation": InstantiationCapability,
                    "depends": [
                        "$injector",
                        "identifierService",
                        "now"
                    ]
                }
            ],
            "services": [
                {
                    "key": "cacheService",
                    "implementation": ModelCacheService
                },
                {
                    "key": "now",
                    "implementation": Now
                },
                {
                    "key": "throttle",
                    "implementation": Throttle,
                    "depends": [
                        "$timeout"
                    ]
                },
                {
                    "key": "topic",
                    "implementation": Topic,
                    "depends": [
                        "$log"
                    ]
                },
                {
                    "key": "contextualize",
                    "implementation": Contextualize,
                    "depends": [
                        "$log"
                    ]
                },
                {
                    "key": "instantiate",
                    "implementation": Instantiate,
                    "depends": [
                        "capabilityService",
                        "identifierService",
                        "cacheService"
                    ]
                }
            ],
            "roots": [
                {
                    "id": "mine",
                    "model": {
                        "name": "My Items",
                        "type": "folder",
                        "composition": []
                    }
                }
            ],
            "constants": [
                {
                    "key": "PERSISTENCE_SPACE",
                    "value": "mct"
                }
            ],
            "licenses": [
                {
                    "name": "Math.uuid.js",
                    "version": "1.4.7",
                    "description": "Unique identifer generation (code adapted.)",
                    "author": "Robert Kieffer",
                    "website": "https://github.com/broofa/node-uuid",
                    "copyright": "Copyright (c) 2010-2012 Robert Kieffer",
                    "license": "license-mit",
                    "link": "http://opensource.org/licenses/MIT"
                }
            ]
        }
    });
});

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
    "./src/SomeProvider",
    "./src/SomeOtherProvider",
    "./src/SomeDecorator",
    "./src/SomeOtherDecorator",
    "./src/SomeAggregator",
    "./src/SomeOtherExample",
    'legacyRegistry'
], function (
    SomeProvider,
    SomeOtherProvider,
    SomeDecorator,
    SomeOtherDecorator,
    SomeAggregator,
    SomeOtherExample,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("example/composite", {
        "extensions": {
            "components": [
                {
                    "implementation": SomeProvider,
                    "provides": "someService",
                    "type": "provider"
                },
                {
                    "implementation": SomeOtherProvider,
                    "provides": "someService",
                    "type": "provider"
                },
                {
                    "implementation": SomeDecorator,
                    "provides": "someService",
                    "type": "decorator"
                },
                {
                    "implementation": SomeOtherDecorator,
                    "provides": "someService",
                    "type": "decorator"
                },
                {
                    "implementation": SomeAggregator,
                    "provides": "someService",
                    "type": "aggregator"
                }
            ],
            "examples": [
                {
                    "implementation": SomeOtherExample,
                    "depends": [
                        "someService"
                    ]
                }
            ]
        }
    });
});

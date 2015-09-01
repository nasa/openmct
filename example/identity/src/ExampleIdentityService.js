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

define(
    function () {
        "use strict";

        var DEFAULT_IDENTITY = { key: "user", name: "Example User" },
            DIALOG_STRUCTURE = {
                name: "Identify Yourself",
                sections: [{ rows: [
                    {
                        name: "User ID",
                        control: "textfield",
                        key: "key",
                        required: true
                    },
                    {
                        name: "Human name",
                        control: "textfield",
                        key: "name",
                        required: true
                    }
                ]}]
            };


        /**
         * Example implementation of an identity service. This prompts the
         * user to enter a name and user ID; in a more realistic
         * implementation, this would be read from a server, possibly
         * prompting for a user name and password (or similar) as
         * appropriate.
         *
         * @implements {IdentityService}
         * @memberof platform/identity
         */
        function ExampleIdentityProvider(dialogService) {
            // Handle rejected dialog messages by treating the
            // current user as undefined.
            function echo(v) { return v; }
            function giveUndefined() { return undefined; }

            this.userPromise =
                dialogService.getUserInput(DIALOG_STRUCTURE, DEFAULT_IDENTITY)
                    .then(echo, giveUndefined);
        }

        ExampleIdentityProvider.prototype.getUser = function () {
            return this.userPromise;
        };

        return ExampleIdentityProvider;
    }
);

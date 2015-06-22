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
/*global define,Promise*/

/**
 * Module defining NewWindowAction. Created by vwoeltje on 11/18/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The new window action allows a domain object to be opened
         * into a new browser window. (Currently this is a stub, present
         * to allow the control to appear in the appropriate location in
         * the user interface.)
         * @constructor
         */
        function NewWindowAction($window) {
            return {
                /**
                 * Open the object in a new window (currently a stub)
                 */
                perform: function () {
                    $window.alert("Not yet functional. This will open objects in a new window.");
                },
                
                getMetadata: function () {
                    // We override getMetadata, this is temporary
                    // Until the css/html code views the button on
                    // its own
                    var metadata = Object.create(NewWindowAction);
                    metadata.glyph = "y";
                    metadata.description = "ENTER DESC HERE";
                    metadata.group = "windowing";
                    return metadata;
                }
            };
        }

        return NewWindowAction;
    }
);
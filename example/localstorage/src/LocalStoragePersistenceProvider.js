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

/*global define,localStorage*/
/**
 * Stubbed implementation of a persistence provider,
 * to permit objects to be created, saved, etc.
 */
define(
    [],
    function () {
        'use strict';

        function BrowserPersistenceProvider($q, SPACE) {
            var spaces = SPACE ? [SPACE] : [],
                promises = {
                    as: function (value) {
                        return $q.when(value);
                    }
                },
                provider;

            function setValue(key, value) {
                localStorage[key] = JSON.stringify(value);
            }

            function getValue(key) {
                if (localStorage[key]) {
                    return JSON.parse(localStorage[key]);
                }
                return {};
            }

            provider = {
                listSpaces: function () {
                    return promises.as(spaces);
                },
                listObjects: function (space) {
                    var space_obj = getValue(space);
                    return promises.as(Object.keys(space_obj));
                },
                createObject: function (space, key, value) {
                    var space_obj = getValue(space);
                    space_obj[key] = value;
                    setValue(space, space_obj);
                    return promises.as(true);
                },
                readObject: function (space, key) {
                    var space_obj = getValue(space);
                    return promises.as(space_obj[key]);
                },
                deleteObject: function (space, key, value) {
                    var space_obj = getValue(space);
                    delete space_obj[key];
                    return promises.as(true);
                }
            };

            provider.updateObject = provider.createObject;

            return provider;

        }

        return BrowserPersistenceProvider;
    }
);

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
 * Module defining UrlService.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * The url service handles calls for url paths
         * using domain objects.
         */
        function UrlService($location) {
            // Returns the url for the mode wanted
            // and the domainObject passed in. A path
            // is returned. The view is defaulted to
            // the current location's (current object's)
            // view set.
            function urlFor(mode, domainObject) {
                var context = domainObject &&
                        domainObject.getCapability('context'),
                    objectPath = context ? context.getPath() : [],
                    ids = objectPath.map(function (domainObject) {
                        return domainObject.getId();}),
                    viewPath = "?view=" + $location.search().view,
                    path = "index.html#/" + mode + "/" +
                        ids.slice(1).join("/") + viewPath;
                return path;
            }
            
            return {
               /**
                 * Returns the Url path for a specific domain object
                 * @param {value} value of the browse or edit mode 
                 *        for the path
                 * @param {DomainObject} value of the domain object 
                 *        to get the path of
                 */
                urlFor: urlFor   
            };
        }

        return UrlService;
    }
);
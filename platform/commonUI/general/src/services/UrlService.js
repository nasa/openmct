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
            function urlForLocation(mode, domainObject) {
                var context = domainObject &&
                        domainObject.getCapability('context'),
                    objectPath = context ? context.getPath() : [],
                    ids = objectPath.map(function (domainObject) {
                        return domainObject.getId();
                    }),
                    // Parses the path together. Starts with the 
                    // default index.html file, then the mode passed
                    // into the service, followed by ids in the url
                    // joined by '/', and lastly the view path from
                    // the current location
                    path = mode + "/" + ids.slice(1).join("/");
                return path;
            }
            
            function urlForLastLocation(mode, domainObject) {
                var context = domainObject &&
                        domainObject.getCapability('context'),
                    objectPath = context ? context.getPath() : [],
                    editedPath = (objectPath.length > 1) ? objectPath.slice(0, -1) : objectPath,
                    ids = editedPath.map(function (domainObject) {
                        return domainObject.getId();
                    }),
                    // Parses the path together. Starts with the 
                    // default index.html file, then the mode passed
                    // into the service, followed by ids in the url
                    // joined by '/', and lastly the view path from
                    // the current location
                    path = mode + "/" + ids.slice(1).join("/");
                return path;
            }
            
            // Uses the Url for the current location
            // from the urlForLocation function and
            // includes the view and the index path
            function urlForNewTab(mode, domainObject) {
                var viewPath = "?view=" + $location.search().view,
                    newTabPath =
                        "index.html#" + urlForLocation(mode, domainObject) + viewPath;
                return newTabPath;
            }
            
            function urlForBack(mode, domainObject) {
                var newTabPath =
                        "index.html#/" + urlForLastLocation(mode, domainObject);
                return newTabPath;
            }
                        
            return {
               /**
                 * Returns the Url path for a specific domain object
                 * without the index.html path and the view path
                 * @param {value} value of the browse or edit mode 
                 *        for the path
                 * @param {DomainObject} value of the domain object 
                 *        to get the path of
                 */
                urlForNewTab: urlForNewTab,
               /**
                 * Returns the Url path for a specific domain object
                 * including the index.html path and the view path
                 * allowing a new tab to hold the correct characteristics
                 * @param {value} value of the browse or edit mode 
                 *        for the path
                 * @param {DomainObject} value of the domain object 
                 *        to get the path of
                 */
                urlForLocation: urlForLocation,
                
                urlForBack: urlForBack
            };
        }

        return UrlService;
    }
);
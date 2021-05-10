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

/**
 * Module defining UrlService.
 */
export default class UrlService {
    /**
   * Returns the Url path for a specific domain object
   * without the index.html path and the view path
   * @param {string} mode value of browse or edit mode
   *        for the path
   * @param {DomainObject} value of the domain object
   *        to get the path of
   * @returns {string} URL for the domain object
   */
    urlForLocation(mode, domainObject) {
        const context = domainObject && domainObject.getCapability("context");
        const objectPath = context ? context.getPath() : [];

        const ids = objectPath.length
            ? objectPath.map((domainObj) => domainObj.getId())
            : [domainObject.getId()];

        // Parses the path together. Starts with the
        // default index.html file, then the mode passed
        // into the service, followed by ids in the url
        // joined by '/', and lastly the view path from
        // the current location
        return `/${mode}/${ids.join("/")}`;
    }

    /**
   * Returns the Url path for a specific domain object
   * including the index.html path and the view path
   * allowing a new tab to hold the correct characteristics
   * @param {string} mode value of browse or edit mode
   *        for the path
   * @param {DomainObject} value of the domain object
   *        to get the path of
   * @returns {string} URL for the domain object
   */
    urlForNewTab(mode, domainObject) {
        const search = this.parseParams(window.location.search || window.location.hash);
        const arr = [];
        for (let key in search) {
            if (Object.prototype.hasOwnProperty.call(search, key)) {
                arr.push(`${key}=${search[key]}`);
            }
        }

        return `#${this.urlForLocation(mode, domainObject)}?${arr.join("&")}`;
    }

    parseParams(params) {
        const p = params.split("?");
        const pieces = p.length === 2 && p[1].split("&") || "";
        let data = {};
        let parts;
        // process each query pair
        for (let i = 0; i < pieces.length; i++) {
            parts = pieces[i].split("=");
            if (parts.length < 2) {
                parts.push("");
            }

            data[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
        }

        return data;
    }
}

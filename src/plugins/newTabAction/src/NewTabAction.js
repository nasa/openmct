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

import UrlService from "./UrlService";

export default class NewTabAction {
    constructor(openmct) {
        this.name = "Open In New Tab";
        this.key = "window";
        this.cssClass = "icon-new-window";
        this.description = "Open in a new browser tab";
        this.group = "windowing";
        this.priority = 10;

        this.openmct = openmct;
        this.urlService = new UrlService();
    }

    appliesTo(objectPath) {
        let domainObject = objectPath[0];
        let type = domainObject && this.openmct.types.get(domainObject.type);

        return type && type.definition.creatable;
    }

    invoke(objectPath) {
        const newParent = this.openmct.legacyObject(objectPath);

        const url = `${this.urlService.urlForNewTab(
            "browse",
            newParent
        )}&hideTree=true&hideInspector=true`;
        window.open(url);
    }
}

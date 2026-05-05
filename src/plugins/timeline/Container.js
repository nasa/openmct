/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
 * a sizing container for objects in a layout
 */
class Container {
  constructor(domainObject, size) {
    /**
     * the identifier of the associated domain object
     * @type {import('@/api/objects/ObjectAPI.js').Identifier}
     */
    this.domainObjectIdentifier = domainObject.identifier;
    /**
     * the size in percentage or pixels
     * @type {number}
     */
    this.size = size;
    /**
     * the default percentage scale of an object
     * @type {number}
     */
    this.scale = getContainerScale(domainObject);
    /**
     * true if the container should be a fixed pixel size
     * false if the container should be a flexible percentage size
     * containers are added as flex
     * @type {boolean}
     */
    this.fixed = false;
  }
}

function getContainerScale(domainObject) {
  if (domainObject.type === 'telemetry.plot.stacked') {
    return domainObject?.composition?.length;
  }

  return 1;
}

export default Container;

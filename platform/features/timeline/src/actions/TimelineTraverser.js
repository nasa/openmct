/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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

define([], () => {

    /**
     * Builds a list of domain objects which should be included
     * in the CSV export of a given timeline.
     * @param {DomainObject} domainObject the object being exported
     * @constructor
     */
    class TimelineTraverser {
      constructor(domainObject) {
        this.domainObject = domainObject;
      }

    /**
     * Get a list of domain objects for CSV export.
     * @returns {Promise.<DomainObject[]>} a list of domain objects
     */
    buildObjectList() {
        let idSet = {},
            objects = [];

        const addObject = (domainObject) => {
            let id = domainObject.getId(),
                subtasks = [];

            const addCompositionObjects = () => {
                return domainObject.useCapability('composition')
                    .then( (childObjects) => {
                        return Promise.all(childObjects.map(addObject));
                    });
            }

            const addRelationships = () => {
                let relationship = domainObject.getCapability('relationship');
                relationship.getRelatedObjects('modes')
                    .then( (modeObjects) => {
                        return Promise.all(modeObjects.map(addObject));
                    });
            }

            if (!idSet[id]) {
                idSet[id] = true;
                objects.push(domainObject);
                if (domainObject.hasCapability('composition')) {
                    subtasks.push(addCompositionObjects());
                }
                if (domainObject.hasCapability('relationship')) {
                    subtasks.push(addRelationships());
                }
            }

            return Promise.all(subtasks);
        }

        return addObject(this.domainObject).then( () => {
            return objects;
        });
    };
  }
    return TimelineTraverser;

});

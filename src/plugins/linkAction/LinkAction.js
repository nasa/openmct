/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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

export default class LinkAction {
    constructor(openmct) {
        this.name = 'Create Link';
        this.key = 'link';
        this.description = 'Create Link to object in another location.';
        this.cssClass = "icon-link";
        this.group = "action";
        this.priority = 7;

        this.openmct = openmct;
    }

    appliesTo(objectPath) {
        let domainObject = objectPath[0];
        let type = domainObject && this.openmct.types.get(domainObject.type);

        return type && type.definition.creatable;
    }

    invoke(objectPath) {
        this.object = objectPath[0];
        this.parent = objectPath[1];
        this.showForm(this.object, this.parent);
    }

    inNavigationPath() {
        return this.openmct.router.path
            .some(objectInPath => this.openmct.objects.areIdsEqual(objectInPath.identifier, this.object.identifier));
    }

    onSave(changes) {
        let inNavigationPath = this.inNavigationPath();
        if (inNavigationPath && this.openmct.editor.isEditing()) {
            this.openmct.editor.save();
        }

        const parentDomainObjectpath = changes.location || [this.parent];
        const parent = parentDomainObjectpath[0];

        this.linkInNewParent(this.object, parent);
    }

    linkInNewParent(child, newParent) {
        let compositionCollection = this.openmct.composition.get(newParent);

        compositionCollection.add(child);
    }

    showForm(domainObject, parentDomainObject) {
        const formStructure = {
            title: `Link "${domainObject.name}" to a New Location`,
            sections: [
                {
                    rows: [
                        {
                            name: "location",
                            control: "locator",
                            required: true,
                            validate: this.validate(parentDomainObject),
                            key: 'location'
                        }
                    ]
                }
            ]
        };

        this.openmct.forms.showForm(formStructure)
            .then(this.onSave.bind(this));
    }

    validate(currentParent) {
        return (data) => {
            const parentCandidate = data.value[0];
            const currentParentKeystring = this.openmct.objects.makeKeyString(currentParent.identifier);
            const parentCandidateKeystring = this.openmct.objects.makeKeyString(parentCandidate.identifier);
            const objectKeystring = this.openmct.objects.makeKeyString(this.object.identifier);

            if (!parentCandidateKeystring || !currentParentKeystring) {
                return false;
            }

            if (parentCandidateKeystring === currentParentKeystring) {
                return false;
            }

            if (parentCandidateKeystring === objectKeystring) {
                return false;
            }

            const parentCandidateComposition = parentCandidate.composition;
            if (parentCandidateComposition && parentCandidateComposition.indexOf(objectKeystring) !== -1) {
                return false;
            }

            return parentCandidate && this.openmct.composition.checkPolicy(parentCandidate, this.object);
        };
    }
}

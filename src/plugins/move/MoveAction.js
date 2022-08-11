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
export default class MoveAction {
    constructor(openmct) {
        this.name = 'Move';
        this.key = 'move';
        this.description = 'Move this object from its containing object to another object.';
        this.cssClass = "icon-move";
        this.group = "action";
        this.priority = 7;

        this.openmct = openmct;
    }

    invoke(objectPath) {
        this.object = objectPath[0];
        this.oldParent = objectPath[1];

        this.showForm(this.object, this.oldParent);
    }

    inNavigationPath() {
        return this.openmct.router.path
            .some(objectInPath => this.openmct.objects.areIdsEqual(objectInPath.identifier, this.object.identifier));
    }

    navigateTo(objectPath) {
        let urlPath = objectPath.reverse()
            .map(object => this.openmct.objects.makeKeyString(object.identifier))
            .join("/");

        this.openmct.router.navigate('#/browse/' + urlPath);
    }

    addToNewParent(child, newParent) {
        let newParentKeyString = this.openmct.objects.makeKeyString(newParent.identifier);
        let compositionCollection = this.openmct.composition.get(newParent);

        this.openmct.objects.mutate(child, 'location', newParentKeyString);
        compositionCollection.add(child);
    }

    async onSave(changes) {
        let inNavigationPath = this.inNavigationPath(this.object);
        if (inNavigationPath && this.openmct.editor.isEditing()) {
            this.openmct.editor.save();
        }

        const parentDomainObjectpath = changes.location || [this.parent];
        const parent = parentDomainObjectpath[0];

        if (this.openmct.objects.areIdsEqual(parent.identifier, this.oldParent.identifier)) {
            this.openmct.notifications.error(`Error: new location cant not be same as old`);

            return;
        }

        if (changes.name && (changes.name !== this.object.name)) {
            this.object.name = changes.name;
        }

        this.addToNewParent(this.object, parent);
        this.removeFromOldParent(this.object);

        if (!inNavigationPath) {
            return;
        }

        let newObjectPath;
        if (parentDomainObjectpath) {
            newObjectPath = parentDomainObjectpath && [this.object].concat(parentDomainObjectpath);
        } else {
            newObjectPath = await this.openmct.objects.getOriginalPath(this.object.identifier);
            let root = await this.openmct.objects.getRoot();
            let rootChildCount = root.composition.length;

            // if not multiple root children, remove root from path
            if (rootChildCount < 2) {
                newObjectPath.pop(); // remove ROOT
            }
        }

        this.navigateTo(newObjectPath);
    }

    removeFromOldParent(child) {
        let compositionCollection = this.openmct.composition.get(this.oldParent);

        compositionCollection.remove(child);
    }

    showForm(domainObject, parentDomainObject) {
        const formStructure = {
            title: "Move Item",
            sections: [
                {
                    rows: [
                        {
                            key: "name",
                            control: "textfield",
                            name: "Title",
                            pattern: "\\S+",
                            required: true,
                            cssClass: "l-input-lg",
                            value: domainObject.name
                        },
                        {
                            name: "Location",
                            control: "locator",
                            parent: parentDomainObject,
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
            const parentCandidatePath = data.value;
            const parentCandidate = parentCandidatePath[0];

            // check if moving to same place
            if (this.openmct.objects.areIdsEqual(parentCandidate.identifier, currentParent.identifier)) {
                return false;
            }

            // check if moving to a child
            if (parentCandidatePath.some(candidatePath => {
                return this.openmct.objects.areIdsEqual(candidatePath.identifier, this.object.identifier);
            })) {
                return false;
            }

            if (!this.openmct.objects.isPersistable(parentCandidate.identifier)) {
                return false;
            }

            let objectKeystring = this.openmct.objects.makeKeyString(this.object.identifier);

            const parentCandidateComposition = parentCandidate.composition;
            if (parentCandidateComposition && parentCandidateComposition.indexOf(objectKeystring) !== -1) {
                return false;
            }

            return parentCandidate && this.openmct.composition.checkPolicy(parentCandidate, this.object);
        };
    }

    appliesTo(objectPath) {
        let parent = objectPath[1];
        let parentType = parent && this.openmct.types.get(parent.type);
        let child = objectPath[0];
        let childType = child && this.openmct.types.get(child.type);
        let isPersistable = this.openmct.objects.isPersistable(child.identifier);

        if (child.locked || (parent && parent.locked) || !isPersistable) {
            return false;
        }

        return parentType
            && parentType.definition.creatable
            && childType
            && childType.definition.creatable
            && Array.isArray(parent.composition);
    }
}

/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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
import DuplicateTask from './DuplicateTask';

export default class DuplicateAction {
    constructor(openmct) {
        this.name = 'Duplicatee';
        this.key = 'duplicatee';
        this.description = 'Duplicate this object.';
        this.cssClass = "icon-duplicate";

        this.openmct = openmct;
    }

    async invoke(objectPath) {
        let duplicationTask = new DuplicateTask(this.openmct);
        let originalObject = objectPath[0];
        let parent = objectPath[1];
        let userInput = await this.getUserInput(originalObject, parent);
        let newParent = userInput.location;
        let inNavigationPath = this.inNavigationPath(originalObject);

        // legacy check
        if (this.isLegacyDomainObject(newParent)) {
            newParent = await this.convertFromLegacy(newParent);
        }

        // if editing, save
        if (inNavigationPath && this.openmct.editor.isEditing()) {
            this.openmct.editor.save();
        }

        // duplicate
        let newObject = await duplicationTask.duplicate(originalObject, newParent);
        this.updateNameCheck(newObject, userInput.name);

        return;
    }

    async getUserInput(originalObject, parent) {
        let dialogService = this.openmct.$injector.get('dialogService');
        let dialogForm = this.getDialogForm(originalObject, parent);
        let formState = {
            name: originalObject.name
        };
        let userInput = await dialogService.getUserInput(dialogForm, formState);

        return userInput;
    }

    /*
    Copy has two distinct phases. In the first phase a copy plan is
    made in memory. During this phase of execution, the user is
    shown a blocking 'modal' dialog.

    In the second phase, the copying is taking place, and the user
    is shown non-invasive banner notifications at the bottom of the screen.
    */
    showProgress(phase, totalObjects, processed) {
        // this.openmct.notifications.info()
        // if (phase.toLowerCase() === 'preparing' && !this.dialog) {
        //     this.dialog = this.dialogService.showBlockingMessage({
        //         title: "Preparing to copy objects",
        //         hint: "Do not navigate away from this page or close this browser tab while this message is displayed.",
        //         unknownProgress: true,
        //         severity: "info"
        //     });
        // } else if (phase.toLowerCase() === "copying") {
        //     if (this.dialog) {
        //         this.dialog.dismiss();
        //     }
        //
        //     this.openmct.notifications.info("Copying objects");

        //     this.notification.model.progress = (processed / totalObjects) * 100;
        //     this.notification.model.title = ["Copied ", processed, "of ",
        //         totalObjects, "objects"].join(" ");
        // }
    }

    updateNameCheck(object, name) {
        if (object.name !== name) {
            this.openmct.objects.mutate(object, 'name', name);
        }
    }

    inNavigationPath(object) {
        return this.openmct.router.path
            .some(objectInPath => this.openmct.objects.areIdsEqual(objectInPath.identifier, object.identifier));
    }

    getDialogForm(object, parent) {
        return {
            name: "Duplicate Item",
            sections: [
                {
                    rows: [
                        {
                            key: "name",
                            control: "textfield",
                            name: "Folder Name",
                            pattern: "\\S+",
                            required: true,
                            cssClass: "l-input-lg"
                        },
                        {
                            name: "location",
                            cssClass: "grows",
                            control: "locator",
                            validate: this.validate(object, parent),
                            key: 'location'
                        }
                    ]
                }
            ]
        };
    }

    validate(object, currentParent) {
        return (parentCandidate) => {
            let currentParentKeystring = this.openmct.objects.makeKeyString(currentParent.identifier);
            let parentCandidateKeystring = this.openmct.objects.makeKeyString(parentCandidate.getId());
            let objectKeystring = this.openmct.objects.makeKeyString(object.identifier);

            if (!parentCandidate || !currentParentKeystring) {
                return false;
            }

            if (parentCandidateKeystring === currentParentKeystring) {
                return false;
            }

            if (parentCandidate.getId() === objectKeystring) {
                return false;
            }

            if (parentCandidate.getModel().composition.indexOf(objectKeystring) !== -1) {
                return false;
            }

            return this.openmct.composition.checkPolicy(
                parentCandidate.useCapability('adapter'),
                object
            );
        };
    }

    isLegacyDomainObject(domainObject) {
        return domainObject.getCapability !== undefined;
    }

    async convertFromLegacy(legacyDomainObject) {
        let objectContext = legacyDomainObject.getCapability('context');
        let domainObject = await this.openmct.objects.get(objectContext.domainObject.id);

        return domainObject;
    }

    appliesTo(objectPath) {
        let parent = objectPath[1];
        let parentType = parent && this.openmct.types.get(parent.type);
        let child = objectPath[0];
        let locked = child.locked ? child.locked : parent && parent.locked;

        if (locked) {
            return false;
        }

        return parentType
            && parentType.definition.creatable
            && Array.isArray(parent.composition);
    }
}

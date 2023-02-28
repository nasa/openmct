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

export default class RemoveAction {
    #transaction;

    constructor(openmct) {
        this.name = 'Remove';
        this.key = 'remove';
        this.description = 'Remove this object from its containing object.';
        this.cssClass = 'icon-trash';
        this.group = 'action';
        this.priority = 1;

        this.openmct = openmct;

        this.removeFromComposition = this.removeFromComposition.bind(this); // for access to private transaction variable
        this.#transaction = null;
    }

    async invoke(objectPath) {
        let object = objectPath[0];
        let parent = objectPath[1];

        try {
            await this.showConfirmDialog(object);
        } catch (error) {
            return; // form canceled, exit invoke
        }

        await this.removeFromComposition(parent, object);

        if (this.inNavigationPath(object)) {
            this.navigateTo(objectPath.slice(1));
        }
    }

    showConfirmDialog(object) {
        return new Promise((resolve, reject) => {
            let dialog = this.openmct.overlays.dialog({
                title: `Remove ${object.name}`,
                iconClass: 'alert',
                message:
                    'Warning! This action will remove this object. Are you sure you want to continue?',
                buttons: [
                    {
                        label: 'OK',
                        callback: () => {
                            dialog.dismiss();
                            resolve();
                        }
                    },
                    {
                        label: 'Cancel',
                        callback: () => {
                            dialog.dismiss();
                            reject();
                        }
                    }
                ]
            });
        });
    }

    inNavigationPath(object) {
        return this.openmct.router.path.some((objectInPath) =>
            this.openmct.objects.areIdsEqual(
                objectInPath.identifier,
                object.identifier
            )
        );
    }

    navigateTo(objectPath) {
        let urlPath = objectPath
            .reverse()
            .map((object) =>
                this.openmct.objects.makeKeyString(object.identifier)
            )
            .join('/');

        this.openmct.router.navigate('#/browse/' + urlPath);
    }

    async removeFromComposition(parent, child) {
        this.startTransaction();

        const composition = this.openmct.composition.get(parent);
        composition.remove(child);

        if (!this.isAlias(child, parent)) {
            this.openmct.objects.mutate(child, 'location', null);
        }

        if (this.inNavigationPath(child) && this.openmct.editor.isEditing()) {
            this.openmct.editor.save();
        }

        await this.saveTransaction();
    }

    isAlias(child, parent) {
        if (parent === undefined) {
            // then it's a root item, not an alias
            return false;
        }

        const parentKeyString = this.openmct.objects.makeKeyString(
            parent.identifier
        );
        const childLocation = child.location;

        return childLocation !== parentKeyString;
    }

    appliesTo(objectPath) {
        const parent = objectPath[1];
        const parentType = parent && this.openmct.types.get(parent.type);
        const child = objectPath[0];
        const locked = child.locked ? child.locked : parent && parent.locked;
        const isEditing = this.openmct.editor.isEditing();
        const isPersistable = this.openmct.objects.isPersistable(
            child.identifier
        );
        const isAlias = this.isAlias(child, parent);

        if (locked || (!isPersistable && !isAlias)) {
            return false;
        }

        if (isEditing) {
            if (this.openmct.router.isNavigatedObject(objectPath)) {
                return false;
            }
        }

        return (
            parentType &&
            parentType.definition.creatable &&
            Array.isArray(parent.composition)
        );
    }

    startTransaction() {
        if (!this.openmct.objects.isTransactionActive()) {
            this.#transaction = this.openmct.objects.startTransaction();
        }
    }

    async saveTransaction() {
        if (!this.#transaction) {
            return;
        }

        await this.#transaction.commit();
        this.openmct.objects.endTransaction();
        this.#transaction = null;
    }
}

/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
import CreateAction from '@/plugins/formActions/CreateAction';

export default class NewFolderAction {
  constructor(openmct) {
    this.type = 'folder';
    this.name = 'Add New Folder';
    this.key = 'newFolder';
    this.description = 'Create a new folder';
    this.cssClass = 'icon-folder-new';
    this.group = 'action';
    this.priority = 9;

    this._openmct = openmct;
  }

  invoke(objectPath) {
    const parentDomainObject = objectPath[0];
    const createAction = new CreateAction(this._openmct, this.type, parentDomainObject);
    createAction.invoke();
  }

  appliesTo(objectPath) {
    let domainObject = objectPath[0];
    let isPersistable = this._openmct.objects.isPersistable(domainObject.identifier);

    return domainObject.type === this.type && isPersistable;
  }
}

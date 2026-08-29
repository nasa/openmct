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
export const NOTEBOOK_TYPE = 'notebook';
export const RESTRICTED_NOTEBOOK_TYPE = 'restricted-notebook';
export const ANNOTATION_TYPE = 'annotation';
export const EVENT_SNAPSHOTS_UPDATED = 'SNAPSHOTS_UPDATED';
export const NOTEBOOK_DEFAULT = 'DEFAULT';
export const NOTEBOOK_SNAPSHOT = 'SNAPSHOT';
export const NOTEBOOK_VIEW_TYPE = 'notebook-vue';
export const RESTRICTED_NOTEBOOK_VIEW_TYPE = 'restricted-notebook-vue';
export const NOTEBOOK_BASE_INSTALLED = '_NOTEBOOK_BASE_FUNCTIONALITY_INSTALLED';

// these only deals with constants, figured this could skip going into a utils file
export function isNotebookOrAnnotationType(domainObject) {
  return isNotebookType(domainObject) || isAnnotationType(domainObject);
}

export function isNotebookType(domainObject) {
  return [NOTEBOOK_TYPE, RESTRICTED_NOTEBOOK_TYPE].includes(domainObject.type);
}

export function isAnnotationType(domainObject) {
  return [ANNOTATION_TYPE].includes(domainObject.type);
}

export function isNotebookViewType(view) {
  return [NOTEBOOK_VIEW_TYPE, RESTRICTED_NOTEBOOK_VIEW_TYPE].includes(view);
}

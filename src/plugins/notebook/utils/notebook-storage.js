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
import { makeKeyString } from 'objectUtils';

const NOTEBOOK_LOCAL_STORAGE = 'notebook-storage';
let currentNotebookObjectIdentifier = null;
let unlisten = null;

function defaultNotebookObjectChanged(newDomainObject) {
  if (newDomainObject.location !== null) {
    currentNotebookObjectIdentifier = newDomainObject.identifier;

    return;
  }

  if (unlisten) {
    unlisten();
    unlisten = null;
  }

  clearDefaultNotebook();
}

function observeDefaultNotebookObject(openmct, notebookStorage, domainObject) {
  if (
    currentNotebookObjectIdentifier &&
    makeKeyString(currentNotebookObjectIdentifier) === makeKeyString(notebookStorage.identifier)
  ) {
    return;
  }

  removeListener();

  unlisten = openmct.objects.observe(domainObject, '*', defaultNotebookObjectChanged);
}

function removeListener() {
  if (unlisten) {
    unlisten();
    unlisten = null;
  }
}

function saveDefaultNotebook(notebookStorage) {
  window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, JSON.stringify(notebookStorage));
}

export function clearDefaultNotebook() {
  currentNotebookObjectIdentifier = null;
  removeListener();

  window.localStorage.setItem(NOTEBOOK_LOCAL_STORAGE, null);
}

export function getDefaultNotebook() {
  const notebookStorage = window.localStorage.getItem(NOTEBOOK_LOCAL_STORAGE);

  return JSON.parse(notebookStorage);
}

export function getNotebookSectionAndPage(domainObject, sectionId, pageId) {
  const configuration = domainObject.configuration;
  const section = configuration && configuration.sections.find((s) => s.id === sectionId);
  const page = section && section.pages.find((p) => p.id === pageId);

  return {
    section,
    page
  };
}

export async function getDefaultNotebookLink(openmct, domainObject = null) {
  if (!domainObject) {
    return null;
  }

  const path = await openmct.objects
    .getOriginalPath(domainObject.identifier)
    .then(openmct.objects.getRelativePath);
  const { defaultPageId, defaultSectionId } = getDefaultNotebook();

  return `#/browse/${path}?sectionId=${defaultSectionId}&pageId=${defaultPageId}`;
}

export function setDefaultNotebook(openmct, notebookStorage, domainObject) {
  observeDefaultNotebookObject(openmct, notebookStorage, domainObject);
  saveDefaultNotebook(notebookStorage);
}

export function setDefaultNotebookSectionId(sectionId) {
  const notebookStorage = getDefaultNotebook();
  notebookStorage.defaultSectionId = sectionId;
  saveDefaultNotebook(notebookStorage);
}

export function setDefaultNotebookPageId(pageId) {
  const notebookStorage = getDefaultNotebook();
  notebookStorage.defaultPageId = pageId;
  saveDefaultNotebook(notebookStorage);
}

export function validateNotebookStorageObject() {
  const notebookStorage = getDefaultNotebook();
  if (!notebookStorage) {
    return true;
  }

  let valid = false;
  if (notebookStorage) {
    const oldInvalidKeys = ['notebookMeta', 'page', 'section'];
    valid = Object.entries(notebookStorage).every(([key, value]) => {
      const validKey = key !== undefined && key !== null;
      const validValue = value !== undefined && value !== null;
      const hasOldInvalidKeys = oldInvalidKeys.includes(key);

      return validKey && validValue && !hasOldInvalidKeys;
    });
  }

  if (valid) {
    return notebookStorage;
  }

  console.warn('Invalid Notebook object, clearing default notebook storage');

  clearDefaultNotebook();
}

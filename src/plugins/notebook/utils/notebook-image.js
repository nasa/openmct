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
import { v4 as uuid } from 'uuid';

export const DEFAULT_SIZE = {
  width: 30,
  height: 30
};

export function createNotebookImageDomainObject(fullSizeImageURL) {
  const identifier = {
    key: uuid(),
    namespace: ''
  };
  const viewType = 'notebookSnapshotImage';

  return {
    name: 'Notebook Snapshot Image',
    type: viewType,
    identifier,
    configuration: {
      fullSizeImageURL
    }
  };
}

export function getThumbnailURLFromCanvas(canvas, size = DEFAULT_SIZE) {
  const thumbnailCanvas = document.createElement('canvas');
  thumbnailCanvas.setAttribute('width', size.width);
  thumbnailCanvas.setAttribute('height', size.height);
  const ctx = thumbnailCanvas.getContext('2d');
  ctx.globalCompositeOperation = 'copy';
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, size.width, size.height);

  return thumbnailCanvas.toDataURL('image/png');
}

export function getThumbnailURLFromImageUrl(imageUrl, size = DEFAULT_SIZE) {
  return new Promise((resolve) => {
    const image = new Image();

    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;

    image.onload = function () {
      canvas.getContext('2d').drawImage(image, 0, 0, size.width, size.height);
      resolve(canvas.toDataURL('image/png'));
    };

    image.src = imageUrl;
  });
}

export async function saveNotebookImageDomainObject(openmct, object) {
  await openmct.objects.save(object);
}

export async function updateNotebookImageDomainObject(openmct, identifier, fullSizeImage) {
  const domainObject = await openmct.objects.get(identifier);
  const configuration = domainObject.configuration;
  configuration.fullSizeImageURL = fullSizeImage.src;
  try {
    // making a transactions as we can't catch errors on mutations
    if (!openmct.objects.isTransactionActive()) {
      openmct.objects.startTransaction();
    }
    openmct.objects.mutate(domainObject, 'configuration', configuration);
    const transaction = openmct.objects.getActiveTransaction();
    await transaction.commit();
    openmct.objects.endTransaction();
  } catch (error) {
    console.error(`${error.message} -- unable to save image`, error);
    openmct.notifications.error(`${error.message} -- unable to save image`);
  }
}

export function updateNamespaceOfDomainObject(object, namespace) {
  object.identifier.namespace = namespace;

  return object;
}

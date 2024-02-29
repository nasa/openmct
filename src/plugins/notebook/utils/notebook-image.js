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

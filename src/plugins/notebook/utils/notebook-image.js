import uuid from 'uuid';

const DEFAULT_SIZE = {
    width: 50,
    height: 50
};


export function createNotebookImageDomainObject(openmct, fullSizeImageURL, thumbnailImageURL) {
    const identifier = {
        key: uuid(),
        namespace: ''
    };
    const viewType = 'notebookSnapshotImage';

    const object = {
        name: 'Notebook Snapshot Image',
        type: viewType,
        identifier,
        configuration: {
            fullSizeImageURL,
            thumbnailImageURL
        }
    };

    return new Promise((resolve, reject) => {
        openmct.objects.save(object)
            .then(result => {
                if (result) {
                    resolve(object);
                }

                reject();
            })
            .catch(e => {
                console.error(e);
                reject();
            });
    })
}

export function getThumbnailURLFromCanvas (canvas, size = DEFAULT_SIZE) {
    const thumbnailCanvas = document.createElement('canvas');
    thumbnailCanvas.setAttribute('width', size.width);
    thumbnailCanvas.setAttribute('height', size.height);
    const ctx = thumbnailCanvas.getContext('2d');
    ctx.globalCompositeOperation = "copy";
    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, size.width, size.height);

    return thumbnailCanvas.toDataURL('image/png');
};

export function getThumbnailURLFromimageUrl (imageUrl, size = DEFAULT_SIZE) {
    return new Promise(resolve => {
        const image =  new Image();

        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;

        image.onload = function () {
            canvas.getContext('2d')
                .drawImage(image, 0, 0, size.width, size.height);

            resolve(canvas.toDataURL('image/png'));
        }

        image.src = imageUrl;
    });
}

export function updateNotebookImageDomainObject(openmct, identifier, fullSizeImage, thumbnailImageURL) {
    openmct.objects.get(identifier)
        .then(domainObject => {
            const configuration = domainObject.configuration;
            configuration.fullSizeImageURL = fullSizeImage.src;
            configuration.thumbnailImageURL = thumbnailImageURL;

            openmct.objects.mutate(domainObject, 'configuration', configuration);
        });
}

class DomainObjectViewProvider {
  constructor(openmct) {
    this.key = 'doViewProvider';
    this.name = 'Domain Object View Provider';
    this.openmct = openmct;
  }

  canView(domainObject) {
    return domainObject.type === 'imageFileInput' || domainObject.type === 'jsonFileInput';
  }

  view(domainObject, objectPath) {
    let content;

    return {
      show: function (element) {
        const body = domainObject.selectFile.body;
        const type = typeof body;

        content = document.createElement('div');
        content.id = 'file-input-type';
        content.textContent = JSON.stringify(type);
        element.appendChild(content);
      },
      destroy: function (element) {
        element.removeChild(content);
        content = undefined;
      }
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const openmct = window.openmct;

  openmct.types.addType('jsonFileInput', {
    key: 'jsonFileInput',
    name: 'JSON File Input Object',
    creatable: true,
    form: [
      {
        name: 'Upload File',
        key: 'selectFile',
        control: 'file-input',
        required: true,
        text: 'Select File...',
        type: 'application/json',
        property: ['selectFile']
      }
    ]
  });

  openmct.types.addType('imageFileInput', {
    key: 'imageFileInput',
    name: 'Image File Input Object',
    creatable: true,
    form: [
      {
        name: 'Upload File',
        key: 'selectFile',
        control: 'file-input',
        required: true,
        text: 'Select File...',
        type: 'image/*',
        property: ['selectFile']
      }
    ]
  });

  openmct.objectViews.addProvider(new DomainObjectViewProvider(openmct));
});

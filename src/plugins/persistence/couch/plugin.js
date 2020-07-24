import CouchObjectProvider from './CouchObjectProvider';
const NAMESPACE = '';

export default function CouchPlugin(config) {
    return function install(openmct) {
        //openmct.objects.addProvider('', getProvider());
        openmct.objects.addProvider(NAMESPACE, new CouchObjectProvider(openmct, config, NAMESPACE));
    }

    function getProvider() {
        return {
            get: function (identifier) {
                console.log('GET!');
                return Promise.resolve({identifier, name: "Test Folder", type: "folder"});
            },
            create: function (model) {
                console.log('CREATE!');
                return Promise.resolve(model);
            },
            update: function (model) {
                console.log('UPDATE!');
                return Promise.resolve(model);
            }
        };
    }
}

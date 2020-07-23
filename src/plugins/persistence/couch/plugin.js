// import CouchObjectProvider from './CouchObjectProvider';

export default function CouchPlugin(config) {
    return function install(openmct) {
        openmct.objects.addProvider('', getProvider());
    }

    function getProvider() {
        return {
            get: function (identifier) {
                return Promise.resolve({identifier});
            },
            create: function (model) {
                return Promise.resolve(model);
            },
            update: function (model) {
                return Promise.resolve(model);
            }
        };
    }
}

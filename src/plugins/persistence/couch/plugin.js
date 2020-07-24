import CouchObjectProvider from './CouchObjectProvider';
const NAMESPACE = '';

export default function CouchPlugin(config) {
    return function install(openmct) {
        openmct.objects.addProvider(NAMESPACE, new CouchObjectProvider(openmct, config, NAMESPACE));
    }
}

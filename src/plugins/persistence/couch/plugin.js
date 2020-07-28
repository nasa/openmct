import CouchObjectProvider from './CouchObjectProvider';
const NAMESPACE = '';

export default function CouchPlugin(url) {
    return function install(openmct) {
        openmct.objects.addProvider(NAMESPACE, new CouchObjectProvider(openmct, url, NAMESPACE));
    }
}

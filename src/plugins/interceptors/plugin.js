import missingObjectInterceptor from "./missingObjectInterceptor";
import myItemsInterceptor from "./myItemsInterceptor";
import notebookInterceptor from './notebookInterceptor';

export default function plugin() {
    return function install(openmct) {
        myItemsInterceptor(openmct);
        missingObjectInterceptor(openmct);
        notebookInterceptor(openmct);
    };
}

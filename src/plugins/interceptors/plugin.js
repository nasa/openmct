import missingObjectInterceptor from "./missingObjectInterceptor";
import myItemsInterceptor from "./myItemsInterceptor";

export default function plugin() {
    return function install(openmct) {
        myItemsInterceptor(openmct);
        missingObjectInterceptor(openmct);
    };
}

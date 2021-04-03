import missingObjectInterceptor from "./missingObjectInterceptor";
import myItemsInterceptor from "./myItemsInterceptor";

export default function plugin() {
    return function install(openmct) {
        openmct.objects.addRoot({
            namespace: '',
            key: 'mine'
        });
        myItemsInterceptor(openmct);
        missingObjectInterceptor(openmct);
    };
}

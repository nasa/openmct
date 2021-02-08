import { PLANS_FOLDER_KEY, SynchronizedObjectsProvider } from "./SynchronizedObjectsProvider";

export default function (options) {
    return function install(openmct) {
        openmct.objects.addGetInterceptor({
            appliesTo: (identifier, domainObject) => {
                return identifier.key === PLANS_FOLDER_KEY;
            },
            invoke: (identifier, object) => {
                if (object === undefined) {
                    return {
                        identifier: {
                            namespace: '',
                            key: identifier.key
                        },
                        "name": options.name,
                        "type": "folder",
                        "composition": []
                    };
                }

                return object;
            }
        });

        let provider = new SynchronizedObjectsProvider(openmct, options);
    };

}

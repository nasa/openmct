export const PLANS_FOLDER_KEY = 'folder_synchronized_couchdb';
const COUCHDB_PERSISTENCE_SPACE = 'mct';
const MY_ITEMS_LOCATION = 'mine';

export class SynchronizedObjectsProvider {
    constructor(openmct, options) {
        this.openmct = openmct;
        this.filter = options.filter;
        const identifier = {
            namespace: COUCHDB_PERSISTENCE_SPACE,
            key: PLANS_FOLDER_KEY
        };

        this.openmct.objects.get(identifier).then((domainObject) => {
            if (!domainObject.location) {
                this.openmct.objects.get({
                    namespace: COUCHDB_PERSISTENCE_SPACE,
                    key: MY_ITEMS_LOCATION
                }).then((parentObject) => {
                    domainObject.location = this.openmct.objects.makeKeyString(parentObject.identifier);
                    domainObject.modified = Date.now();
                    this.openmct.objects.save(domainObject).then((object) => {
                        const parentComposition = this.openmct.composition.get(parentObject);
                        parentComposition.add(domainObject);
                        parentComposition.load();
                        this.initialize(domainObject);
                    });
                });

            } else {
                this.initialize(domainObject);
            }
        });
    }

    initialize(domainObject) {
        this.domainObject = domainObject;
        this.composition = this.openmct.composition.get(this.domainObject);
        this.subscribe();
        this.openmct.on('destroy', this.unsubscribe.bind(this));
    }

    subscribe() {
        this.openmct.objects.synchronize({
            namespace: COUCHDB_PERSISTENCE_SPACE,
            key: this.domainObject.identifier.key
        }, {
            filter: this.filter,
            callback: this.update.bind(this)
        });
    }

    unsubscribe() {
        this.openmct.objects.deSynchronize({
            namespace: COUCHDB_PERSISTENCE_SPACE,
            key: this.domainObject.identifier.key
        });
    }

    update(changes) {
        changes.forEach(change => {
            const id = change.identifier;
            //Get the object from the persistence store in a centralized place
            // and pass it along to any listeners.
            this.openmct.objects.get(id).then((object) => {
                //Add the object to the parent composition
                this.composition.add(object);
                this.composition.load();
                //Refresh the object for any active views
                this.openmct.objects.refresh(object, '*', object);
            });
        });
    }

}

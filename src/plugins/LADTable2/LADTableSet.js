import EventEmitter from 'EventEmitter';
import LADTable from './LADTable';

export default class LADTableSet extends EventEmitter {
    // 1. change the structure of telemetryObjects to {tablekey: {teleKey: teleObj}}
    // 2. when add lad table. add an event ladtable.on('object-removed', this.removeTelemetryObj);
    constructor(domainObject, openmct) {
        super();
        this.domainObject = domainObject;
        this.openmct = openmct;
        this.tables = {};
        this.headers = {};
        this.composition = undefined;
        this.telemetryObjects = {};

        this.unloadComposition = undefined;
    }

    initialize() {
        this.unloadComposition = this.loadComposition();
    }

    loadComposition() {
        this.composition = this.openmct.composition.get(this.domainObject);

        if (this.composition !== undefined) {
            this.composition.load().then((composition) => {
                composition.forEach(this.addLADTable.bind(this));

                this.composition.on('add', this.addLADTable);
                this.composition.on('remove', this.removeLADTable);

                this.emit('loaded');
            });

            return function unloadComposition() {
                if (this.composition !== undefined) {
                    this.composition.off('add', this.addLADTable);
                    this.composition.off('remove', this.removeLADTable);
                    delete this.composition;
                }
            }.bind(this);
        }
    }

    addLADTable(domainObject) {
        const keyString = this.openmct.objects.makeKeyString(domainObject.identifier);

        this.tables[keyString] = new LADTable(domainObject, this.openmct);

        this.tables[keyString].once('loaded', () => {
            this.addHeaders(this.tables[keyString]);
            this.addTelemetryObjects(this.tables[keyString]);
        });

        this.emit('table-added', this.tables[keyString]);
    }

    removeLADTable(identifier) {
        const keyString = this.openmct.objects.makeKeyString(identifier);

        delete this.tables[keyString];

        this.emit('table-removed', identifier);
    }

    addTelemetryObjects(ladTable) {
        let telemetryObjects = ladTable.telemetryObjects;
        for (let key in telemetryObjects) {
            if (telemetryObjects[key]) {
                let telemetryObject = {};
                telemetryObject.key = this.openmct.objects.makeKeyString(telemetryObjects[key].telemetryObject.identifier);
                telemetryObject.domainObject = telemetryObjects[key].telemetryObject;
                telemetryObject.metadata = this.openmct.telemetry.getMetadata(telemetryObjects[key].telemetryObject);
                telemetryObject.formats = this.openmct.telemetry.getFormatMap(telemetryObject.metadata);
                telemetryObject.limitEvaluator = this.openmct
                    .telemetry
                    .limitEvaluator(telemetryObject.domainObject);
                telemetryObject.valueMetadata = telemetryObject
                    .metadata
                    .valuesForHints(['range'])[0];
                telemetryObject.valueKey = telemetryObject.valueMetadata.key;
                if (!this.telemetryObjects[ladTable.keyString]) {
                    this.telemetryObjects[ladTable.keyString] = {};
                }

                this.telemetryObjects[ladTable.keyString][telemetryObject.key] = telemetryObject;
                this.emit('telemetry-object-added');
            }
        }
    }

    addHeaders(ladTable) {
        let headers = ladTable.headers;
        Object.assign(this.headers, headers);
        this.emit('headers-added');
    }

    destroy() {
        this.unloadComposition();
    }
}

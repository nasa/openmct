import EventEmitter from 'EventEmitter';
import LADTable from './LADTable';

export default class LADTableSet extends EventEmitter {
    constructor(domainObject, openmct) {
        super();
        this.domainObject = domainObject;
        this.openmct = openmct;

        // refer to telemetry table. create an array for lad tables and telemetry objects
        // get the headers from the lad tables
        // when a lad table is added, add it and its telemetry objects to the array
        // add a function to get all the telemetry objects from LAD table in LADTable.js
        this.updateFilters = this.updateFilters.bind(this);
        this.tables = {}; // key: table key, value: lad table
        this.telemetryObjects = {}; // key: table key, value: telemetry object
        this.headers = {};

        // this.initialize();
    }
    initialize() {
        // go through each lad tables and call initialize.
        if (this.domainObject.type === 'LadTableSet') {
            this.filterObserver = this.openmct.objects.observe(this.domainObject, 'configuration.filters', this.updateFilters);
            // somehow configuration is not defined
            // this.filters = this.domainObject.configuration.filters;
            this.loadComposition();
        } else {
            this.addLADTable(this.domainObject);
        }
    }
    loadComposition() {
        this.tableSetComposition = this.openmct.composition.get(this.domainObject);

        if (this.tableSetComposition !== undefined) {
            this.tableSetComposition.load().then((composition) => {
                // console.log(composition);
                composition = composition.filter(this.isLADTableObject);
                composition.forEach(this.addLADTable.bind(this));
                // this.tableSetComposition.on('add', this.addTelemetryObject);
                // this.tableSetComposition.on('remove', this.removeTelemetryObject);
            });
        }
    }
    isLADTableObject(domainObject) {
        // not sure why hasOwnProperty returns false
        // tried adding this.type in LADTable.js but still false
        return domainObject.type === 'LadTable';
        // return Object.prototype.hasOwnProperty.call(domainObject, 'LadTable');
    }
    updateFilters(updatedFilters) {
        let deepCopiedFilters = JSON.parse(JSON.stringify(updatedFilters));

        if (this.filters && !_.isEqual(this.filters, deepCopiedFilters)) {
            this.filters = deepCopiedFilters;
            this.tableRows.clear();
            this.clearAndResubscribe();
        } else {
            this.filters = deepCopiedFilters;
        }
    }
    addLADTable(domainObject) {
        let key = domainObject.identifier.key;
        let ladTable = new LADTable(domainObject, this.openmct);
        this.tables[key] = ladTable;
        this.addTelemetryObject(ladTable);
        this.addHeaders(ladTable);
    }
    addTelemetryObject(ladTable) {
        // add telemetry objects to telemetryObjects
        let telemetryObjects = ladTable.telemetryObjects;
        // console.log('telemetryObjects', ladTable);
    }
    addHeaders(ladTable) {
        let headers = ladTable.configuration.getVisibleHeaders();
        // console.log('headers', headers);
    }
    getHeaders() {
        // return all the headers
    }
    getTelemetryObjects() {
        // return all the telemetry objects in an object
    }
}

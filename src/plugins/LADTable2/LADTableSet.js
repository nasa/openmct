export default class LADTableSet {
    constructor(domainObject, openmct) {
        this.domainObject = domainObject;
        this.openmct = openmct;

        // refer to telemetry table. create an array for lad tables and telemetry objects
        // get the headers from the lad tables
        // when a lad table is added, add it and its telemetry objects to the array
        // add a function to get all the telemetry objects from LAD table in LADTable.js

        this.tables = {};
        this.telemetryObjects = {};
        this.headers = {};

        this.initialize();
    }
    initialize() {
        // go through each lad tables and call initialize.
    }
    getHeaders() {
        // return all the headers
    }
    getTelemetryObjects() {
        // return all the telemetry objects in an object
    }

}

import TelemetryTable from '/src/plugins/telemetryTable/TelemetryTable.js';

export default class LADTable extends TelemetryTable {
    constructor(domainObject, openmct) {
        super(domainObject, openmct);
        this.domainObject = domainObject;
        this.openmct = openmct;
    }
    initialize() {
        if (this.domainObject.type === 'new.ladTable') {
            this.filterObserver = this.openmct.objects.observe(this.domainObject, 'configuration.filters', this.updateFilters);
            this.filters = this.domainObject.configuration.filters;
            this.loadComposition();
        } else {
            this.addTelemetryObject(this.domainObject);
        }
    }
    addTelemetryObject(telemetryObject) {
        this.addColumnsForObject(telemetryObject, true);

        const keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
        let requestOptions = this.buildOptionsFromConfiguration(telemetryObject);
        requestOptions.strategy = 'latest';
        requestOptions.size = 1;
        console.log(requestOptions);
        let columnMap = this.getColumnMapForObject(keyString);
        let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);

        this.incrementOutstandingRequests();

        const telemetryProcessor = this.getTelemetryProcessor(keyString, columnMap, limitEvaluator);
        const telemetryRemover = this.getTelemetryRemover();

        this.removeTelemetryCollection(keyString);

        this.telemetryCollections[keyString] = this.openmct.telemetry
            .requestCollection(telemetryObject, requestOptions);

        this.telemetryCollections[keyString].on('remove', telemetryRemover);
        this.telemetryCollections[keyString].on('add', telemetryProcessor);
        this.telemetryCollections[keyString].load();

        this.decrementOutstandingRequests();

        this.telemetryObjects[keyString] = {
            telemetryObject,
            keyString,
            requestOptions,
            columnMap,
            limitEvaluator
        };

        this.emit('object-added', telemetryObject);
    }
    // requestDataFor(telemetryObject) {
    //     this.incrementOutstandingRequests();
    //     let requestOptions = this.buildOptionsFromConfiguration(telemetryObject);
    //     requestOptions.strategy = 'latest';
    //     requestOptions.size = 1;

    //     return this.openmct.telemetry.request(telemetryObject, requestOptions)
    //         .then(telemetryData => {
    //             let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
    //             let columnMap = this.getColumnMapForObject(keyString);
    //             let limitEvaluator = this.openmct.telemetry.limitEvaluator(telemetryObject);
    //             this.processHistoricalData(telemetryData, columnMap, keyString, limitEvaluator);
    //         }).finally(() => this.decrementOutstandingRequests());
    // }

    // processHistoricalData(telemetryData, columnMap, keyString, limitEvaluator) {
    //     let telemetryRows = telemetryData.map(datum => this.createRow(datum, columnMap, keyString, limitEvaluator));
    //     this.boundedRows.add(telemetryRows);
    // }
}

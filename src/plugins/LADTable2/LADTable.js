import TelemetryTable from '/src/plugins/telemetryTable/TelemetryTable.js';

export default class LADTable extends TelemetryTable {
    // constructor() {
    //     super();
    // }
    initialize() {
        if (this.domainObject.type === 'new.ladTable') {
            // this.filterObserver = this.openmct.objects.observe(this.domainObject, 'configuration.filters', this.updateFilters);
            // this.filters = this.domainObject.configuration.filters;
            this.loadComposition();
        } else {
            this.addTelemetryObject(this.domainObject);
        }
    }
}

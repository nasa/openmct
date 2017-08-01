define(
    ['./Select'],
    function (Select) {

    function KeySelect(conditionConfig, objectSelect, selectManager) {
        var self = this;

        this.config = conditionConfig;
        this.objectSelect = objectSelect;
        this.manager = selectManager;

        this.objectSelect.on('change', onObjectChange);
        this.manager.on('metadata', onMetadataLoad);

        this.select = new Select('key')
        this.select.addOption('','--Key--');

        if (self.manager.metadataLoadCompleted()) {
            onMetadataLoad();
        }

        function onObjectChange(identifier) {
            var selected = self.manager.metadataLoadCompleted() ? self.select.getSelected() : self.config.key;
            self.telemetryMetadata = self.manager.getTelemetryMetadata(identifier[0]) || {};
            self.generateOptions();
            self.select.setSelected(selected);
        }

        function onMetadataLoad() {
            if (self.manager.getTelemetryMetadata(self.config.object)) {
                self.telemetryMetadata = self.manager.getTelemetryMetadata(self.config.object);
                self.generateOptions();
            }
            self.select.setSelected(self.config.key);
        }

        return this.select;
    }

    //populate this select with options based on its current composition
    KeySelect.prototype.generateOptions = function () {
        var items = Object.entries(this.telemetryMetadata).map( function(metaDatum) {
            return [metaDatum[0], metaDatum[1].name];
        });
        items.splice(0, 0, ['','--Key--'])
        this.select.setOptions(items);
    }


    return KeySelect;

});

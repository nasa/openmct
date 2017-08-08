define(['./Select'], function (Select) {

    //wraps a generic select input and populates its input with composition objects
    function ObjectSelect(config, manager) {
        var self = this;

        this.config = config;
        this.manager = manager;

        this.select = new Select('object');
        this.select.addOption('', '--Object--');

        this.compositionObjs = this.manager.getComposition();
        self.generateOptions();

        function onCompositionAdd(obj) {
            self.select.addOption(obj.identifier.key, obj.name);
        }

        function onCompositionRemove() {
            var selected = self.select.getSelected();
            self.generateOptions();
            self.select.setSelected(selected);
        }

        function onCompositionLoad() {
            self.select.setSelected(self.config.object);
        }

        this.manager.on('add', onCompositionAdd);
        this.manager.on('remove', onCompositionRemove);
        this.manager.on('load', onCompositionLoad);

        if (this.manager.loadCompleted()) {
            onCompositionLoad();
        }

        return this.select;
    }

    //populate this select with options based on its current composition
    ObjectSelect.prototype.generateOptions = function () {
        var items = Object.values(this.compositionObjs).map(function (obj) {
            return [obj.identifier.key, obj.name];
        });
        items.splice(0, 0, ['','--Object--']);
        this.select.setOptions(items);
    };

    return ObjectSelect;
});

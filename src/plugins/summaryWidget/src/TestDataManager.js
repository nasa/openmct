define([
    'text!../res/testDataTemplate.html',
    './TestDataItem',
    'zepto',
    'lodash'
], function (
    testDataTemplate,
    TestDataItem,
    $,
    _
) {

    function TestDataManager(domainObject, conditionManager, openmct) {
        var self = this;

        this.domainObject = domainObject;
        this.manager = conditionManager;
        this.openmct = openmct;

        this.evaluator = this.manager.getEvaluator();
        this.domElement = $(testDataTemplate);
        this.config = this.domainObject.configuration.testDataConfig;
        this.testCache = {};

        this.configArea = $('.widget-test-data-content', this.domElement);
        this.itemArea = $('.t-test-data-config', this.domElement);
        this.toggleConfigButton = $('.view-control', this.domElement);
        this.addItemButton = $('.add-item', this.domElement);
        this.testDataInput = $('.t-test-data-checkbox', this.domElement);

        this.onItemChange = this.onItemChange.bind(this);
        this.initItem = this.initItem.bind(this);
        this.removeItem = this.removeItem.bind(this);

        function toggleConfig() {
            self.configArea.toggleClass('expanded');
            self.toggleConfigButton.toggleClass('expanded');
        }

        function toggleTestData(event) {
            var elem = event.target;
            self.evaluator.useTestData(elem.checked);
            self.updateTestCache();
        }

        this.toggleConfigButton.on('click', toggleConfig);
        this.addItemButton.on('click', function () {
            self.initItem();
        });
        this.testDataInput.on('change', toggleTestData);

        this.evaluator.setTestDataCache(this.testCache);
        this.evaluator.useTestData(false);

        this.refreshItems();
    }

    TestDataManager.prototype.getDOM = function () {
        return this.domElement;
    };

    TestDataManager.prototype.initItem = function (sourceItem, sourceIndex) {
        var defaultItem = {
            object: '',
            key: '',
            value: ''
        },
        newItem;

        newItem = sourceItem || defaultItem;
        if (sourceIndex !== undefined) {
            this.config.splice(sourceIndex + 1, 0, newItem);
        } else {
            this.config.push(newItem);
        }
        this.updateDomainObject();
        this.refreshItems();
    };

    TestDataManager.prototype.removeItem = function (removeIndex) {
        _.remove(this.config, function (item, index) {
            return index === removeIndex;
        });
        this.updateDomainObject();
        this.refreshItems();
    };

    TestDataManager.prototype.onItemChange = function (value, property, index) {
        this.config[index][property] = value;
        this.updateDomainObject();
        this.updateTestCache();
    };

    TestDataManager.prototype.updateTestCache = function () {
        this.generateTestCache();
        this.evaluator.setTestDataCache(this.testCache);
        this.manager.triggerTelemetryCallback();
    };

    TestDataManager.prototype.refreshItems = function () {
        var self = this;

        self.items = [];
        $('.t-test-data-item', this.domElement).remove();

        this.config.forEach(function (item, index) {
            var newItem = new TestDataItem(item, index, self.manager);
            newItem.on('remove', self.removeItem);
            newItem.on('duplicate', self.initItem);
            newItem.on('change', self.onItemChange);
            self.items.push(newItem);
        });

        self.items.forEach(function (item) {
            $('li:last-of-type', self.itemArea).before(item.getDOM());
        });

        if (self.items.length === 1) {
            self.items[0].hideButtons();
        }

        this.updateTestCache();
    };

    TestDataManager.prototype.generateTestCache = function () {
        var testCache = this.testCache,
            manager = this.manager,
            compositionObjs = manager.getComposition(),
            metadata;

        testCache = {};
        Object.keys(compositionObjs).forEach(function (id) {
            testCache[id] = {};
            metadata = manager.getTelemetryMetadata(id);
            Object.keys(metadata).forEach(function (key) {
                testCache[id][key] = '';
            });
        });
        this.config.forEach(function (item) {
            if (testCache[item.object]) {
                testCache[item.object][item.key] = item.value;
            }
        });

        this.testCache = testCache;
    };

    TestDataManager.prototype.updateDomainObject = function () {
        this.openmct.objects.mutate(this.domainObject, 'configuration.testDataConfig', this.config);
    };

    return TestDataManager;
});

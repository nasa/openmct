/*global require, window, document*/

require(
    {
        baseUrl: '../js',
        paths: {
            'jquery': 'lib/jquery',
            'dust': 'lib/dust',
            'uuid': 'lib/uuid',
            'moment': 'lib/moment.min',

            'jasmine': '../test/js/lib/jasmine',
            'jasmine-html': '../test/js/lib/jasmine-html',
            'blanket-jasmine': '../test/js/lib/blanket_jasmine',
            'console-runner': '../test/js/lib/console-runner',

            'spec': '../test/js/spec'
        },
        shim: {
            'dust': {
                'exports': 'dust'
            },
            'jasmine': {
                'exports': 'jasmine'
            },
            'jasmine-html': {
                'exports': 'jasmine',
                'deps': ['jasmine']
            },
            'console-runner': {
                'exports': 'jasmine',
                'deps': ['jasmine']
            },
            'blanket-jasmine': {
                'exports': 'blanket',
                'deps': ['jasmine']
            }
        }
    },
    [
        'blanket-jasmine',
        'jasmine-html',
        'console-runner'
    ],
    function (
        blanket,
        jasmine
    ) {
        "use strict";
        blanket.options({
            'filter': ['core/', 'common/', 'data/', 'editor/', 'layout/', 'lists/'],
            'antifilter': 'spec/'
        });
        require(
            [
                'spec/core/promises',
                'spec/core/action/aggregator',
                'spec/core/action/create-action-provider-spec',
                'spec/core/action/create-action-spec',
                'spec/core/action/view',
                'spec/core/aggregators/action-aggregator-spec',
                'spec/core/aggregators/capability-aggregator-spec',
                'spec/core/aggregators/model-aggregator-spec',
                'spec/core/api/domain-object-spec',
                'spec/core/file/ajax.adapter',
                'spec/core/model/merge-models-spec',
                'spec/core/object/aggregator',
                'spec/core/object/capabilities/action-capability-spec',
                'spec/core/object/capabilities/composition-capability-spec',
                'spec/core/object/capabilities/context-capability-spec',
                'spec/core/object/capabilities/contextual-domain-object-spec',
                'spec/core/object/capabilities/core-capability-provider-spec',
                'spec/core/object/capabilities/persistence-capability-spec',
                'spec/core/object/capabilities/refresh-capability-spec',
                'spec/core/object/model/static-model-provider-spec',
                'spec/core/object/object-provider-spec',
                'spec/core/object/persisted-model-provider-spec',
                'spec/core/persistence/caching-persistence-decorator-spec',
                'spec/core/persistence/spec-browser-persistence',
                'spec/core/type/type-capability-provider-spec',
                'spec/core/type/spec-type-impl',
                'spec/core/type/spec-type-provider',
                'spec/core/type/type-property-spec',
                'spec/core/type/type-property-conversion-spec',
                'spec/core/view/aggregator',
                'spec/core/view/css.loader',
                'spec/core/view/dust.adapter',
                'spec/core/view/prioritizer',
                'spec/core/view/template.views',
                'spec/core/view/view',
                'spec/core/view/presentation/require.adapter',
                'spec/core/windowing/windowing-provider-spec',
                'spec/common/actions/common-action-provider-spec',
                'spec/common/actions/navigate-action-spec',
                'spec/common/actions/properties-action-spec',
                'spec/common/actions/properties-dialog-spec',
                'spec/common/dialog/overlay-dialog-provider-spec',
                'spec/common/object/locator-object-wrapper-spec',
                'spec/common/view/composition-presenter-spec',
                'spec/common/view/type-presenter-spec',
                'spec/common/view/browse/presenter',
                'spec/common/view/browse/browse-object-presenter',
                'spec/common/view/control-sets/presenter-folder-switcher',
                'spec/common/view/control-sets/presenter-view-switcher',
                'spec/common/view/controls/checkboxes-presenter',
                'spec/common/view/controls/create-button-presenter-spec',
                'spec/common/view/controls/create-menu-presenter-spec',
                'spec/common/view/controls/datetime-presenter',
                'spec/common/view/controls/form-presenter',
                'spec/common/view/controls/locator-presenter-spec',
                'spec/common/view/controls/select-presenter',
                'spec/common/view/controls/selects-presenter',
                'spec/common/view/controls/textfield-presenter-spec',
                'spec/common/view/items/grid-item-presenter-spec',
                'spec/common/view/items/presenter',
                'spec/common/view/label/label-presenter-spec',
                'spec/common/view/model/model-presenter',
                'spec/common/view/tree/presenter',
                'spec/common/view/tree/presenter-tree-item',
                'spec/data/aggregators/data-aggregator-spec',
                'spec/data/aggregators/subscription-aggregator-spec',
                'spec/data/api/abstract-data-spec',
                'spec/data/capabilities/data-capability-impl-spec',
                'spec/data/capabilities/data-capability-provider-spec',
                'spec/data/capabilities/subscription-capability-impl-spec',
                'spec/data/decorators/throttling-data-decorator-spec',
                'spec/data/view/abstract-data-presenter-spec',
                'spec/editor/actions/cancel-action-spec',
                'spec/editor/actions/edit-action-provider-spec',
                'spec/editor/actions/edit-action-spec',
                'spec/editor/actions/remove-action-spec',
                'spec/editor/actions/save-action-spec',
                'spec/editor/capability/mutation-capability-spec',
                'spec/editor/capability/editable-action-capability-spec',
                'spec/editor/capability/editable-context-capability-spec',
                'spec/editor/capability/editable-persistence-capability-spec',
                'spec/editor/capability/editor-capability-spec',
                'spec/editor/object/editable-domain-object-cache-spec',
                'spec/editor/type/mutable-type-spec',
                'spec/editor/util/drag-util-spec',
                'spec/editor/util/drop-util-spec',
                'spec/editor/util/menu-util-spec',
                'spec/editor/view/feature-view-decorator-spec',
                'spec/editor/view/edit-mode-presenter-spec',
                'spec/editor/view/edit-topbar-presenter-spec',
                'spec/editor/view/elements-presenter-spec',
                'spec/layout/capability/delegation-capability-spec',
                'spec/layout/view/frame-dragger-spec',
                'spec/layout/view/frame-presenter-spec',
                'spec/layout/view/layout-presenter-spec',
                'spec/lists/view/scrolling-populator-spec',
                'spec/lists/view/scrolling-presenter-spec'

            ],
            function () {
                var jasmineEnv = jasmine.getEnv(),
                    htmlReporter,
                    titleReporter;
                jasmineEnv.updateInterval = 250;

                htmlReporter = new jasmine.HtmlReporter();
                //https://github.com/jcarver989/phantom-jasmine/issues/2
                window.console_reporter = new jasmine.ConsoleReporter();

                titleReporter = new jasmine.Reporter();
                titleReporter.reportRunnerResults = function (runner) {
                    document.title = runner.results().passed() ?
                            "PASSING" : "FAILING";
                };

                jasmineEnv.addReporter(htmlReporter);
                jasmineEnv.addReporter(new jasmine.BlanketReporter());
                jasmineEnv.addReporter(window.console_reporter);
                jasmineEnv.addReporter(titleReporter);
                jasmineEnv.specFilter = function (spec) {
                    return htmlReporter.specFilter(spec);
                };
                jasmineEnv.currentRunner().execute();
            }

        );
    }
);

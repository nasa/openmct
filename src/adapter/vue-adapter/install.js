define([
    './main-adapter',
    './tree-adapter',
    './inspector-adapter'
], function (
    MainAdapter,
    TreeAdapter,
    InspectorAdapter
) {

    return function install(layout, openmct) {
        let main = new MainAdapter(layout, openmct);
        let tree = new TreeAdapter(layout, openmct);
        let inspector = new InspectorAdapter(layout, openmct);
    }
});

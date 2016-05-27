define(function () {
    return function todoPlugin(mct) {
        var todoType = new mct.Type({
            metadata: {
                label: "To-Do List",
                glyph: "2",
                description: "A list of things that need to be done."
            },
            initialize: function (model) {
                model.tasks = [];
            },
            creatable: true
        });

        mct.type('example.todo', todoType);

        return mct;
    };
});

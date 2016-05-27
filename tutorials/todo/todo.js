define([
    "text!./todo.html",
    "text!./todo-task.html",
    "zepto"
], function (todoTemplate, taskTemplate, $) {
    /**
     * @param {mct.MCT} mct
     */
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

        todoType.view(mct.regions.main, function (domainObject) {
            var view = new mct.View();

            function render() {
                var domainObject = view.model();
                var $els = $(view.elements());
                var tasks = domainObject.getModel().tasks;
                var $message = $els.find('.example-message');
                var $buttons = {
                    all: $els.find('.example-todo-button-all'),
                    incomplete: $els.find('.example-todo-button-incomplete'),
                    complete: $els.find('.example-todo-button-complete')
                };

                $message.toggle(tasks.length < 1);
            }

            view.elements($(todoTemplate));
            view.on('model', render);
            view.model(domainObject);
            return view;
        });

        mct.type('example.todo', todoType);

        return mct;
    };
});

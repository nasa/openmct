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
                model.tasks = [
                    { description: "This is a task." }
                ];
            },
            creatable: true
        });

        todoType.view(mct.regions.main, function (domainObject) {
            var view = new mct.View({
                state: function () {
                    return {
                        filter: "all"
                    };
                },
                elements: $.bind(null, todoTemplate),
                initialize: function (elements, state, render) {
                    var $els = $(elements);
                    var $buttons = {
                        all: $els.find('.example-todo-button-all'),
                        incomplete: $els.find('.example-todo-button-incomplete'),
                        complete: $els.find('.example-todo-button-complete')
                    };
                    Object.keys($buttons).forEach(function (k) {
                        $buttons[k].on('click', function () {
                            state.filter = k;
                            render();
                        });
                    });
                },
                render: function (elements, domainObject, state) {
                    var $els = $(elements);
                    var tasks = domainObject.getModel().tasks;
                    var $message = $els.find('.example-message');
                    var $list = $els.find('.example-todo-task-list');
                    var $buttons = {
                        all: $els.find('.example-todo-button-all'),
                        incomplete: $els.find('.example-todo-button-incomplete'),
                        complete: $els.find('.example-todo-button-complete')
                    };
                    var filters = {
                        all: function (task) {
                            return true;
                        },
                        incomplete: function (task) {
                            return !task.completed;
                        },
                        complete: function (task) {
                            return task.completed;
                        }
                    };

                    Object.keys($buttons).forEach(function (k) {
                        $buttons[k].toggleClass('selected', state.filter === k);
                    });
                    tasks = tasks.filter(filters[state.filter]);

                    $list.empty();
                    tasks.forEach(function (task) {
                        var $taskEls = $(taskTemplate);
                        $taskEls.find('.example-task-checked')
                            .prop('checked', task.completed);
                        $taskEls.find('.example-task-description')
                            .text(task.description);
                        $list.append($taskEls);
                    });

                    $message.toggle(tasks.length < 1);
                }
            });
            view.model(domainObject);
            return view;
        });

        mct.type('example.todo', todoType);

        return mct;
    };
});

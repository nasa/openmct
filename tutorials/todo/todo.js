define([
    "text!./todo.html",
    "text!./todo-task.html",
    "text!./todo-toolbar.html",
    "text!./todo-dialog.html",
    "../../src/api/events/EventDecorator",
    "zepto"
], function (todoTemplate, taskTemplate, toolbarTemplate, dialogTemplate, eventDecorator, $) {
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

        function TodoView(domainObject) {
            this.domainObject = domainObject;
            this.filterValue = "all";
        }

        TodoView.prototype.show = function (container) {
            this.destroy();

            this.$els = $(todoTemplate);
            this.$buttons = {
                all: this.$els.find('.example-todo-button-all'),
                incomplete: this.$els.find('.example-todo-button-incomplete'),
                complete: this.$els.find('.example-todo-button-complete')
            };

            $(container).empty().append(this.$els);

            this.initialize();
            this.render();

            mct.events.mutation(this.domainObject).on("*", function (value) {
                console.log("model changed");
            });
        };

        TodoView.prototype.destroy = function () {
            if (this.unlisten) {
                this.unlisten();
                this.unlisten = undefined;
            }
        };

        TodoView.prototype.setFilter = function (value) {
            this.filterValue = value;
            this.render();
        };

        TodoView.prototype.initialize = function () {
            Object.keys(this.$buttons).forEach(function (k) {
                this.$buttons[k].on('click', this.setFilter.bind(this, k));
            }, this);
        };

        TodoView.prototype.render = function () {
            var $els = this.$els;
            var domainObject = this.domainObject;
            var tasks = domainObject.getModel().tasks;
            var $message = $els.find('.example-message');
            var $list = $els.find('.example-todo-task-list');
            var $buttons = this.$buttons;
            var filters = {
                all: function () {
                    return true;
                },
                incomplete: function (task) {
                    return !task.completed;
                },
                complete: function (task) {
                    return task.completed;
                }
            };
            var filterValue = this.filterValue;
            var model = domainObject.model;

            Object.keys($buttons).forEach(function (k) {
                $buttons[k].toggleClass('selected', filterValue === k);
            });
            tasks = tasks.filter(filters[filterValue]);

            function renderTasks() {
                $list.empty();
                domainObject.getModel().tasks.forEach(function (task, index) {
                    var $taskEls = $(taskTemplate);
                    var $checkbox = $taskEls.find('.example-task-checked');
                    $checkbox.prop('checked', task.completed);
                    $taskEls.find('.example-task-description')
                        .text(task.description);
                    $checkbox.on('change', function () {
                        var checked = !!$checkbox.prop('checked');
                        domainObject.getModel().tasks[index].completed = checked;
                    });

                    $list.append($taskEls);
                });
            }

            renderTasks();

            $message.toggle(tasks.length < 1);

            mct.Objects.observe(domainObject).on("*", renderTasks);
        };

        function TodoToolbarView(domainObject) {
            this.domainObject = domainObject;
        }

        TodoToolbarView.prototype.show = function (container) {
            var $els = $(toolbarTemplate);
            var $add = $els.find('a.example-add');
            var $remove = $els.find('a.example-remove');
            var domainObject = this.domainObject;

            $(container).append($els);

            $add.on('click', function () {
                var $dialog = $(dialogTemplate),
                    view = {
                        show: function (container) {
                            $(container).append($dialog);
                        },
                        destroy: function () {}
                    };

                mct.dialog(view, "Add a Task").then(function () {
                    var description = $dialog.find('input').val();
                    mct.Objects.mutate(domainObject, function(model) {
                        model.tasks.push({ description: description });
                        return model;
                    });
                });
            });
            $remove.on('click', function () {

            });
        };

        TodoToolbarView.prototype.destroy = function () {

        };

        mct.type('example.todo', todoType);
        mct.view(mct.regions.main, function (domainObject) {
            return todoType.check(domainObject) && new TodoView(eventDecorator(mct, domainObject));
        });
        mct.view(mct.regions.toolbar, function (domainObject) {
            domainObject = eventDecorator(mct, domainObject);
            return todoType.check(domainObject) && new TodoToolbarView(domainObject);
        });

        return mct;
    };
});

define([
    "text!./todo.html",
    "text!./todo-task.html",
    "text!./todo-toolbar.html",
    "text!./todo-dialog.html",
    "zepto"
], function (todoTemplate, taskTemplate, toolbarTemplate, dialogTemplate, $) {
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

        function TodoRenderer(domainObject) {
            this.domainObject = domainObject;
            this.filterValue = "all";
            this.render = this.render.bind(this);
        }

        TodoRenderer.prototype.show = function (container) {
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

            mct.verbs.observe(this.domainObject, this.render);
            mct.selection.on('change', this.render);
        };


        TodoRenderer.prototype.destroy = function () {
            if (this.unlisten) {
                this.unlisten();
                this.unlisten = undefined;
            }
        };

        TodoRenderer.prototype.setFilter = function (value) {
            this.filterValue = value;
            this.render();
        };


        TodoRenderer.prototype.initialize = function () {
            Object.keys(this.$buttons).forEach(function (k) {
                this.$buttons[k].on('click', this.setFilter.bind(this, k));
            }, this);
        };

        TodoRenderer.prototype.render = function () {
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
            var selected = mct.selection.selected();

            Object.keys($buttons).forEach(function (k) {
                $buttons[k].toggleClass('selected', filterValue === k);
            });
            tasks = tasks.filter(filters[filterValue]);

            $list.empty();
            tasks.forEach(function (task, index) {
                var $taskEls = $(taskTemplate);
                var $checkbox = $taskEls.find('.example-task-checked');
                var $desc = $taskEls.find('.example-task-description');
                $checkbox.prop('checked', task.completed);
                $desc.text(task.description);

                $checkbox.on('change', function () {
                    var checked = !!$checkbox.prop('checked');
                    mct.verbs.mutate(domainObject, function (model) {
                        model.tasks[index].completed = checked;
                    });
                });

                $desc.on('click', function () {
                    mct.selection.clear();
                    mct.selection.select({ index: index });
                });

                if (selected.length > 0 && selected[0].index === index) {
                    $desc.addClass('selected');
                }

                $list.append($taskEls);
            });

            $message.toggle(tasks.length < 1);
        };

        function TodoToolbarRenderer(domainObject) {
            this.domainObject = domainObject;
            this.handleSelectionChange = this.handleSelectionChange.bind(this);
        }

        TodoToolbarRenderer.prototype.show = function (container) {
            this.destroy();

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
                    mct.verbs.mutate(domainObject, function (model) {
                        model.tasks.push({ description: description });
                    });
                });
            });
            $remove.on('click', function () {
                var index = mct.selection.selected()[0].index;
                if (index !== undefined) {
                    mct.verbs.mutate(domainObject, function (model) {
                        model.tasks = model.tasks.filter(function (t, i) {
                            return i !== index;
                        });
                        delete model.selected;
                        mct.selection.clear();
                    });
                }
            });
            this.$remove = $remove;
            this.handleSelectionChange();
            mct.selection.on('change', this.handleSelectionChange);
        };

        TodoToolbarRenderer.prototype.handleSelectionChange = function () {
            var selected = mct.selection.selected();
            if (this.$remove) {
                this.$remove.toggle(selected.length > 0);
            }
        };

        TodoToolbarRenderer.prototype.destroy = function () {
            mct.selection.off('change', this.handleSelectionChange);
            this.$remove = undefined;
        };

        var todoView = new mct.View();
        var todoToolbarView = new mct.View();

        todoView.show = function (container, domainObject) {
            var renderer = new TodoRenderer(domainObject);
            renderer.show(container);
            return renderer.destroy.bind(renderer);
        };

        todoToolbarView.show = function (container, domainObject) {
            var renderer = new TodoToolbarRenderer(domainObject);
            renderer.show(container);
            return renderer.destroy.bind(renderer);
        };

        todoView.test = todoToolbarView.test = todoType.test.bind(todoType);

        mct.type('example.todo', todoType);
        mct.view(mct.regions.main, todoView);
        mct.view(mct.regions.toolbar, todoToolbarView);

        return mct;
    };
});

define([
    "text!./todo.html",
    "text!./todo-task.html",
    "text!./todo-toolbar.html",
    "text!./todo-dialog.html",
    "../../src/api/objects/object-utils",
    "zepto"
], function (todoTemplate, taskTemplate, toolbarTemplate, dialogTemplate, utils, $) {
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
            this.tasks = domainObject.tasks;
            this.filterValue = "all";

            this.setTaskStatus = this.setTaskStatus.bind(this);
            this.selectTask = this.selectTask.bind(this);

<<<<<<< HEAD
            this.mutableObject = mct.Objects.getMutable(domainObject);
            this.mutableObject.on('tasks', this.updateTasks.bind(this));
=======
            //If anything on object changes, re-render view
            this.mutableObject.on("*", this.objectChanged);
        };

        TodoView.prototype.show = function (container) {
            var self = this;
            this.destroy();

            self.$els = $(todoTemplate);
            self.$buttons = {
                all: self.$els.find('.example-todo-button-all'),
                incomplete: self.$els.find('.example-todo-button-incomplete'),
                complete: self.$els.find('.example-todo-button-complete')
            };

            $(container).empty().append(self.$els);
>>>>>>> origin/api-tutorials

            this.$el = $(todoTemplate);
            this.$emptyMessage = this.$el.find('.example-no-tasks');
            this.$taskList = this.$el.find('.example-todo-task-list');
            this.$el.on('click', '[data-filter]', this.updateFilter.bind(this));
            this.$el.on('change', 'li', this.setTaskStatus.bind(this));
            this.$el.on('click', '.example-task-description', this.selectTask.bind(this));

<<<<<<< HEAD
            this.updateSelection = this.updateSelection.bind(this);
            mct.selection.on('change', this.updateSelection);
        }

        TodoView.prototype.show = function (container) {
            $(container).empty().append(this.$el);
            this.render();
=======
            self.initialize();
            self.objectChanged(this.domainObject);

            mct.selection.on('change', self.render);
>>>>>>> origin/api-tutorials
        };

        TodoView.prototype.destroy = function () {
            this.mutableObject.stopListening();
            mct.selection.off('change', this.updateSelection);
        };

        TodoView.prototype.updateSelection = function (selection) {
            if (selection && selection.length) {
                this.selection = selection[0].index;
            } else {
                this.selection = -1;
            }
            this.render();
        };

        TodoView.prototype.updateTasks = function (tasks) {
            this.tasks = tasks;
            this.render();
        };

        TodoView.prototype.updateFilter = function (e) {
            this.filterValue = $(e.target).data('filter');
            this.render();
        };

        TodoView.prototype.setTaskStatus = function (e) {
            var $checkbox = $(e.target);
            var taskIndex = $checkbox.data('taskIndex');
            var completed = !!$checkbox.prop('checked');
            this.tasks[taskIndex].completed = completed;
            this.mutableObject.set('tasks[' + taskIndex + '].checked', completed);
        };

        TodoView.prototype.selectTask = function (e) {
            var taskIndex = $(e.target).data('taskIndex');
            mct.selection.clear();
            mct.selection.select({index: taskIndex});
        };

        TodoView.prototype.getFilteredTasks = function () {
            return this.tasks.filter({
                all: function () {
                    return true;
                },
                incomplete: function (task) {
                    return !task.completed;
                },
                complete: function (task) {
                    return task.completed;
                }
            }[this.filterValue]);
        };

        TodoView.prototype.render = function () {
            var filteredTasks = this.getFilteredTasks();
            this.$emptyMessage.toggle(filteredTasks.length === 0);
            this.$taskList.empty();
            filteredTasks
                .forEach(function (task) {
                    var $taskEl = $(taskTemplate),
                        taskIndex = this.tasks.indexOf(task);
                    $taskEl.find('.example-task-checked')
                        .prop('checked', task.completed)
                        .attr('data-task-index', taskIndex);
                    $taskEl.find('.example-task-description')
                        .text(task.description)
                        .toggleClass('selected', taskIndex === this.selection)
                        .attr('data-task-index', taskIndex);

                    this.$taskList.append($taskEl);
                }, this);
        };

        function TodoToolbarView(domainObject) {
            this.tasks = domainObject.tasks;
            this.mutableObject = mct.Objects.getMutable(domainObject);

            this.handleSelectionChange = this.handleSelectionChange.bind(this);

            this.mutableObject.on('tasks', this.updateTasks.bind(this));
            mct.selection.on('change', this.handleSelectionChange);
            this.$el = $(toolbarTemplate);
            this.$remove = this.$el.find('.example-remove');
            this.$el.on('click', '.example-add', this.addTask.bind(this));
            this.$el.on('click', '.example-remove', this.removeTask.bind(this));
        }

        TodoToolbarView.prototype.updateTasks = function (tasks) {
            this.tasks = tasks;
        };

        TodoToolbarView.prototype.addTask = function () {
            var $dialog = $(dialogTemplate),
                view = {
                    show: function (container) {
                        $(container).append($dialog);
                    },
                    destroy: function () {}
                };

            mct.dialog(view, "Add a Task").then(function () {
                var description = $dialog.find('input').val();
                this.tasks.push({description: description});
                this.mutableObject.set('tasks', this.tasks);
            }.bind(this));
        };

        TodoToolbarView.prototype.removeTask = function () {
            if (this.selection >= 0) {
                this.tasks.splice(this.selection, 1);
                this.mutableObject.set('tasks', this.tasks);
                mct.selection.clear();
                this.render();
            }
        };

        TodoToolbarView.prototype.show = function (container) {
            var self = this;
            this.destroy();
            this.$els = $(toolbarTemplate);
            this.render();
            $(container).append(this.$els);
        };

        TodoToolbarView.prototype.render = function () {
            var self = this;
            var $els = this.$els;

            self.mutableObject = mct.Objects.getMutable(this.domainObject);

            var $add = $els.find('a.example-add');
            var $remove = $els.find('a.example-remove');

            $add.on('click', function () {
                var $dialog = $(dialogTemplate),
                    view = {
                        show: function (container) {
                            $(container).append($dialog);
                        },
                        destroy: function () {}
                    };

                new mct.Dialog(view, "Add a Task").show().then(function () {
                    var description = $dialog.find('input').val();
                    var tasks = self.mutableObject.get('tasks');
                    tasks.push({ description: description });
                    self.mutableObject.set('tasks', tasks);
                });
            });
            $remove.on('click', function () {
                var index = mct.selection.selected()[0].index;
                if (index !== undefined) {
                    var tasks = self.mutableObject.get('tasks').filter(function (t, i) {
                        return i !== index;
                    });
                    self.mutableObject.set("tasks", tasks);
                    self.mutableObject.set("selected", undefined);
                    mct.selection.clear();
                }
            });
            self.$remove = $remove;
            self.handleSelectionChange();
            mct.selection.on('change', self.handleSelectionChange);
        };

        TodoToolbarView.prototype.handleSelectionChange = function () {
            var selected = mct.selection.selected();
            if (this.$remove) {
                this.$remove.toggle(selected.length > 0);
            }
            this.render();
        };

        TodoToolbarView.prototype.destroy = function () {
            mct.selection.off('change', this.handleSelectionChange);
            this.mutableObject.stopListening();
        };

        mct.type('example.todo', todoType);
        mct.view(mct.regions.main, {
            view: function (domainObject) {
                return new TodoView(domainObject);
            },
            canView: todoType.check.bind(todoType)
        });

        mct.view(mct.regions.toolbar, {
            view: function (domainObject) {
                return new TodoToolbarView(domainObject);
            },
            canView: todoType.check.bind(todoType)
        });

        return mct;
    };
});

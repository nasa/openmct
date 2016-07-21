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
            this.domainObject = domainObject;
            this.mutableObject = undefined;

            this.filterValue = "all";
            this.render = this.render.bind(this);
            this.objectChanged = this.objectChanged.bind(this);
        }

        TodoView.prototype.objectChanged = function (object) {
            if (this.mutableObject) {
                this.mutableObject.stopListening();
            }
            this.mutableObject = mct.Objects.getMutable(object);
            this.render();

            //If anything on object changes, re-render view
            this.mutableObject.on("*", this.objectChanged);
        };

        TodoView.prototype.show = function (container) {
            var self = this;
            this.destroy();

            mct.Objects.get(utils.parseKeyString(self.domainObject.getId())).then(function (object) {
                self.$els = $(todoTemplate);
                self.$buttons = {
                    all: self.$els.find('.example-todo-button-all'),
                    incomplete: self.$els.find('.example-todo-button-incomplete'),
                    complete: self.$els.find('.example-todo-button-complete')
                };

                $(container).empty().append(self.$els);

                self.initialize();
                self.objectChanged(object)
            });
        };

        TodoView.prototype.destroy = function () {
            if (this.mutableObject) {
                this.mutableObject.stopListening();
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

            mct.selection.on('change', this.render);
        };

        TodoView.prototype.render = function () {
            var $els = this.$els;
            var mutableObject = this.mutableObject;
            var tasks = mutableObject.get('tasks');
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
                    mutableObject.set("tasks." + index + ".completed", checked);
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

        function TodoToolbarView(domainObject) {
            this.domainObject = domainObject;
            this.mutableObject = undefined;

            this.handleSelectionChange = this.handleSelectionChange.bind(this);
        }

        TodoToolbarView.prototype.show = function (container) {
            var self = this;
            this.destroy();

            mct.Objects.get(utils.parseKeyString(this.domainObject.getId())).then(function (wrappedObject){

                self.mutableObject = mct.Objects.getMutable(wrappedObject);

                var $els = $(toolbarTemplate);
                var $add = $els.find('a.example-add');
                var $remove = $els.find('a.example-remove');

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
            });
        };

        TodoToolbarView.prototype.handleSelectionChange = function () {
            var selected = mct.selection.selected();
            if (this.$remove) {
                this.$remove.toggle(selected.length > 0);
            }
        };

        TodoToolbarView.prototype.destroy = function () {
            mct.selection.off('change', this.handleSelectionChange);
            this.$remove = undefined;
            if (this.mutableObject) {
                this.mutableObject.stopListening();
            }
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

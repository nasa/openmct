define(function () {
    // Form to display when adding new tasks
    var NEW_TASK_FORM = {
        name: "Add a Task",
        sections: [{
            rows: [{
                name: 'Description',
                key: 'description',
                control: 'textfield',
                required: true
            }]
        }]
    };

    function TodoController($scope, dialogService) {
        var showAll = true,
            showCompleted;

        // Persist changes made to a domain object's model
        function persist() {
            var persistence =
                $scope.domainObject.getCapability('persistence');
            return persistence && persistence.persist();
        }

        // Remove a task
        function removeTaskAtIndex(taskIndex) {
            $scope.domainObject.useCapability('mutation', function (model) {
                model.tasks.splice(taskIndex, 1);
            });
            persist();
        }

        // Add a task
        function addNewTask(task) {
            $scope.domainObject.useCapability('mutation', function (model) {
                model.tasks.push(task);
            });
            persist();
        }

        // Change which tasks are visible
        $scope.setVisibility = function (all, completed) {
            showAll = all;
            showCompleted = completed;
        };

        // Check if current visibility settings match
        $scope.checkVisibility = function (all, completed) {
            return showAll ? all : (completed === showCompleted);
        };

        // Toggle the completion state of a task
        $scope.toggleCompletion = function (taskIndex) {
            $scope.domainObject.useCapability('mutation', function (model) {
                var task = model.tasks[taskIndex];
                task.completed = !task.completed;
            });
            persist();
        };

        // Check whether a task should be visible
        $scope.showTask = function (task) {
            return showAll || (showCompleted === !!(task.completed));
        };

        // Handle selection state in edit mode
        if ($scope.selection) {
            // Expose the ability to select tasks
            $scope.selectTask = function (taskIndex) {
                $scope.selection.select({
                    removeTask: function () {
                        removeTaskAtIndex(taskIndex);
                        $scope.selection.deselect();
                    },
                    taskIndex: taskIndex
                });
            };

            // Expose a check for current selection state
            $scope.isSelected = function (taskIndex) {
                return ($scope.selection.get() || {}).taskIndex ===
                    taskIndex;
            };

            // Expose a view-level selection proxy
            $scope.selection.proxy({
                addTask: function () {
                    dialogService.getUserInput(NEW_TASK_FORM, {})
                        .then(addNewTask);
                }
            });
        }
    }

    return TodoController;
});

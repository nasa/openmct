define(function () {
  function ListViewController($scope){
      this.$scope = $scope;
    $scope.orderByField = 'title';
    $scope.reverseSort = false;

    this.updateView()

    this.unlisten = $scope.domainObject.getCapability('mutation')
        .listen(this.updateView.bind(this));

  }
  ListViewController.prototype.updateView = function(){
      this.$scope.domainObject.useCapability('composition')
        .then(function (composees){
          var formattedComposees = this.formatComposees(composees);
          this.$scope.composees = formattedComposees;
          this.$scope.data = {composees: formattedComposees}
      }.bind(this)
      );
  }

  ListViewController.prototype.formatComposees = function(composees){
      var formatted = []
      composees.forEach(function (composition){
        formatted.push({
          icon: composition.getCapability('type').getCssClass(),
          title: composition.model.name,
          type: composition.getCapability('type').getName(),
          persisted: new Date(composition.model.persisted).toUTCString(),
          modified: new Date(composition.model.modified).toUTCString(),
          asDomainObject: composition
        });
      });

      return formatted;
  }

  return ListViewController;
});

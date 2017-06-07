define(function () {
  function ListViewController($scope){
    
    $scope.domainObject.useCapability('composition')
      .then(function (composees){
        var formattedComposees = formatComposees(composees);
        $scope.composees = formattedComposees;
      }
    );

    function formatComposees(composees){
      var formatted = []
      composees.forEach(function (composition){
        formatted.push({
          icon: composition.getCapability('type').getCssClass(),
          title: composition.model.name,
          type: composition.getCapability('type').getName(),
          persisted: new Date(composition.model.persisted).toUTCString(),
          modified: new Date(composition.model.modified).toUTCString()
        });
      });
      return formatted;
    }

  }
  return ListViewController;
});

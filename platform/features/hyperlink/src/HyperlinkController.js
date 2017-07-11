define(
    [],
    function () {
        function HyperlinkController($scope) {
          this.$scope = $scope
        }

        /*Function used to return if the property openNewTab should be true and a new tab should be opened
        false and the hyperlink should open in the same window
        */
        HyperlinkController.prototype.openNewTab = function()
        {
          if(this.$scope.domainObject.getModel().openNewTab[0]=="thisTab"){
                return false
            }
            else{
              return true
            }
        }
        /*Returns true if the property of the hyperlink should create a button, false if a link is desired
        */
        HyperlinkController.prototype.isButton = function()
        {
          if(this.$scope.domainObject.getModel().displayFormat[0]=="link"){
              return false
          }
          return true
        }
        return HyperlinkController;
  }

);

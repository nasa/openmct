//TODO Add filter for duplications/
describe('Create Button', function() {
    beforeEach(require('../common/Launch'));
   //it('should hava title "My Items"', function(){
     //       expect(browser.getTitle()).toEqual('My Items');
    //});
    it('should find create menu to be invisible', function(){
        expect(element(by.css('[ng-show="createController.isActive()"]')).isDisplayed()).toBeFalsy();
    });
    it('should find create menu only visable after the create button clicked', function(){
        element(by.css('[ng-click="createController.toggle()"]')).click();
        expect(element(by.css('[ng-show="createController.isActive()"]')).isDisplayed()).toBeTruthy();
    });
    it('should find create menu only visable after the create button clicked', function(){
        element(by.css('[ng-click="createController.toggle()"]')).click();
        expect(element(by.css('[ng-show="createController.isActive()"]')).isDisplayed()).toBeTruthy();
    });

});

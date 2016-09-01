define(['./MCT', './api/Type'], function (MCT, Type) {
    /**
     * Open MCT is an extensible web application for building mission
     * control user interfaces. This module is itself an instance of
     * [MCT]{@link module:openmct.MCT}, which provides an interface for
     * configuring and executing the application.
     *
     * @exports openmct
     * @borrows Type as Type
     * @borrows MCT as MCT
     */
    var openmct = new MCT();

    openmct.MCT = MCT;
    openmct.Type = Type;

    return openmct;
});

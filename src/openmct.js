define(['./MCT'], function (MCT) {
    /**
     * Open MCT is an extensible web application for building mission
     * control user interfaces. This module is itself an instance of
     * [MCT]{@link module:openmct.MCT}, which provides an interface for
     * configuring and executing the application.
     *
     * @exports openmct
     */
    var openmct = new MCT();

    return openmct;
});

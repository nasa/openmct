define(['./OpenMCT'], function (OpenMCT) {
    /**
     * This is Open MCT.
     * @exports mct
     * @type {OpenMCT}
     */
    var mct = new OpenMCT();

    mct.OpenMCT = OpenMCT;

    return mct;
});


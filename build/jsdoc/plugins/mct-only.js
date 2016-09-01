module.exports = {
    handlers: {
        processingComplete: function (e) {
            e.doclets.forEach(function (doclet) {
                var memberof = doclet.memberof || "";
                var longname = doclet.longname || "";

                doclet.ignore = longname !== 'module:openmct' &&
                    memberof.indexOf('module:openmct') !== 0;
            });
        }
    }
};

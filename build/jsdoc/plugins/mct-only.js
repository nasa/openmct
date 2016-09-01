module.exports = {
    handlers: {
        newDoclet: function (e) {
            var doclet = e.doclet;
            var memberof = doclet.memberof || "";
            var longname = doclet.longname || "";

            if (longname !== 'module:openmct' && memberof.indexOf('module:openmct') !== 0) {
                e.preventDefault = true;
                e.stopPropagation = true;
                doclet.ignore = true;
            }
        }
    }
};

module.exports = {
    handlers: {
        newDoclet: function (e) {
            var doclet = e.doclet;
            var memberof = doclet.memberof || "";
            var longname = doclet.longname || "";

            if (longname !== 'mct' && memberof.indexOf('mct') !== 0) {
                e.preventDefault = true;
                e.stopPropagation = true;
                doclet.ignore = true;
            }
        }
    }
};

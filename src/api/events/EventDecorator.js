define([],
    function () {
        function EventDecorator(mct, domainObject) {
            domainObject.model = new Proxy(domainObject.model, {
                'set': function(target, name, value) {
                    mct.events.mutation(domainObject).emit(name, value);
                }
            })
            return domainObject;
        }

        return EventDecorator;
});

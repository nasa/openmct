define([],
    function () {
        function EventDecorator(mct, domainObject) {
            if (domainObject._proxied){
                return domainObject;
            }

            Object.defineProperty(domainObject, "_proxied", {value: true, writable: false, enumerable: false, readable: true});

            var handler = function (path){
                return {
                    'set': function (target, name, value) {
                        target[name] = value;
                        mct.events.mutation(domainObject).emit([path, name].join("."), value);
                        mct.events.mutation(domainObject).emit("any", value);
                        return true;
                    }
                }
            };
            function decorateObject(object, property, path) {
                // Decorate object with a proxy
                var value = object[property] = new Proxy(object[property], handler(path));

                // Enumerate properties and decorate any sub objects with
                // proxies
                Object.keys(object[property]).filter(function (key){
                    return typeof(value[key]) === "object";
                }).forEach(function (key) {
                    decorateObject(object[property], key, [path, key].join("."));
                });
            }

            decorateObject(domainObject, "model", "model");

            return domainObject;
        }

        return EventDecorator;
});

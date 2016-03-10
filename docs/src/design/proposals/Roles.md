# Roles

Roles are presented as an alternative formulation to capabilities
(dynamic behavior associated with individual domain objects.)

Specific goals here:

* Dependencies of individual scripts should be clear.
* Domain objects should be able to selectively exhibit a wide
  variety of behaviors.

## Developer Use Cases

1. Checking for the existence of behavior.
2. Using behavior.
3. Augmenting existing behaviors.
4. Overriding existing behaviors.
5. Adding new behaviors.

## Overview of Proposed Solution

Remove `getCapability` from domain objects; add roles as external
services which can be applied to domain objects.

## Interfaces

```nomnoml
[Factory.<T, V>
  |
  - factoryFn : function (V) : T
  |
  + decorate(decoratorFn : function (T, V) : T, options? : RegistrationOptions)
]-:>[function (V) : T]

[RegistrationOptions |
  + priority : number or string
]<:-[RoleOptions |
  + validate : function (DomainObject) : boolean
]

[Role.<T> |
  + validate(domainObject : DomainObject) : boolean
  + decorate(decoratorFn : function (T, V) : T, options? : RoleOptions)
]-:>[Factory.<T, DomainObject>]
[Factory.<T, DomainObject>]-:>[Factory.<T, V>]
```

## Examples

### 1. Checking for the existence of behavior

```js
function PlotViewPolicy(telemetryRole) {
    this.telemetryRole = telemetryRole;
}
PlotViewPolicy.prototype.allow = function (view, domainObject) {
    return this.telemetryRole.validate(domainObject);
};
```

### 2. Using behavior

```js
PropertiesAction.prototype.perform = function () {
    var mutation = this.mutationRole(this.domainObject);
    return this.showDialog.then(function (newModel) {
        return mutation.mutate(function () {
            return newModel;
        });
    });
};
```

### 3. Augmenting existing behaviors

```js
// Non-Angular style
mct.roles.persistenceRole.decorate(function (persistence) {
    return new DecoratedPersistence(persistence);
});

// Angular style
myModule.decorate('persistenceRole', ['$delegate', function ($delegate) {
    return new DecoratedPersistence(persistence);
}]);
```

### 4. Overriding existing behaviors

```js
// Non-Angular style
mct.roles.persistenceRole.decorate(function (persistence, domainObject) {
    return domainObject.getModel().type === 'someType' ?
            new DifferentPersistence(domainObject) :
            persistence;
}, {
    validate: function (domainObject, next) {
        return domainObject.getModel().type === 'someType' || next();
    }
});
```

### 5. Adding new behaviors

```js
function FooRole() {
    mct.Role.apply(this, [function (domainObject) {
        return new Foo(domainObject);
    }]);
}

FooRole.prototype = Object.create(mct.Role.prototype);

FooRole.prototype.validate = function (domainObject) {
    return domainObject.getModel().type === 'some-type';
};

//
myModule.roles.fooRole = new FooRole();
```


## Evaluation

### Benefits

* Simplifies/standardizes augmentation or replacement of behavior associated
  with specific domain objects.
* Minimizes number of abstractions; roles are just factories.
* Clarifies dependencies; roles used must be declared/acquired in the
  same manner as services.

### Detriments

* Externalizes functionality which is conceptually associated with a
  domain object.
* Relies on factories, increasing number of interfaces to be concerned
  with.
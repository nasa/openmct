# Entanglement

Entanglement is the process of moving, copying, and linking domain objects
in such a way that their relationships are impossible to discern.

This bundle provides move, copy, and link functionality.  Acheiving a state of 
entanglement is left up to the end user.


## Services implement logic

Each method (move, copy, link) is implemented as a service, and each service
provides two functions: `validate` and `perform`.

`validate(object, parentCandidate)` returns true if the `object` can be 
move/copy/linked into the `parentCandidate`'s composition.

`perform(object, parentObject)` move/copy/links the `object` into the 
`parentObject`'s composition.

## Actions implement user interactions

Actions are used to expose move/copy/link to the user.  They prompt for input
where necessary, and complete the actions.

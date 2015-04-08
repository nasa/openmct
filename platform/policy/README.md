# Overview

This bundle provides support for policy in Open MCT Web. Policy can be
used to limit the applicability of certain actions, or more broadly,
to provide an extension point for arbitrary decisions.

# Services

This bundle introduces the `policyService`, which may be consulted for
various decisions which are intended to be open for extension.

The `policyService` has a single method, `allow`, which takes three
arguments and returns a boolean value (true if policy says this decision
should be allowed, false if not):

* `category`: A string identifying which kind of decision is being made.
  Typically, this will be a non-plural form of an extension type that is
  being filtered down; for instance, to check whether or not a given
  action should be returned by an `actionService`, one would use the
  `action` category of extension.
* `candidate`: An object representing the thing which shall or shall not
  be allowed. Usually, this will be an instance of an extension of the
  category defined above.
  * This does need to be the case; additional
    policies which are not specific to any extension may also be defined
    and consulted using unique `category` identifiers. In this case, the
    type of the object delivered for the candidate may be unique to the
    policy type.
* `context`: An object representing the context in which the decision is
  occurring. Its contents are specific to each policy category.
* `callback`: Optional; a function to call if the policy decision is
  rejected. This function will be called with the `message` string
  (which may be undefined) of whichever individual policy caused the
  operation to fail.

_Design rationale_: Returning a boolean here limits the amount of
information that can be conveyed by a policy decision, but has the
benefit of simplicity. In MCT on the desktop, the policy service
returned a more complex object with both a boolean status and a string
message; the string message was used rarely (by only around 15% of
policy user code) and as such is made optional in the call itself here.

_Design rationale_: Returning a boolean instead of a promise here implies
that policy decisions must occur synchronously. This limits the logic
which can be involved in a policy decision, but broadens its applicability;
policy is meant to be used by a variety of other services to separate out
a certain category of business logic, and a synchronous response means
that this capability may be utilized by both synchronous and asynchronous
services. Additionally, policies will often be used in loops (e.g. to filter
down a set of applicable actions) where latency will have the result of
harming the user experience (e.g. the user right-clicks and gets stuck
waiting for a bunch of policy decisions to complete before a menu showing
available actions can appear.)

The `policyService` is a composite service; it may be modified by adding
decorators, aggregators, etc.

## Service Components

The policy service is most often used by decorators for other composite
services. For instance, this bundle contains a decorator for `actionService`
which filters down the applicable actions exposed by that service based
on policy.

# Policy Categories

This bundle introduces `action` as a policy category. Policies of this
category shall take action instances as their candidate argument, and
action contexts as their context argument.

# Extensions

This bundle introduces the `policies` category of extension. An extension
of this category should have both an implementation, as well as the following
metadata:

* `category`: A string identifying which kind of policy decision this
  effects.
* `message`: Optional; a human-readable string describing the policy
  decision when it fails.

An extension of this category must also have an implementation which
takes no arguments to its constructor and provides a single method,
`allow`, which takes two arguments, `candidate` and `context` (see
descriptions above under documentation for `actionService`) and returns
a boolean indicating whether or not it allows the policy decision.

Policy decisions require consensus among all policies; that is, if a
single policy returns false, then the policy decision as a whole returns
false. As a consequence, policies should be written in a permissive
manner; that is, they should be designed to prohibit behavior under a
specific set of conditions (by returning false), and allow any behavior
which does not match those conditions (by returning true.)
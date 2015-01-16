The "about" bundle provides the default lower-right application logo,
as well as the dialog it launches when clicked.

# Extensions

The About dialog contains several line items to display different
version properties (e.g. when built, et cetera.) Plug-ins may wish
to introduce additional line items here, in particular if the
platform is used to build a separately-branded piece of software.

This bundle introduces the `versions` extension category to support this.
An extension of this category is implementation-less (all information
is contained within its declaration) and should include the following
fields:

* `name`: The name to display for this version line-item; this may
  be the name of the software, or something else such as "Built".
* `value`: The value to display corresponding to this line-item;
  this is typically a version number, revision identifier, or
  human-readable date.
* `description`: Optional; a longer-form description of this line
  item, to display in a tooltip.

Ordering of these line items is handled by extension priority; see framework
documentation (`platform/framework/README.md`) for information on how
this ordering is handled.

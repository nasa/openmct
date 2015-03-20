This bundle provides an Overwrite/Cancel dialog when persisting
domain objects, if persistence fails. It is meant to be paired
with a persistence adapter which performs revision-checking
on update calls, in order to provide the user interface for
choosing between Overwrite and Cancel in that situation.
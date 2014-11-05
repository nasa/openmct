Framework-level components for Open MCT Web. This is Angular and Require, 
with an extra layer to mediate between them and act as an extension 
mechanism to allow plug-ins to be introduced declaratively.

# Implementation Notes

The framework layer is responsible for performing a four-stage initialization
process. These stages are:

1. __Loading definitions.__ JSON declarations are loaded for all bundles which
   will constitute the application, and wrapped in a useful API for subsequent
   stages. _Sources in `src/load`_
2. __Resolving extensions.__ Any scripts which provide implementations for
   extensions exposed by bundles are loaded, using Require.
   _Sources in `src/resolve`_
3. __Registering extensions.__ Resolved extensions are registered with Angular,
   such that they can be used by the application at run-time. This stage
   includes both registration of Angular built-ins (directives, controllers,
   routes, and services) as well as registration of non-Angular extensions.
   _Sources in `src/register`_
4. __Bootstrapping.__ JSON declarations are loaded for all bundles which
   will constitute the application, and wrapped in a useful API for subsequent
   stages. _Sources in `src/bootstrap`_

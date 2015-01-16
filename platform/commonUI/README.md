This directory contains bundles containing common user interface
elements of Open MCT Web; that is, the user interface for the application
as a whole (as opposed to for specific features) is implemented here.

# Extensions

This bundles adds a `stylesheets` extension category used to inject CSS
from bundles. These extensions are declaration-only (no scripted
implementation is needed or used); a single property, `stylesheetUrl`,
should be provided, with a path to the relevant CSS file (including
extension) relative to the resources directory for that bundle.

Links to these CSS files are appended to the head when the application
is started. These are added in standard priority order (see documentation
for the framework layer); the order of inclusion of style sheets can
change the way they are handled/understood by the browser, so priority
can be used to provide control over this order.
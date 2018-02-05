# Security Guide

Open MCT is a rich client with plugin support that executes as a single page
web application in a browser environment. Security concerns and
vulnerabilities associated with the web as a platform should be considered
before deploying Open MCT (or any other web application) for mission or
production usage.

This document describes several important points to consider when developing
for or deploying Open MCT securely. Other resources such as
[Open Web Application Security Project (OWASP)](https://www.owasp.org)
provide a deeper and more general overview of security for web applications.


## Security Model

Open MCT has been architected assuming the following deployment pattern:

* A tagged, tested Open MCT version will be used.
* Externally authored plugins will be installed.
* A server will provide persistent storage, telemetry, and other shared data.
* Authorization, authentication, and auditing will be handled by a server.


## Security Procedures

The Open MCT team secures our code base using a combination of code review,
dependency review, and periodic security reviews. Static analysis performed 
during automated verification additionally safeguards against common 
coding errors which may result in vulnerabilities.


### Code Review

All contributions are reviewed by internal team members. External
contributors receive increased scrutiny for security and quality,
and must sign a licensing agreement.

### Dependency Review

Before integrating third-party dependencies, they are reviewed for security
and quality, with consideration given to authors and users of these
dependencies, as well as review of open source code.

### Periodic Security Reviews

Open MCT's code, design, and architecture are periodically reviewed
(approximately annually) for common security issues, such as the
[OWASP Top Ten](https://www.owasp.org/index.php/Category:OWASP_Top_Ten_Project).


## Security Concerns

Certain security concerns deserve special attention when deploying Open MCT,
or when authoring plugins.

### Identity Spoofing

Open MCT issues calls to web services with the privileges of a logged in user.
Compromised sources (either for Open MCT itself or a plugin) could
therefore allow malicious code to execute with those privileges.

To avoid this:

* Serve Open MCT and other scripts over SSL (https rather than http)
  to prevent man-in-the-middle attacks.
* Exercise precautions such as security reviews for any plugins or
  applications built for or with Open MCT to reject malicious changes.

### Information Disclosure

If Open MCT is used to handle or display sensitive data, any components
(such as adapter plugins) must take care to avoid leaking or disclosing
this information. For example, avoid sending sensitive data to third-party
servers or insecure APIs.

### Data Tampering

The web application architecture leaves open the possibility that direct
calls will be made to back-end services, circumventing Open MCT entirely.
As such, Open MCT assumes that server components will perform any necessary
data validation during calls issues to the server.

Additionally, plugins which serialize and write data to the server must
escape that data to avoid database injection attacks, and similar.

### Repudiation

Open MCT assumes that servers log any relevant interactions and associates
these with a user identity; the specific user actions taken within the
application are assumed not to be of concern for auditing.

In the absence of server-side logging, users may disclaim (maliciously,
mistakenly, or otherwise) actions taken within the system without any
way to prove otherwise.

If keeping client-level interactions is important, this will need to be
implemented via a plugin.

### Denial-of-service

Open MCT assumes that server-side components will be insulated against
denial-of-service attacks. Services should only permit resource-intensive
tasks to be initiated by known or trusted users.

### Elevation of Privilege

Corollary to the assumption that servers guide against identity spoofing,
Open MCT assumes that services do not allow a user to act with
inappropriately escalated privileges. Open MCT cannot protect against
such escalation; in the clearest case, a malicious actor could interact
with web services directly to exploit such a vulnerability.

## Additional Reading

The following resources have been used as a basis for identifying potential
security threats to Open MCT deployments in preparation of this document:

* [STRIDE model](https://www.owasp.org/index.php/Threat_Risk_Modeling#STRIDE)
* [Attack Surface Analysis Cheat Sheet](https://www.owasp.org/index.php/Attack_Surface_Analysis_Cheat_Sheet)
* [XSS Prevention Cheat Sheet](https://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet)

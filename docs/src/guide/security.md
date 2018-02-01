# Security

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
* Authorization, authentication, and auditing will be handled by the server.


## Security Procedures

* **Code review**: All contributions are reviewed by internal team members.
  External contributors receive increased scrutiny for security and quality,
  and must sign a licensing agreement.
* **Dependency review**: Before integrating third-party dependencies, they
  are reviewed for security and quality, with consideration given to authors
  and users of these dependencies, as well as review of open source code.
* **Periodic security reviews**: Open MCT's code, design, and architecture
  are periodically reviewed (approximately annually) for common security
  issues, such as the
  [OWASP Top Ten](https://www.owasp.org/index.php/Category:OWASP_Top_Ten_Project).


## Security Concerns

* Identity spoofing may occur if source code is compromiesd.
  * Prevent man-in-the-middle attacks using SSL (https rather than http).
    * Avoid serving up a malicious version of Open MCT or your plugins.

* Information disclosure.
  * Don't send sensitive data to third-party servers or insecure APIs.

* Tampering with data
  * Assume that the server validates data.
  * Plugins which serialize and write data to server must escape that data.

* Repudiation
  * Assume server logs relevant actions associated with a user identity.
  * If client-side behavior must be logged, plugins must do this.

* Denial-of-service
  * We assume resource-intensive tasks cannot be initiated by untrusted users.

* Elevation of privilege
  * Assume this


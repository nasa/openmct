# Security Policy

The Open MCT team secures our code base using a combination of code review, dependency review, and periodic security reviews. Static analysis performed during automated verification additionally safeguards against common coding errors which may result in vulnerabilities.

### Reporting a Vulnerability

For general defects, please for a [Bug Report](https://github.com/nasa/openmct/issues/new/choose)

To report a vulnerability for Open MCT please send a detailed report to [arc-dl-openmct](mailto:arc-dl-openmct@mail.nasa.gov). 

See our [top-level security policy](https://github.com/nasa/openmct/security/policy) for additional information.

### CodeQL and LGTM

The [CodeQL GitHub Actions workflow](https://github.com/nasa/openmct/blob/master/.github/workflows/codeql-analysis.yml) is available to the public. To review the results, fork the repository and run the CodeQL workflow. 

CodeQL is run for every pull-request in GitHub Actions.

The project is also monitored by [LGTM](https://lgtm.com/projects/g/nasa/openmct/) and is available to public.

### ESLint

Static analysis is run for every push on the master branch and every pull request on all branches in Github Actions. 

For more information about ESLint, visit https://eslint.org/.

### General Support

For additional support, please open a [Github Discussion](https://github.com/nasa/openmct/discussions). 

If you wish to report a cybersecurity incident or concern, please contact the NASA Security Operations Center either by phone at 1-877-627-2732 or via email address soc@nasa.gov.

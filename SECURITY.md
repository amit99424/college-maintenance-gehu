# Security Policy

Thank you for taking the time to help improve the security of the **Campus Care**.

We take security seriously and appreciate responsible disclosure of any vulnerabilities.

---

## Security Features

This project implements several security measures to protect user data and ensure secure access.

### Authentication

* Firebase Authentication using Email & Password.
* Secure login and signup process.
* Session management handled by Firebase Authentication.

### Authorization

* Role-Based Access Control (RBAC).
* Separate dashboards for:

  * Student
  * Staff
  * Supervisor
  * Admin
* Users can only access features permitted for their role.

### Data Protection

* Firestore Security Rules to restrict unauthorized database access.
* Complaint ownership validation.
* Protected routes for authenticated users only.
* Secure storage of user data in Firebase.

### Input Validation

* Form validation on all user inputs.
* Required field validation before submission.
* Image upload validation.

### Secure Communication

* HTTPS encryption provided through Vercel deployment.
* Secure communication between client and Firebase services.

---

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately.

Please include the following information:

* Description of the vulnerability
* Steps to reproduce
* Expected behavior
* Actual behavior
* Screenshots (if available)

You can report vulnerabilities by opening a private issue or contacting the project maintainer.

---

## Security Best Practices

Users are encouraged to:

* Use a strong password.
* Never share login credentials.
* Log out after using shared devices.
* Keep their browser updated.
* Report suspicious activity immediately.

---

## Disclaimer

This project was developed for educational purposes as a college maintenance management system. While reasonable security practices have been implemented, users should not deploy this project in production without conducting a comprehensive security review and implementing additional security measures appropriate for their environment.

---

## Acknowledgements

We appreciate everyone who helps improve the security and reliability of this project through responsible disclosure.

MILL MANAGER - LICENSE GENERATION
=================================

IMPORTANT
---------
Keep license-private.pem private.
Never send it to a client.
Never add it to GitHub.
Never include the developer folder in a client ZIP.

ONE-TIME SETUP
--------------
Place your private signing key here:

developer\license-private.pem

The matching public key is already embedded in:
backend\src\license.js

GENERATE A CLIENT LICENSE
-------------------------
1. Ask the client for the Installation ID shown on the activation screen.
2. Double-click:

   developer\Generate License.bat

3. Enter the Installation ID exactly as shown.
4. Enter the client / mill name.
5. Copy the generated Activation Code.
6. Send only the Activation Code to the client.
7. Client pastes it into the activation screen and clicks Activate Software.

RESULT
------
The Activation Code is cryptographically signed and tied to that
Installation ID.

Copying the same application and license data to another Windows
installation will not activate it because the machine ID will differ.

SUPPORT
-------
Developer WhatsApp:
+92 306 5726063

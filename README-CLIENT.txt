MILL MANAGEMENT v1.0
====================

FIRST TIME ONLY
---------------
1. Extract the complete Mill-Management-v1.0 ZIP to a normal folder.
2. Open the extracted folder.
3. Double-click:
      Setup Mill Manager.bat
4. Wait for "Setup complete".
5. The software will open automatically.
6. On first use, the Activation screen will appear.
7. Click "Copy ID" or "Send Installation ID on WhatsApp".
8. Send the Installation ID to the developer.
9. Paste the Activation Code provided by the developer.
10. Click "Activate Software".

Node.js does NOT need to be installed on this computer.

The license is for one Windows computer and is non-transferable.
Copying the application folder to another computer will require a separate activation.

Setup creates:
- A "Mill Manager" shortcut on the Desktop.
- Automatic background server startup after Windows login.

Do not run the software directly from inside the ZIP.


DAILY USE
---------
Normally, simply double-click:

    Mill Manager

on the Desktop.

The shortcut will:
- Start the local Mill Management server if it is not already running.
- Open the application in the default browser.

Application address:

    http://localhost:4000

There is no need to open Command Prompt, npm, VS Code, or Node.js manually.


AFTER RESTARTING WINDOWS
------------------------
The Mill Management server starts automatically in the background after
the user logs into Windows.

The user only needs to click the Desktop "Mill Manager" shortcut to open
the software in the browser.

If the application folder is moved to another location after setup,
run "Setup Mill Manager.bat" again so the shortcuts use the new location.


FIRST CLIENT DATA
-----------------
This release starts with a clean database.

Before normal daily use:
1. Open Settings.
2. Open Opening Data.
3. Enter the current position from the manual books:
   - Product stock
   - Bardana
   - Customer balances
   - Source balances

Opening Data is intended to bring the current manual-book position into
the software without recreating every old transaction.


BACKUP
------
Double-click:

    Backup Data.bat

A dated database backup is created inside:

    backups\

Recommended:
- Make a backup at the end of each working day.
- Periodically copy the backups folder to a USB drive or another computer.


IMPORTANT DATA FILE
-------------------
The live database is:

    backend\data\mill.db

Do not delete, rename, or manually edit this file after real data has
been entered.


TRANSFER TO ANOTHER COMPUTER
----------------------------
The clean ZIP can be copied to another Windows computer and installed
using "Setup Mill Manager.bat".

For an existing mill installation with real data:
1. Make a backup first.
2. Transfer the application folder or restore the database carefully.
3. Do not replace a real mill.db with an empty database.


LICENSE
-------
This software is licensed for one Windows computer.

The About section shows:
- Licensed client / mill name
- Single Computer, Non-transferable license
- Installation ID

If Windows is reinstalled or the software is moved to another computer,
contact the developer for activation support.

SOFTWARE VERSION
----------------
Mill Management v1.0

Developed & Maintained by:
Engineer Hayat Ullah Abid
LinkedIn: https://www.linkedin.com/in/hayat-gis
Portfolio: https://hayatkhan20.github.io/hayat


SUPPORT
-------
If an issue appears, record:
- Screen/page being used
- What was entered
- Exact error message
- Screenshot if possible

Do not delete or reinstall the database as a troubleshooting step
without making a backup first.

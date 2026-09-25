MILL MANAGEMENT v1.0
====================

FIRST TIME ONLY
---------------
1. Make sure Node.js 20 or newer is installed.
2. Double-click: install.bat
3. Wait until "Setup complete" appears.

DAILY USE
---------
1. Double-click: Start Mill Manager.bat
2. Your browser will open automatically.
3. Keep the Mill Management Server window open while using the software.
4. When finished, close the browser and then close the server window.

FIRST CLIENT DATA
-----------------
This release starts with a clean database.

Before normal daily use:
1. Go to Settings.
2. Open Opening Data.
3. Enter the current opening balances/stocks from the manual books:
   - Product stock
   - Bardana
   - Customer balances
   - Source balances

Do not enter old transactions unless they are specifically required.
Opening Data is intended to carry the current manual-book position into the software.

BACKUP
------
Run "Backup Data.bat" regularly.

A dated database backup will be created inside:
backups\

Recommended:
- Backup at the end of each working day.
- Copy the backups folder to a USB drive or another computer periodically.

IMPORTANT DATA FILE
-------------------
The live database is:

backend\data\mill.db

Do not delete or rename this file after real data has been entered.

SOFTWARE VERSION
----------------
Mill Management v1.0

Developed & Maintained by:
Engineer Hayat Ullah Abid
LinkedIn: https://www.linkedin.com/in/hayat-gis
Portfolio: https://hayatkhan20.github.io/hayat

SUPPORT
-------
If an issue appears during real use, note:
- What screen you were using
- What you entered
- The exact error message
- A screenshot if possible

Do not reinstall or delete the database to fix an issue without first making a backup.

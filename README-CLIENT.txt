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



UPDATING AN EXISTING CLIENT INSTALLATION
----------------------------------------
If the mill is already using the software and has real data:

1. Do NOT delete the existing Mill Manager folder.
2. Do NOT run a clean-install ZIP over the existing data.
3. Extract the developer-provided Mill-Management-Update ZIP into the
   existing Mill Manager folder.
4. Double-click:
      Apply Mill Manager Update.bat
5. The updater automatically:
   - creates a database backup,
   - stops the old server,
   - updates application files,
   - keeps the existing mill.db,
   - keeps license.json,
   - keeps the backups folder,
   - restarts Mill Manager.

The database is migrated automatically when the updated server starts.


WHEAT PURCHASE AND WHEAT INCOMING
---------------------------------
Wheat Purchase and physical Wheat Incoming are separate records.

Wheat Purchase records:
- Source
- Purchased bags
- Purchased KG
- Rate / cost
- Amount paid

Physical wheat stock increases only when Wheat Incoming is recorded.

One purchase can have multiple incoming deliveries. Each delivery records:
- Date
- Bags
- KG
- Car number
- Remarks

The software tracks:
- Purchased wheat
- Wheat received
- Wheat remaining to receive
- Advance wheat received

Older Wheat Purchase records are automatically converted into one completed
incoming receipt during the update so existing stock is not lost or doubled.


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


NOVEMBER 2026 CLIENT FEEDBACK - PENDING TEST / NEXT UPDATE
--------------------------------------------------------
This update adds a Daily Activities / Roznamcha cash register.

- Amadan records actual CASH RECEIVED, not the full sales-bill value.
  Example: bill Rs 50,000, paid Rs 10,000 -> Amadan Rs 10,000.
- Subsequent customer cash payments, including advances, are included on
  their actual payment dates.
- Source payments, employee payments and paid expenses count as Kharch.
- Purchases on credit and salary accrued but not paid DO NOT count as cash out.
- Bank payments/receipts are recorded on accounts but do not affect cash in hand.
- Set Opening Cash once based on cash physically available at the start.
  Closing Cash = Opening Cash + Cash In - Cash Out.
  Closing cash is carried into the following day's opening.
- Other Cash Adjustment is for miscellaneous entries ONLY; do not double-enter
  a transaction already recorded elsewhere in the application.
- Monthly Product Sales is found under Sales and reports quantity and sale
  value, whether or not the customer has paid.
- Sales Bill and WhatsApp bill now show Ijaz Flour Mills Battagram.
- Amount inputs show comma separators, e.g. 1,000,000.
- Settings > Data Management has an irreversible full business-data reset.
  Reset makes a verified database backup first and preserves the license,
  application, product catalog and backup files.

IMPORTANT:
Before updating a production client's machine, test the complete workflow
with a COPY of a real installation and verify backups. Never run Reset on a
client installation to test a new software version.

DEVELOPER ACCEPTANCE CHECK:
1. Add sale Rs 50,000 with Rs 10,000 received by Cash.
   Verify Sales shows Rs 50,000 and Roznamcha shows Rs 10,000 Cash In only.
2. Receive another Rs 5,000 cash from the same customer on the next date.
   Verify next day's Cash In is Rs 5,000 and customer pending decreases.
3. Record a Wheat Purchase Rs 100,000 with no payment; cash out must be zero.
4. Pay the source Rs 20,000 cash; Kharch should increase by exactly Rs 20,000.
5. Add paid expense Rs 2,000 cash; verify closing cash.
6. Repeat a payment using Bank; source/customer balance changes but the
   physical cashbook is unaffected.
7. Verify bill header and WhatsApp message branding.
8. Verify monthly product sales updates after editing a bill.
9. Verify monetary inputs display commas and POST unformatted numbers.
10. Verify full database backup and restore behavior with TEST DATA ONLY.


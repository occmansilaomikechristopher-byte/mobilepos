# User Manual - Web and Mobile System

## 1. Overview

This system combines a payroll and operations web platform with a mobile application for attendance, POS, inventory, sales, and reporting. The solution is designed for Admin, Cashier, and Owner users to manage daily operations from a desktop browser or from a mobile device.

The system includes:

- Payroll and employee management
- Attendance and DTR monitoring
- Branch and product management
- POS sales and quotations
- Inventory tracking and stock adjustments
- Mobile approval and reporting
- Owner dashboards and summaries

---

## 2. Access and Roles

### 2.1 Login

Use the web login page to sign in with the assigned username and password.

This system only allows the following access roles:

- Admin
- Cashier
- Owner

### 2.2 Mobile Login

The mobile app starts at a main screen and routes the user based on role:

- Admin -> Dashboard / Web access portal
- Cashier -> POS Dashboard
- Owner -> Owner Dashboard

Users can also be redirected to the permission page if device permissions are missing.

---

## 3. Web System Functions

## 3.1 Dashboard

The Dashboard shows key operational metrics, including:

- Total employees
- Total inactive employees
- Active branches
- Total payrolls
- Pending and approved DTR records
- Monthly payroll count trend
- Top job positions by employee count
- Recent payrolls and DTR uploads

Use this page to quickly review operational health before processing payroll or checking attendance.

## 3.2 Employee Management

### Features

- Create new employee records
- Import employee data
- Edit employee details
- Activate or deactivate employees
- Set position, salary, basic pay, OT rate, and payroll type
- Configure contribution deductions and allowances
- Filter employees by status, payroll type, and position

### Typical steps

1. Open the Employee page.
2. Click Create Employee.
3. Enter employee number, name, position, salary, and basic pay.
4. Select payroll type: Monthly or Weekly.
5. Save the record.
6. Use edit buttons to update details.

### Notes

- Employee codes and identifying fields should remain unique.
- Inactive employees are kept in the system for history and reporting.

## 3.3 Attendance and DTR

### Features

- Record employee attendance
- Upload biometric DTR files
- Review time logs
- Capture late and under-time values
- View employee logs by date and branch
- Manually push attendance when needed

### Common tasks

- Open Attendance or DTR tools from the web menu.
- Review attendance logs by employee and date.
- Upload biometric data if the business uses fingerprint or device logs.
- Correct attendance problems through manual entry or system adjustment.

## 3.4 Payroll Management

### Features

- Generate payroll cycles
- Set payroll period dates
- Calculate wages, allowances, deductions, and contributions
- View payroll items per employee
- Approve or lock payroll data
- Print or export payslips

### Typical tasks

1. Open Payroll.
2. Create a payroll period.
3. Choose payroll type and date range.
4. Process payroll calculations.
5. Validate allowances, deductions, OT, and contributions.
6. Finalize and print payslips.

### Included payroll calculations

- Basic pay
- Overtime rate
- Late deductions
- Under-time deductions
- Employee contributions
- Allowances
- Net pay

## 3.5 POS System

The POS module is used to manage branches, categories, products, and sales.

### POS menus

- Branches
- Categories
- Products
- Inventory
- Sales
- Damage Items
- Owner Requisition

### Branches

Functions:

- Add branch code and branch name
- Add city, phone, and email
- Activate or deactivate branches
- Track branch records without permanent deletion

### Product Categories

Functions:

- Create categories such as beverages, food, or electronics
- Edit category names and descriptions
- Set status as active or inactive

### Products

Functions:

- Add product code and name
- Assign category and branch
- Set price, cost, unit, stock quantity, and reorder level
- Manage product status
- Review inventory levels

### Inventory

Functions:

- Track quantity on hand
- Monitor reorder levels
- View stock status by branch
- Detect low inventory situations

### Sales and Transactions

Functions:

- Record transactions
- Track sales by cashier and branch
- Review sales history
- Generate summary totals by date or branch

## 3.6 Damage and Requisition

### Damage Items

Use this module to record damaged or unusable stock.

Functions:

- Log damaged items
- Capture quantity and reason
- Associate damaged stock with branch
- Update inventory records appropriately

### Owner Requisition

This module allows the branch or operation team to request supplies or stock from the owner.

Functions:

- Create requisition request codes
- Add requested items and quantities
- Add description and branch information
- Track status and payments

## 3.7 Reports and Exports

The web system supports business reporting such as:

- Sales reports
- Inventory reports
- Payroll reports
- Attendance reports
- Quotations reports
- Payable reports

Reports can be used for reviewing performance, checking losses, validating payroll, and preparing owner summaries.

---

## 4. Mobile Application Functions

## 4.1 Main Mobile Flow

When the app opens, it checks required device permissions and then directs the user to the proper screen based on role.

### Roles in the mobile app

- Admin: Access to dashboard and overall system access
- Cashier: Access to POS area and sales tools
- Owner: Access to owner dashboard and reports

## 4.2 Portal Screen

The portal screen allows the user to choose between:

- Admin dashboard
- Point of Sale

This acts as the entry point for operations and store activities.

## 4.3 Timekeeper / Attendance Mobile Features

The mobile system supports employee attendance tracking and operational checks.

### Main features

- View employee list
- Check attendance details
- View DTR logs
- Record attendance using mobile devices
- Review employee logs and summaries
- Capture biometric or device-based logs

### Typical tasks

1. Open the Timekeeper portal.
2. Select the employee or attendance list.
3. Review logs or mark attendance.
4. Upload or sync DTR records if required.
5. Confirm entries for payroll processing.

## 4.4 POS Dashboard Mobile

The POS dashboard provides daily sales and branch operation tools.

### Tabs in the POS dashboard

- POS
- Products
- Inventory
- Sales
- Quotations
- Logs
- Damage
- Request
- Settings

### POS tab

Used to handle daily sales transactions and item checkout.

### Products tab

- View product list
- Search or review available items
- Manage pricing and stock details

### Inventory tab

- Track stock levels
- Check reorder alerts
- Maintain branch inventory

### Sales tab

- Review sales entries
- Check transaction totals
- View recent sales activity

### Quotations tab

Used to create and track quotations with customer details and pricing estimates.

### Damage tab

- Record damaged goods
- Update stock after damage loss
- Maintain branch accountability

### Request tab

Used for internal stock requests or owner requisitions.

### Settings tab

- Switch to payroll portal if allowed
- Logout safely

## 4.5 Mobile Notifications and Alerts

The mobile app may show notifications for:

- New product updates
- Changes in stock state
- Alerts for inventory or requisition updates
- Sales and operation notices

Notifications help staff react quickly to branch operational changes.

## 4.6 Owner Mobile Dashboard

The owner dashboard displays summary information from branch operations.

### Report cards include

- Sales report
- Inventory report
- Attendance report
- Payable report
- Payroll report
- Quotations report

This helps owners monitor business performance without needing to open the desktop web system.

---

## 5. Best Practices

- Always log out after each shift when using a shared device.
- Keep employee records updated and active statuses correct.
- Check inventory before sales transactions for stock availability.
- Review payroll calculations before final approval.
- Use the DTR review page to validate late or absent entries.
- Keep branch and product codes consistent for clean reports.
- Record damage and requisition entries immediately to maintain accuracy.

---

## 6. Common User Tasks

### Create employee

1. Open Employee page.
2. Click Create Employee.
3. Fill required fields.
4. Save the record.

### Process attendance

1. Open Attendance or DTR tools.
2. Review employees for the selected date.
3. Check log details and correct missing entries if needed.
4. Save or finalize the record.

### Create payroll

1. Open Payroll.
2. Define payroll period.
3. Run calculations.
4. Validate items.
5. Finalize and print payslips.

### Add product

1. Open POS > Products.
2. Click Add Product.
3. Enter product code, name, category, branch, and price.
4. Save the product.

### Record a sale

1. Open POS dashboard.
2. Select the POS tab.
3. Choose items.
4. Complete checkout.
5. Verify the sale total.

### Create quotation

1. Open Quotation tab.
2. Enter customer and product data.
3. Set materials, dimensions, options, and pricing.
4. Save or review quotation summary.

---

## 7. Troubleshooting

### Login problems

- Confirm username and password.
- Confirm the correct user role and account is assigned.
- Check if the account is active.

### Mobile permission issues

- Allow microphone and storage/media permissions when prompted.
- Reopen the app after granting permissions.

### Inventory mismatch

- Review stock entries in Products and Inventory.
- Check damaged items and sales entries.
- Validate branch assignment for each product.

### Payroll errors

- Check employee basic pay and OT rate.
- Confirm attendance logs and deductions.
- Verify contribution settings before finalizing payroll.

---

## 8. Summary

This system is designed to support the full business cycle from employee management to payroll, stock control, and mobile operations. Whether using the web dashboard or mobile application, users can perform daily tasks efficiently with role-based access, tracking, and reporting.

This manual covers the main functions and workflows used by administrators, staff, owners, and mobile operators.

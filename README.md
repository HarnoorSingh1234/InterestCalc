# RK Enterprises Interest Calculator

![RK Enterprises Interest Calculator](https://i.imgur.com/xyzabc.png)

## 🌐 Live Demo

Visit the live application at: [https://interest-calc-n91e.vercel.app/](https://interest-calc-n91e.vercel.app/)

## 📋 Overview

The RK Enterprises Interest Calculator is a specialized financial tool designed for tracking vouchers, calculating interest, and maintaining ledger records. This application helps businesses manage their financial records by automatically calculating interest on outstanding balances based on voucher entries.

## 🚀 Features

- **Voucher Management**: Add, edit, and delete vouchers with debit/credit entries
- **Interest Calculation**: Automatically calculate interest on outstanding balances
- **Date Range Filtering**: View calculations for specific time periods
- **Export Options**: Generate PDF and Excel reports for your records
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Mode**: Choose your preferred theme for better viewing experience
- **Local Storage**: Data persists in your browser's local storage

## 🧭 Navigation Guide

1. **Home Page**: View a summary dashboard of all your vouchers and financial status.
   - Click "Add Voucher" to create new voucher entries
   - Click "Calculate Interest" to view interest calculations

2. **Add Voucher Page**: Create new voucher entries.
   - Fill in the voucher details (number, date, amount, description)
   - Select voucher type (Debit/Credit)
   - Click "Add Voucher" to save

3. **Calculate Interest Page**: View interest calculations for your vouchers.
   - Set the calculation date (defaults to current date)
   - Adjust interest rate as needed
   - Review vouchers and their interest calculations
   - Use the export buttons to generate PDF or Excel reports

4. **Settings Page**: Configure application settings.
   - Set default interest rate
   - Toggle between light and dark mode
   - Clear local storage data if needed

## 💻 Technology Stack

- **Framework**: Next.js 15.3.2
- **UI Components**: Custom components with Tailwind CSS
- **PDF Generation**: jsPDF and jsPDF-autotable
- **Excel Export**: xlsx library
- **Date Handling**: date-fns
- **Local Storage**: Browser's localStorage API

## 🚶‍♀️ Getting Started

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/HarnoorSingh1234/InterestCalc.git
   cd InterestCalc
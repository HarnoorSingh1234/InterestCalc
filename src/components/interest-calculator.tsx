"use client";

import { useState, useEffect } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Download, FileSpreadsheet, Printer } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { LedgerTable } from "./ledger-table";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface Voucher {
  id: string;
  voucherNo: string;
  voucherDate: Date;
  description: string;
  type: "debit" | "credit";
  amount: number;
}

interface CalculationResult {
  partyName: string;
  asOfDate: Date;
  gracePeriod: number;
  interestRate: number;
  debitVouchers: any[];
  creditVouchers: any[];
  allVouchers: any[];
  totalDebit: number;
  totalCredit: number;
  totalInterest: number;
}

export function InterestCalculator() {
  const [partyName, setPartyName] = useState("");
  const [asOfDate, setAsOfDate] = useState<Date>(new Date());
  const [gracePeriod, setGracePeriod] = useState(15);
  const [interestRate, setInterestRate] = useState(18);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
    const [paymentRemainingAmounts, setPaymentRemainingAmounts] = useState<Record<string, number>>({});

  // Load settings from localStorage on component mount
  useEffect(() => {
    const storedPartyName = localStorage.getItem("partyName") || "";
    const storedGracePeriod = Number(localStorage.getItem("defaultGracePeriod")) || 15;
    const storedInterestRate = Number(localStorage.getItem("defaultInterestRate")) || 18;
    
    setPartyName(storedPartyName);
    setGracePeriod(storedGracePeriod);
    setInterestRate(storedInterestRate);
  }, []);

 const handleCalculateInterest = () => {
  try {
    if (!partyName) {
      toast.error("Error", {
        description: "Please set a party name in the settings first"
      });
      return;
    }

    // Get vouchers from localStorage
    const storedVouchers = JSON.parse(localStorage.getItem("vouchers") || "[]");
    
    if (storedVouchers.length === 0) {
      toast.error("No vouchers found", {
        description: "No vouchers found. Please add some vouchers first."
      });
      return;
    }

    // Ensure vouchers have correct date format 
    const parsedVouchers = storedVouchers.map((v: any) => ({
      ...v,
      voucherDate: new Date(v.voucherDate),
    }));
    
    // Sort all vouchers by date (oldest first)
    const allVouchers = [...parsedVouchers].sort((a, b) => 
      new Date(a.voucherDate).getTime() - new Date(b.voucherDate).getTime()
    );

    let totalDebit = 0;
    let totalCredit = 0;
    let totalInterest = 0;

    // Process vouchers and calculate interest
    const debitVouchers = parsedVouchers.filter((v: Voucher) => v.type === "debit");
    const creditVouchers = parsedVouchers.filter((v: Voucher) => v.type === "credit");
    
    // Calculate totals
    debitVouchers.forEach((v: Voucher) => totalDebit += v.amount);
    creditVouchers.forEach((v: Voucher) => totalCredit += v.amount);
    
    // Track remaining amount for each payment
    const paymentTracking: Record<string, number> = {};
    creditVouchers.forEach((v: Voucher) => {
      paymentTracking[v.id] = v.amount;
    });
    
    // Sort debit vouchers by date for processing
    const sortedDebitVouchers = [...debitVouchers].sort((a, b) => 
      new Date(a.voucherDate).getTime() - new Date(b.voucherDate).getTime()
    );
    
    const processedDebitVouchers = sortedDebitVouchers.map((voucher: Voucher) => {
      // Calculate due date
      const dueDate = addDays(new Date(voucher.voucherDate), gracePeriod);
    
      // Find payments for this voucher with proper tracking
      const payments: Array<Voucher & { appliedAmount: number }> = [];
      let remainingToFind = voucher.amount;
      
      // Consider only payments after this voucher date with remaining amounts
        const eligiblePayments: Voucher[] = creditVouchers
        .filter((p: Voucher) => p.voucherDate > voucher.voucherDate && paymentTracking[p.id] > 0)
        .sort((a: Voucher, b: Voucher) => new Date(a.voucherDate).getTime() - new Date(b.voucherDate).getTime());
      
      for (const payment of eligiblePayments) {
        if (remainingToFind <= 0) break;
        
        // Use only the remaining amount of this payment
        const availableAmount = paymentTracking[payment.id];
        const paymentAmount = Math.min(availableAmount, remainingToFind);
        
        if (paymentAmount > 0) {
          payments.push({
            ...payment,
            appliedAmount: paymentAmount
          });
          
          // Update remaining amount for this payment
          paymentTracking[payment.id] -= paymentAmount;
          remainingToFind -= paymentAmount;
        }
      }

      console.log(`- Found ${payments.length} payments:`);
      payments.forEach(p => console.log(`  * ${format(p.voucherDate, "dd/MM/yyyy")}: ₹${p.appliedAmount} (from payment of ₹${p.amount})`));
      
      // Process interest calculations
      let interestAmount = 0;
      let interestBreakdown = [];
      
      let remainingAmount = voucher.amount;
      let currentDate = dueDate;
      
      console.log(`Calculating interest for voucher ${voucher.voucherNo}:`);
      
      // If no payments and still unpaid
      if (payments.length === 0 && asOfDate > dueDate) {
        const days = differenceInDays(asOfDate, dueDate);
        console.log(`- No payments, calculating for ${days} days on amount ₹${remainingAmount}`);
        interestAmount = (remainingAmount * interestRate * days) / 365 / 100;
        console.log(`- Interest for period: ₹${interestAmount.toFixed(2)}`);
        
        interestBreakdown.push({
          fromDate: dueDate,
          toDate: asOfDate,
          principal: remainingAmount,
          days,
          interestAmount,
        });
      } else {
        // Process each payment
        for (const payment of payments) {
          if (payment.voucherDate > dueDate && remainingAmount > 0) {
            const days = differenceInDays(payment.voucherDate, currentDate);
            console.log(`- Calculating interest from ${format(currentDate, "dd/MM/yyyy")} to ${format(payment.voucherDate, "dd/MM/yyyy")}`);
            console.log(`- Days: ${days}, Amount: ₹${remainingAmount}`);
            const interestForPeriod = (remainingAmount * interestRate * days) / 365 / 100;
            console.log(`- Interest for period: ₹${interestForPeriod.toFixed(2)}`);
            
            interestBreakdown.push({
              fromDate: currentDate,
              toDate: payment.voucherDate,
              principal: remainingAmount,
              days,
              interestAmount: interestForPeriod,
            });
            
            interestAmount += interestForPeriod;
            currentDate = payment.voucherDate;
          }
          
          // Reduce remaining amount by the applied payment amount
          remainingAmount -= payment.appliedAmount;
        }
        
        // If still has remaining amount
        if (remainingAmount > 0 && asOfDate > currentDate) {
          const days = differenceInDays(asOfDate, currentDate);
          const interestForPeriod = (remainingAmount * interestRate * days) / 365 / 100;
          
          interestBreakdown.push({
            fromDate: currentDate,
            toDate: asOfDate,
            principal: remainingAmount,
            days,
            interestAmount: interestForPeriod,
          });
          
          interestAmount += interestForPeriod;
        }
      }
      
      totalInterest += interestAmount;
      
      return {
        ...voucher,
        payments,
        dueDate,
        interest: {
          amount: interestAmount,
          breakdown: interestBreakdown,
        }
      };
    });
    
    const calculationResult: CalculationResult = {
      partyName,
      asOfDate,
      gracePeriod,
      interestRate,
      debitVouchers: processedDebitVouchers,
      creditVouchers,
      allVouchers,
      totalDebit,
      totalCredit,
      totalInterest,
    };
    
    setResult(calculationResult);

    toast.success("Interest calculated successfully", {
      description: `Total interest: ₹${totalInterest.toFixed(2)}`
    });

  } catch (error) {
    toast.error("Calculation Error", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
    console.error("Calculation error:", error);
  }
};

// For the Excel export function (handleExportExcel)

const handleExportExcel = () => {
  try {
    if (!result) return;

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Start date
    const startDate = result.allVouchers[0]?.voucherDate 
      ? new Date(result.allVouchers[0].voucherDate) 
      : new Date();
    
    // Prepare header data
    const headerData = [
      [`H.S. TRADERS`],
      [`Copy of A/C of: ${result.partyName} From ${format(startDate, "dd/MM/yyyy")} TO ${format(result.asOfDate, "dd/MM/yyyy")}`],
      [],
      ["Date", "Narration", "DEBIT (Rs.)", "CREDIT (Rs.)", "Balance (Rs.)"]
    ];

    // Prepare rows data
    const rowsData = [];
    
    // Opening balance row
    rowsData.push([
      format(startDate, "dd/MM/yyyy"),
      "<<< Opening Balance >>>",
      "0.00",
      "0.00",
      "0.00 Dr"
    ]);

    // Create rows for all vouchers in chronological order
    let runningBalance = 0;
    
    for (const voucher of result.allVouchers) {
      if (voucher.type === "debit") {
        runningBalance += voucher.amount;
        
        // Create well-formatted narration with justified spacing
        // Format: SR-XX on left, description in middle, date on right
        const leftPart = voucher.voucherNo;
        const middlePart = voucher.description || "";
        const rightPart = format(new Date(voucher.voucherDate), "dd.MM.yy");
        
        // Use explicit spacing to create the effect of justify-between in Excel
        // We'll use a custom formula for sheet formatting later
        const narration = `${leftPart}     ${middlePart}     ${rightPart}`;
        
        // Add debit voucher row
        rowsData.push([
          format(new Date(voucher.voucherDate), "dd/MM/yyyy"),
          narration,
          voucher.amount.toFixed(2),
          "",
          runningBalance > 0 
            ? `${runningBalance.toFixed(2)} Dr`
            : `${Math.abs(runningBalance).toFixed(2)} Cr`
        ]);
        
        // Add interest calculation for this debit voucher if applicable
       
      } else {
        // Credit entry
        runningBalance -= voucher.amount;
        
        // Create well-formatted narration with justified spacing for credit entries
        const leftPart = voucher.voucherNo || "CH";
        const middlePart = voucher.description || "";
        const rightPart = format(new Date(voucher.voucherDate), "dd.MM.yy");
        
        // Use explicit spacing to create the effect of justify-between in Excel
        const narration = `${leftPart}     ${middlePart}     ${rightPart}`;
        
        rowsData.push([
          format(new Date(voucher.voucherDate), "dd/MM/yyyy"),
          narration,
          "",
          voucher.amount.toFixed(2),
          runningBalance > 0 
            ? `${runningBalance.toFixed(2)} Dr`
            : `${Math.abs(runningBalance).toFixed(2)} Cr`
        ]);
      }
    }

    // Add total row
    rowsData.push([
      "",
      "<<< Account Total >>>",
      result.totalDebit.toFixed(2),
      result.totalCredit.toFixed(2),
      result.totalDebit > result.totalCredit
        ? `${(result.totalDebit - result.totalCredit).toFixed(2)} Dr`
        : `${(result.totalCredit - result.totalDebit).toFixed(2)} Cr`
    ]);
    
    // Add interest total row
    rowsData.push([
      "",
      `INTEREST @ ${result.interestRate}% is Rs. ${result.totalInterest.toFixed(2)} Receivable`,
      "",
      "",
      ""
    ]);

    // Create worksheet with all data
    const ws = XLSX.utils.aoa_to_sheet([...headerData, ...rowsData]);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Interest Calculation");
    
    // Set column widths
    const wscols = [
      { wch: 12 },  // Date
      { wch: 50 },  // Narration - wider to accommodate spaced content
      { wch: 15 },  // Debit
      { wch: 15 },  // Credit
      { wch: 15 },  // Balance
    ];
    
    ws['!cols'] = wscols;
    
    // Generate user info and date in footer
   
    
    // Generate Excel file
    const fileName = `${result.partyName}_Interest_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success("Excel Export", {
      description: `Report exported as ${fileName}`
    });
    
  } catch (error) {
    toast.error("Export Error", {
      description: error instanceof Error ? error.message : "Failed to export Excel"
    });
    console.error("Excel export error:", error);
  }
};

 // For the PDF export function (handleExportPdf)

const handleExportPdf = () => {
  try {
    if (!result) return;

    // Create new PDF document
    const doc = new jsPDF();
    
    // Start date
    const startDate = result.allVouchers[0]?.voucherDate 
      ? new Date(result.allVouchers[0].voucherDate) 
      : new Date();
      
    // Add headers
    doc.setFontSize(16);
    doc.text("H.S. TRADERS", doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(
      `Copy of A/C of: ${result.partyName} From ${format(startDate, "dd/MM/yyyy")} TO ${format(result.asOfDate, "dd/MM/yyyy")}`,
      doc.internal.pageSize.getWidth() / 2, 
      22, 
      { align: "center" }
    );
    
    // Prepare table data
    const tableHeaders = [
      ["Date", "Narration", "DEBIT (Rs.)", "CREDIT (Rs.)", "Balance (Rs.)"]
    ];
    
    const tableRows: any[][] = [];
    
    // Add opening balance row
    tableRows.push([
      format(startDate, "dd/MM/yyyy"),
      "<<< Opening Balance >>>",
      "0.00",
      "0.00",
      "0.00 Dr"
    ]);
    
    // Process all vouchers in chronological order
    let runningBalance = 0;
    
    for (const voucher of result.allVouchers) {
      if (voucher.type === "debit") {
        runningBalance += voucher.amount;
        
        // For PDF we can use a special formatting with spaces that 
        // will create visual separation between the elements
        const leftPart = voucher.voucherNo;
        const middlePart = voucher.description || "";
        const rightPart = format(new Date(voucher.voucherDate), "dd.MM.yy");
        
        // Use spaces to simulate justify-between in PDF
        // This works better than tabs for PDF output
        const narration = `${leftPart}           ${middlePart}           ${rightPart}`;
        
        // Add debit voucher row
        tableRows.push([
          format(new Date(voucher.voucherDate), "dd/MM/yyyy"),
          narration,
          voucher.amount.toFixed(2),
          "",
          runningBalance > 0 
            ? `${runningBalance.toFixed(2)} Dr`
            : `${Math.abs(runningBalance).toFixed(2)} Cr`
        ]);
        
        // Add interest calculation for this debit voucher if applicable
       
      } else {
        // Credit entry
        runningBalance -= voucher.amount;
        
        // Create well-formatted narration with justified spacing for credit entries
        const leftPart = voucher.voucherNo || "CH";
        const middlePart = voucher.description || "";
        const rightPart = format(new Date(voucher.voucherDate), "dd.MM.yy");
        
        // Use spaces to simulate justify-between in PDF
        const narration = `${leftPart}           ${middlePart}           ${rightPart}`;
        
        tableRows.push([
          format(new Date(voucher.voucherDate), "dd/MM/yyyy"),
          narration,
          "",
          voucher.amount.toFixed(2),
          runningBalance > 0 
            ? `${runningBalance.toFixed(2)} Dr`
            : `${Math.abs(runningBalance).toFixed(2)} Cr`
        ]);
      }
    }

    // Add total row with stronger styling
    tableRows.push([
      "",
      "<<< Account Total >>>",
      result.totalDebit.toFixed(2),
      result.totalCredit.toFixed(2),
      result.totalDebit > result.totalCredit
        ? `${(result.totalDebit - result.totalCredit).toFixed(2)} Dr`
        : `${(result.totalCredit - result.totalDebit).toFixed(2)} Cr`
    ]);
    
    // Use the correct way to import and use jspdf-autotable
    import('jspdf-autotable').then((module) => {
      const { default: autoTable } = module;
      
       autoTable(doc, {
    head: tableHeaders,
    body: tableRows,
    startY: 30,
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    },
    headStyles: { 
      fillColor: [220, 220, 220], 
      textColor: 0, 
      fontStyle: 'bold' 
    },
    didParseCell: function(data: any) {
      const rowIndex = data.row.index;
      if (rowIndex === 0 || rowIndex === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });
      
      // Add interest footer
      // @ts-ignore - previousAutoTable is added by the autotable plugin
         const finalY = (doc as any).lastAutoTable?.finalY || 280;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(
                `INTEREST @ ${result.interestRate}% is Rs. ${result.totalInterest.toFixed(2)} Receivable`,
                doc.internal.pageSize.getWidth() - 15, 
                finalY + 10, 
                { align: "right" }
            );
      
      
      
      // Generate file name and save
      const fileName = `${result.partyName}_Interest_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(fileName);
      
      toast.success("PDF Export", {
        description: `Report exported as ${fileName}`
      });
    }).catch((error) => {
      throw new Error("Failed to load PDF export module: " + error.message);
    });
    
  } catch (error) {
    toast.error("Export Error", {
      description: error instanceof Error ? error.message : "Failed to export PDF"
    });
    console.error("PDF export error:", error);
  }
};
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  return (
    <div className={cn("space-y-8", isPrinting && "print-mode")}>
      {!isPrinting && !partyName ? (
        <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-center">
            Please set a party name in the settings before calculating interest.
          </p>
          <div className="flex justify-center mt-2">
            <Button variant="outline" onClick={() => window.location.href = "/settings"}>
              Go to Settings
            </Button>
          </div>
        </div>
      ) : !isPrinting && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="p-4 border rounded-lg bg-muted/30">
              <p className="font-medium">Current Party: <span className="text-primary">{partyName}</span></p>
            </div>
          
            <div className="space-y-2">
              <Label htmlFor="asOfDate">As of Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="asOfDate"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !asOfDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {asOfDate ? (
                      format(asOfDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={asOfDate}
                    onSelect={(date) => date && setAsOfDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gracePeriod">Grace Period (days)</Label>
                <Input
                  id="gracePeriod"
                  type="number"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(Number(e.target.value))}
                />
              </div>
            
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                />
              </div>
            </div>
          
            <Button onClick={handleCalculateInterest} className="w-full">
              Calculate Interest
            </Button>
          </div>
          
          {result && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium text-lg mb-2">Calculation Summary</h3>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">Party:</span> {result.partyName}</p>
                <p><span className="font-medium">As of Date:</span> {format(result.asOfDate, "dd/MM/yyyy")}</p>
                <p><span className="font-medium">Grace Period:</span> {result.gracePeriod} days</p>
                <p><span className="font-medium">Interest Rate:</span> {result.interestRate}%</p>
                <p><span className="font-medium">Total Debit:</span> ₹{result.totalDebit.toFixed(2)}</p>
                <p><span className="font-medium">Total Credit:</span> ₹{result.totalCredit.toFixed(2)}</p>
                <p className="font-bold">
                  <span>Total Interest:</span> ₹{result.totalInterest.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {!isPrinting && (
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Interest Report</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPdf}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>
          )}

          <div className="ledger-report">
            <LedgerTable data={result} />
          </div>
        </div>
      )}
    </div>
  );
}
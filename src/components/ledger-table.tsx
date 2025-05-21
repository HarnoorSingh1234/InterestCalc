"use client";

import React from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LedgerTableProps {
  data: any;
}

export function LedgerTable({ data }: LedgerTableProps) {
  const formatCurrency = (amount: number) => {
    return amount.toFixed(2);
  };

  // Get all vouchers (both debit and credit)
  const allVouchers = data.allVouchers || [];
  
  // Get start date from first voucher or use current date if no vouchers
  const startDate = allVouchers[0]?.voucherDate 
    ? new Date(allVouchers[0].voucherDate) 
    : new Date();

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="p-4 bg-muted/30">
        <div className="text-center font-bold text-lg">
          HS TRADERS
        </div>
        <div className="text-center text-sm">
          Copy of A/C of : {data.partyName} From {format(startDate, "dd/MM/yyyy")} TO {format(data.asOfDate, "dd/MM/yyyy")}
        </div>
      </div>

      <Table className="border-collapse">
        <TableHeader>
          <TableRow className="bg-muted/50 border-y border-dashed">
            <TableHead className="border-r border-dashed whitespace-nowrap text-center font-medium">Date</TableHead>
            <TableHead className="border-r border-dashed whitespace-nowrap text-center font-medium">N a r r a t i o n</TableHead>
            <TableHead className="border-r border-dashed whitespace-nowrap text-center font-medium">DEBIT<br/>Rs.Ps</TableHead>
            <TableHead className="border-r border-dashed whitespace-nowrap text-center font-medium">CREDIT<br/>Rs.Ps</TableHead>
            <TableHead className="whitespace-nowrap text-center font-medium">Balance<br/>Rs.Ps</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow key="opening-balance" className="border-b border-dashed">
            <TableCell className="border-r border-dashed">{format(startDate, "dd/MM/yyyy")}</TableCell>
            <TableCell className="border-r border-dashed text-center">{"<<< Opening Balance >>>"}</TableCell>
            <TableCell className="border-r border-dashed text-right">{formatCurrency(0.00)}</TableCell>
            <TableCell className="border-r border-dashed text-right">{formatCurrency(0.00)}</TableCell>
            <TableCell className="text-right">{formatCurrency(0.00)} Dr</TableCell>
          </TableRow>
          
          {/* Display all vouchers in chronological order */}
          {allVouchers.map((voucher: any, index: number) => {
            // Calculate running balance
            let runningBalance = index === 0 ? 
              (voucher.type === 'debit' ? voucher.amount : -voucher.amount) : 0;
            
            // For subsequent vouchers, add to the running balance from previous vouchers
            if (index > 0) {
              for (let i = 0; i < index; i++) {
                if (allVouchers[i].type === 'debit') {
                  runningBalance += allVouchers[i].amount;
                } else {
                  runningBalance -= allVouchers[i].amount;
                }
              }
              
              // Add current voucher to balance
              if (voucher.type === 'debit') {
                runningBalance += voucher.amount;
              } else {
                runningBalance -= voucher.amount;
              }
            }
            
            return (
              <React.Fragment key={`voucher-${voucher.id}`}>
                <TableRow className="border-b border-dashed">
                  <TableCell className="border-r border-dashed">{format(new Date(voucher.voucherDate), "dd/MM/yyyy")}</TableCell>
                 <TableCell className="border-r border-dashed">
                    <div className="flex justify-between items-center">
                        <div className="flex-shrink-0">
                        {voucher.voucherNo} {voucher.description && `${voucher.description}`}
                        </div>
                        {voucher.type === 'credit' && <span className="flex-shrink-0 mx-2">(CH)</span>}
                        <div className="flex-shrink-0 text-muted-foreground">
                        {format(new Date(voucher.voucherDate), "dd.MM.yy")}
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-dashed text-right">
                    {voucher.type === 'debit' ? formatCurrency(voucher.amount) : ""}
                  </TableCell>
                  <TableCell className="border-r border-dashed text-right">
                    {voucher.type === 'credit' ? formatCurrency(voucher.amount) : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    {runningBalance !== 0 ? 
                      (runningBalance > 0 
                        ? `${formatCurrency(runningBalance)} Dr`
                        : `${formatCurrency(Math.abs(runningBalance))} Cr`) 
                      : "0.00 Dr"}
                  </TableCell>
                </TableRow>
                
                {/* Add interest calculation rows for debit vouchers if applicable */}
                {voucher.type === 'debit' && voucher.interest && voucher.interest.amount > 0 && (
                  <TableRow key={`interest-${voucher.id}`} className="bg-muted/10 border-b border-dashed">
                    <TableCell colSpan={5} className="px-4 py-2 text-sm border-r border-dashed">
                      <div className="font-medium mb-1">Interest Calculation:</div>
                      {voucher.interest.breakdown.map((item: any, idx: number) => (
                        <div key={`breakdown-${voucher.id}-${idx}`} className="ml-4">
                          {format(new Date(item.fromDate), "dd/MM/yyyy")} to 
                          {" "}{format(new Date(item.toDate), "dd/MM/yyyy")}: 
                          ₹{formatCurrency(item.principal)} × 
                          {data.interestRate}% × {item.days}/365 = 
                          ₹{formatCurrency(item.interestAmount)}
                        </div>
                      ))}
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
          
          <TableRow className="bg-muted font-medium border-y border-double">
            <TableCell colSpan={2} className="border-r border-dashed text-center">{"<<< Account Total >>>"}</TableCell>
            <TableCell className="border-r border-dashed text-right">{formatCurrency(data.totalDebit)}</TableCell>
            <TableCell className="border-r border-dashed text-right">{formatCurrency(data.totalCredit)}</TableCell>
            <TableCell className="text-right">
              {data.totalDebit !== data.totalCredit ? 
                (data.totalDebit > data.totalCredit
                  ? `${formatCurrency(data.totalDebit - data.totalCredit)} Dr`
                  : `${formatCurrency(data.totalCredit - data.totalDebit)} Cr`)
                : "0.00"}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="p-3 bg-muted/20 text-right font-bold border-t">
        INTEREST @ {data.interestRate}% is Rs. {formatCurrency(data.totalInterest)} Receivable
      </div>
    </div>
  );
}
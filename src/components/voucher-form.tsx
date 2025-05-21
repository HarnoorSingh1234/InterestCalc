"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Voucher {
  id: string;
  voucherNo: string;
  voucherDate: Date;
  description: string;
  type: "debit" | "credit";
  amount: number;
}

export function VoucherForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [partyName, setPartyName] = useState("");

  // Form state
  const [voucherNo, setVoucherNo] = useState("");
  const [voucherDate, setVoucherDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"debit" | "credit">("debit");
  const [amount, setAmount] = useState<number | "">("");

  // Get party name from localStorage on component mount
  useEffect(() => {
    const storedPartyName = localStorage.getItem("partyName") || "";
    setPartyName(storedPartyName);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!partyName) {
        throw new Error("Please set a party name first in the settings");
      }
      
      if (!voucherNo || !voucherDate || !amount) {
        throw new Error("Please fill all required fields");
      }

      // Create voucher object
      const voucher: Voucher = {
        id: crypto.randomUUID(),
        voucherNo,
        voucherDate,
        description,
        type,
        amount: Number(amount),
      };

      // Get existing vouchers from localStorage
      const existingVouchers = JSON.parse(
        localStorage.getItem("vouchers") || "[]"
      );

      // Add new voucher
      const updatedVouchers = [...existingVouchers, voucher];
      localStorage.setItem("vouchers", JSON.stringify(updatedVouchers));

      toast.success("Voucher added", {
        description: `Voucher ${voucherNo} has been added successfully.`,
      });

      // Clear form
      setVoucherNo("");
      setVoucherDate(new Date());
      setDescription("");
      setType("debit");
      setAmount("");

      // Navigate to dashboard
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!partyName ? (
        <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-lg text-center">
          <p className="text-yellow-800 dark:text-yellow-200">
            Please set a party name in the settings before adding vouchers.
          </p>
          <Button 
            className="mt-2" 
            variant="outline" 
            onClick={() => router.push("/settings")}
          >
            Go to Settings
          </Button>
        </div>
      ) : (
        <div className="p-4 border rounded-lg bg-muted/30">
          <p className="font-medium">Current Party: <span className="text-primary">{partyName}</span></p>
          <p className="text-sm text-muted-foreground mt-1">
            All vouchers will be associated with this party
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="voucherNo">Voucher No *</Label>
        <Input
          id="voucherNo"
          value={voucherNo}
          onChange={(e) => setVoucherNo(e.target.value)}
          placeholder="Enter voucher number"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="voucherDate">Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="voucherDate"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !voucherDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {voucherDate ? (
                  format(voucherDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={voucherDate}
                onSelect={(date) => date && setVoucherDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select
            value={type}
            onValueChange={(value: "debit" | "credit") => setType(value)}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="debit">Debit (Bill/Invoice)</SelectItem>
              <SelectItem value="credit">Credit (Payment)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description or reference"
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (₹) *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
          placeholder="Enter amount"
          required
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push("/")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !partyName}>
          {isLoading ? "Saving..." : "Save Voucher"}
        </Button>
      </div>
    </form>
  );
}
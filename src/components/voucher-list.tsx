"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, Save, X, CheckCircle2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Voucher {
  id: string;
  voucherNo: string;
  voucherDate: Date;
  description: string;
  type: "debit" | "credit";
  amount: number;
}

type EditableVoucher = Omit<Voucher, "voucherDate" | "amount"> & { 
  voucherDate: Date;
  amount: number | "";
};

// Define the sort keys
type SortKey = 'voucherDate' | 'voucherNo' | 'description' | 'amount';
type SortDirection = 'asc' | 'desc';

export function VouchersList() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [partyName, setPartyName] = useState("");
  
  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('voucherDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // New voucher state for adding
  const [newVoucher, setNewVoucher] = useState<EditableVoucher>({
    id: "",
    voucherNo: "",
    voucherDate: new Date(),
    description: "",
    type: "debit",
    amount: "",
  });
  
  // State for editing existing voucher
  const [editVoucher, setEditVoucher] = useState<EditableVoucher>({
    id: "",
    voucherNo: "",
    voucherDate: new Date(),
    description: "",
    type: "debit",
    amount: "",
  });

  useEffect(() => {
    // Load party name
    const storedPartyName = localStorage.getItem("partyName") || "";
    setPartyName(storedPartyName);

    // Load vouchers
    loadVouchers();
  }, []);

  const loadVouchers = () => {
    try {
      const storedVouchers = JSON.parse(localStorage.getItem("vouchers") || "[]");
      const parsedVouchers = storedVouchers.map((v: any) => ({
        ...v,
        voucherDate: new Date(v.voucherDate),
      }));
      
      // Apply current sort
      const sortedVouchers = sortVouchers(parsedVouchers, sortKey, sortDirection);
      setVouchers(sortedVouchers);
    } catch (error) {
      console.error("Error loading vouchers:", error);
      setVouchers([]);
    }
  };

  // Sort function
  const sortVouchers = (items: Voucher[], key: SortKey, direction: SortDirection): Voucher[] => {
    return [...items].sort((a, b) => {
      let compareA, compareB;
      
      if (key === 'amount') {
        // For amount, consider type (debit/credit) - treat debit as positive and credit as negative
        compareA = a.type === 'debit' ? a.amount : -a.amount;
        compareB = b.type === 'debit' ? b.amount : -b.amount;
      } else if (key === 'voucherDate') {
        compareA = new Date(a.voucherDate).getTime();
        compareB = new Date(b.voucherDate).getTime();
      } else {
        compareA = a[key];
        compareB = b[key];
      }
      
      // String comparison
      if (typeof compareA === 'string' && typeof compareB === 'string') {
        return direction === 'asc' 
          ? compareA.localeCompare(compareB) 
          : compareB.localeCompare(compareA);
      }
      
      // Number or Date comparison
      if (typeof compareA === 'number' && typeof compareB === 'number') {
        return direction === 'asc' 
          ? compareA - compareB 
          : compareB - compareA;
      }
      
      // Fallback for other types
      return direction === 'asc' 
        ? String(compareA).localeCompare(String(compareB))
        : String(compareB).localeCompare(String(compareA));
    });
  };

  // Handle column header click for sorting
  const handleSort = (key: SortKey) => {
    // If clicking the same column, toggle direction
    const newDirection = key === sortKey && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    setSortKey(key);
    
    // Apply sort
    const sortedVouchers = sortVouchers(vouchers, key, newDirection);
    setVouchers(sortedVouchers);
  };

  // Get sort icon for column
  const getSortIcon = (key: SortKey) => {
    if (key !== sortKey) return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  // Render sortable column header
  const SortableHeader = ({ children, sortKey: key }: { children: React.ReactNode, sortKey: SortKey }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/20 select-none"
      onClick={() => handleSort(key)}
    >
      <div className="flex items-center">
        {children}
        {getSortIcon(key)}
      </div>
    </TableHead>
  );

  const handleSaveVoucher = () => {
    try {
      if (!partyName) {
        toast.error("No party configured", {
          description: "Please set a party name in settings first"
        });
        return;
      }

      if (!newVoucher.voucherNo || !newVoucher.voucherDate || !newVoucher.amount) {
        toast.error("Missing information", {
          description: "Please fill all required fields"
        });
        return;
      }

      // Create voucher object
      const voucher: Voucher = {
        id: crypto.randomUUID(),
        voucherNo: newVoucher.voucherNo,
        voucherDate: newVoucher.voucherDate,
        description: newVoucher.description,
        type: newVoucher.type,
        amount: Number(newVoucher.amount),
      };

      // Add to existing vouchers
      const updatedVouchers = [voucher, ...vouchers];
      
      // Sort the updated vouchers according to current sort settings
      const sortedVouchers = sortVouchers(updatedVouchers, sortKey, sortDirection);
      
      // Save to localStorage
      localStorage.setItem("vouchers", JSON.stringify(sortedVouchers));
      setVouchers(sortedVouchers);

      // Reset form but keep date and type for quick consecutive entries
      setNewVoucher({
        id: "",
        voucherNo: "",
        voucherDate: newVoucher.voucherDate, // Keep the same date for consecutive entries
        description: "",
        type: newVoucher.type, // Keep the same type for consecutive entries
        amount: "",
      });

      toast.success("Voucher added", {
        description: `Voucher ${voucher.voucherNo} has been added successfully`
      });
      
      // Keep the adding row open for quick entry of multiple vouchers
    } catch (error) {
      toast.error("Error adding voucher", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewVoucher({
      id: "",
      voucherNo: "",
      voucherDate: new Date(),
      description: "",
      type: "debit",
      amount: "",
    });
  };

  const handleDeleteVoucher = (id: string) => {
    try {
      const updatedVouchers = vouchers.filter(v => v.id !== id);
      localStorage.setItem("vouchers", JSON.stringify(updatedVouchers));
      setVouchers(updatedVouchers);
      
      toast.success("Voucher deleted", {
        description: "The voucher has been deleted successfully"
      });

      // If deleting while editing, cancel edit mode
      if (editingId === id) {
        setEditingId(null);
      }
    } catch (error) {
      toast.error("Error deleting voucher", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  // Handler for starting edit mode
  const handleStartEdit = (voucher: Voucher) => {
    setEditingId(voucher.id);
    setEditVoucher({
      id: voucher.id,
      voucherNo: voucher.voucherNo,
      voucherDate: new Date(voucher.voucherDate),
      description: voucher.description,
      type: voucher.type,
      amount: voucher.amount,
    });
  };

  // Handler for saving edits
  const handleSaveEdit = () => {
    try {
      if (!editVoucher.voucherNo || !editVoucher.voucherDate || !editVoucher.amount) {
        toast.error("Missing information", {
          description: "Please fill all required fields"
        });
        return;
      }

      // Create updated voucher
      const updatedVoucher: Voucher = {
        id: editVoucher.id,
        voucherNo: editVoucher.voucherNo,
        voucherDate: editVoucher.voucherDate,
        description: editVoucher.description,
        type: editVoucher.type,
        amount: Number(editVoucher.amount),
      };

      // Update in vouchers
      const updatedVouchers = vouchers.map(v => 
        v.id === updatedVoucher.id ? updatedVoucher : v
      );
      
      // Re-apply current sort
      const sortedVouchers = sortVouchers(updatedVouchers, sortKey, sortDirection);
      
      localStorage.setItem("vouchers", JSON.stringify(sortedVouchers));
      setVouchers(sortedVouchers);
      setEditingId(null);

      toast.success("Voucher updated", {
        description: `Voucher ${updatedVoucher.voucherNo} has been updated successfully`
      });
    } catch (error) {
      toast.error("Error updating voucher", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  // Handler for cancelling edit
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const noVouchersMessage = (
    <div className="text-center py-8 text-muted-foreground">
      {!partyName ? (
        <p>Please configure a party name in settings before adding vouchers.</p>
      ) : (
        <p>No vouchers found. Add your first voucher using the button below.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader sortKey="voucherDate">Date</SortableHeader>
              <SortableHeader sortKey="voucherNo">Voucher No</SortableHeader>
              <SortableHeader sortKey="description">Description</SortableHeader>
              <TableHead className="text-right w-[120px]">Debit (₹)</TableHead>
              <TableHead className="text-right w-[120px]">Credit (₹)</TableHead>
              <SortableHeader sortKey="amount">Amount</SortableHeader>
              <TableHead className="w-[100px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isAdding && (
              <TableRow className="bg-muted/20">
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        size="sm"
                        className={cn(
                          "justify-start text-left font-normal w-full",
                          !newVoucher.voucherDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {newVoucher.voucherDate ? (
                          format(newVoucher.voucherDate, "dd/MM/yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newVoucher.voucherDate}
                        onSelect={(date) => date && setNewVoucher({...newVoucher, voucherDate: date})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <Input 
                    placeholder="Voucher No *"
                    value={newVoucher.voucherNo}
                    onChange={(e) => setNewVoucher({...newVoucher, voucherNo: e.target.value})}
                    className="h-9"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    placeholder="Description"
                    value={newVoucher.description}
                    onChange={(e) => setNewVoucher({...newVoucher, description: e.target.value})}
                    className="h-9"
                  />
                </TableCell>
                <TableCell className="text-right">
                  {newVoucher.type === "debit" ? (
                    <Input 
                      type="number"
                      placeholder="Amount *"
                      value={newVoucher.amount}
                      onChange={(e) => setNewVoucher({...newVoucher, amount: e.target.value ? Number(e.target.value) : ""})}
                      className="h-9 text-right"
                    />
                  ) : (
                    <div className="h-9"></div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {newVoucher.type === "credit" ? (
                    <Input 
                      type="number"
                      placeholder="Amount *"
                      value={newVoucher.amount}
                      onChange={(e) => setNewVoucher({...newVoucher, amount: e.target.value ? Number(e.target.value) : ""})}
                      className="h-9 text-right"
                    />
                  ) : (
                    <div className="h-9"></div>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={newVoucher.type}
                    onValueChange={(value: "debit" | "credit") => 
                      setNewVoucher({...newVoucher, type: value})
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Debit</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 justify-center">
                    <Button size="icon" variant="ghost" onClick={handleSaveVoucher} title="Save">
                      <Save className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelAdd} title="Cancel">
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {vouchers.length === 0 && !isAdding ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {noVouchersMessage}
                </TableCell>
              </TableRow>
            ) : (
              vouchers.map((voucher) => (
                <TableRow 
                  key={voucher.id} 
                  className={editingId === voucher.id ? "bg-muted/30" : "hover:bg-muted/10 cursor-pointer"}
                  onDoubleClick={() => editingId !== voucher.id && handleStartEdit(voucher)}
                >
                  {editingId === voucher.id ? (
                    // Editing mode
                    <>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              size="sm"
                              className={cn(
                                "justify-start text-left font-normal w-full",
                                !editVoucher.voucherDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                              {editVoucher.voucherDate ? (
                                format(editVoucher.voucherDate, "dd/MM/yyyy")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={editVoucher.voucherDate}
                              onSelect={(date) => date && setEditVoucher({...editVoucher, voucherDate: date})}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Voucher No *"
                          value={editVoucher.voucherNo}
                          onChange={(e) => setEditVoucher({...editVoucher, voucherNo: e.target.value})}
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Description"
                          value={editVoucher.description}
                          onChange={(e) => setEditVoucher({...editVoucher, description: e.target.value})}
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {editVoucher.type === "debit" ? (
                          <Input 
                            type="number"
                            placeholder="Amount *"
                            value={editVoucher.amount}
                            onChange={(e) => setEditVoucher({...editVoucher, amount: e.target.value ? Number(e.target.value) : ""})}
                            className="h-9 text-right"
                          />
                        ) : (
                          <div className="h-9"></div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editVoucher.type === "credit" ? (
                          <Input 
                            type="number"
                            placeholder="Amount *"
                            value={editVoucher.amount}
                            onChange={(e) => setEditVoucher({...editVoucher, amount: e.target.value ? Number(e.target.value) : ""})}
                            className="h-9 text-right"
                          />
                        ) : (
                          <div className="h-9"></div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editVoucher.type}
                          onValueChange={(value: "debit" | "credit") => 
                            setEditVoucher({...editVoucher, type: value})
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="debit">Debit</SelectItem>
                            <SelectItem value="credit">Credit</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 justify-center">
                          <Button size="icon" variant="ghost" onClick={handleSaveEdit} title="Save changes">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={handleCancelEdit} title="Cancel">
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    // View mode
                    <>
                      <TableCell>
                        {format(new Date(voucher.voucherDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">{voucher.voucherNo}</TableCell>
                      <TableCell>{voucher.description}</TableCell>
                      <TableCell className="text-right">
                        {voucher.type === "debit" ? voucher.amount.toFixed(2) : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        {voucher.type === "credit" ? voucher.amount.toFixed(2) : ""}
                      </TableCell>
                      <TableCell className="font-medium">
                        {voucher.type === "debit" ? "Dr" : "Cr"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVoucher(voucher.id);
                            }}
                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            title="Delete voucher"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isAdding && (
        <Button
          onClick={() => setIsAdding(true)}
          disabled={!partyName}
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Voucher
        </Button>
      )}

      <div className="text-center text-sm text-muted-foreground">
        <p>Double-click on any row to edit that voucher</p>
        <p>Click on column headers to sort the table</p>
      </div>
    </div>
  );
}
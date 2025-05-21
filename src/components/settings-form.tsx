"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function SettingsForm() {
  const router = useRouter();
  const [partyName, setPartyName] = useState("");
  const [defaultGracePeriod, setDefaultGracePeriod] = useState(15);
  const [defaultInterestRate, setDefaultInterestRate] = useState(18);
  const [isLoading, setIsLoading] = useState(false);

  // Load values from localStorage on component mount
  useEffect(() => {
    setPartyName(localStorage.getItem("partyName") || "");
    setDefaultGracePeriod(Number(localStorage.getItem("defaultGracePeriod")) || 15);
    setDefaultInterestRate(Number(localStorage.getItem("defaultInterestRate")) || 18);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!partyName) {
        throw new Error("Party name is required");
      }

      // Save settings to localStorage
      localStorage.setItem("partyName", partyName);
      localStorage.setItem("defaultGracePeriod", defaultGracePeriod.toString());
      localStorage.setItem("defaultInterestRate", defaultInterestRate.toString());

      toast.success("Settings saved", {
        description: "Your settings have been saved successfully.",
      });

      router.push("/");
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
      <div className="space-y-2">
        <Label htmlFor="partyName">Party Name *</Label>
        <Input
          id="partyName"
          value={partyName}
          onChange={(e) => setPartyName(e.target.value)}
          placeholder="Enter the party name for all transactions"
          required
        />
        <p className="text-sm text-muted-foreground">
          This party name will be used for all voucher entries
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="defaultGracePeriod">Default Grace Period (days)</Label>
          <Input
            id="defaultGracePeriod"
            type="number"
            value={defaultGracePeriod}
            onChange={(e) => setDefaultGracePeriod(Number(e.target.value))}
          />
        </div>
      
        <div className="space-y-2">
          <Label htmlFor="defaultInterestRate">Default Interest Rate (%)</Label>
          <Input
            id="defaultInterestRate"
            type="number"
            step="0.01"
            value={defaultInterestRate}
            onChange={(e) => setDefaultInterestRate(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push("/")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
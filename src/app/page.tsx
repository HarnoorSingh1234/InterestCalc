"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VouchersList } from "@/components/voucher-list";
import { Settings } from "lucide-react";

export default function HomePage() {
  const [partyName, setPartyName] = useState("");
  
  useEffect(() => {
    setPartyName(localStorage.getItem("partyName") || "");
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="space-x-2">
          <Button asChild variant="outline">
            <Link href="/calculate-interest">Calculate Interest</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {!partyName ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-amber-600 dark:text-amber-400">
                Please set up your party name in the settings to get started
              </p>
              <Button asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Go to Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="p-4 border rounded-lg bg-muted/30">
            <p className="font-medium">Current Party: <span className="text-primary">{partyName}</span></p>
            <p className="text-sm text-muted-foreground mt-1">
              All vouchers are associated with this party
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vouchers</CardTitle>
              <CardDescription>
                Add and manage vouchers directly in the table below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VouchersList />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Settings, Calculator, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const navItems = [
  { name: "Dashboard", path: "/" },
  { name: "Calculate Interest", path: "/calculate-interest", icon: <Calculator className="h-4 w-4 mr-2" /> },
  { name: "Settings", path: "/settings", icon: <Settings className="h-4 w-4 mr-2" /> },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Function to clear all local storage data
  const handleClearLocalStorage = () => {
    try {
      localStorage.clear();
      toast.success("Success", {
        description: "All data has been cleared successfully"
      });
      setIsResetDialogOpen(false);
    } catch (error) {
      toast.error("Error", {
        description: "Failed to clear data. Please try again."
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4">    
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="font-bold text-2xl mr-6">
              HS Traders
            </Link>
            <nav className="flex gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path
                  }
                  className={`px-3 py-2 rounded-md flex items-center ${
                    pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetDialogOpen(true)}
              className="flex items-center text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset All Data
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">{children}</main>
      <footer className="border-t py-4">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} RK Enterprises
        </div>
      </footer>

      {/* Confirmation Dialog for clearing local storage */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all your stored data including vouchers, party information, and settings. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearLocalStorage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
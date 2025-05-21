import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VoucherForm } from "@/components/voucher-form";

export default function AddVoucherPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Add Voucher</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>New Voucher Entry</CardTitle>
          <CardDescription>
            Add a new debit (bill) or credit (payment) voucher
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VoucherForm />
        </CardContent>
      </Card>
    </div>
  );
}
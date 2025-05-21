import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InterestCalculator } from "@/components/interest-calculator";

export default function CalculateInterestPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Interest Calculation</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Calculate Interest</CardTitle>
          <CardDescription>
            Select a party and set interest parameters to generate a report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InterestCalculator />
        </CardContent>
      </Card>
    </div>
  );
}
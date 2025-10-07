import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "blue" | "purple" | "amber" | "green";
  disabled?: boolean;
  endpoint: string;
}

const colorClasses = {
  blue: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
  purple: "bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
  amber: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20",
  green: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
};

const ModuleCard = ({ title, description, icon, color, disabled, endpoint }: ModuleCardProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState<string>("");

  const handleProcess = async () => {
    setIsProcessing(true);
    setOutput("");

    // Simulate API call
    setTimeout(() => {
      const mockOutput = `Processing complete for ${title}:\n\n` +
        `✓ File analyzed successfully\n` +
        `✓ Extracted ${Math.floor(Math.random() * 50 + 10)} key elements\n` +
        `✓ Generated insights and patterns\n\n` +
        `This is a demo output. In production, this would connect to your Python backend processing scripts.`;
      
      setOutput(mockOutput);
      setIsProcessing(false);
      toast.success(`${title} completed successfully`);
    }, 2000);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleProcess}
          disabled={disabled || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Run Module"
          )}
        </Button>

        {output && (
          <div className="mt-4 p-4 bg-secondary rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">Output:</h4>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
              {output}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModuleCard;

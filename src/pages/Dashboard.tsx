import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, LogOut } from "lucide-react";
import { toast } from "sonner";
import FileUploadCard from "@/components/dashboard/FileUploadCard";
import ModuleCard from "@/components/dashboard/ModuleCard";
import { Upload, Database, Settings, Lightbulb, FileSearch } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    toast.success(`File "${file.name}" uploaded successfully`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">PaperIQ</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Upload and process your documents with AI-powered modules
          </p>
        </div>

        {/* File Upload Section */}
        <div className="mb-8">
          <FileUploadCard onFileUpload={handleFileUpload} uploadedFile={uploadedFile} />
        </div>

        {/* Processing Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <ModuleCard
            title="Ingestion Module"
            description="Extract and structure content from your documents"
            icon={<Database className="h-6 w-6" />}
            color="blue"
            disabled={!uploadedFile}
            endpoint="/api/ingestion"
          />
          <ModuleCard
            title="Preprocessing Module"
            description="Clean and prepare data for analysis"
            icon={<Settings className="h-6 w-6" />}
            color="purple"
            disabled={!uploadedFile}
            endpoint="/api/preprocessing"
          />
          <ModuleCard
            title="Insight Extraction"
            description="Extract key insights and patterns from your data"
            icon={<Lightbulb className="h-6 w-6" />}
            color="amber"
            disabled={!uploadedFile}
            endpoint="/api/insights"
          />
          <ModuleCard
            title="Summarization Module"
            description="Generate concise summaries of your documents"
            icon={<FileSearch className="h-6 w-6" />}
            color="green"
            disabled={!uploadedFile}
            endpoint="/api/summarize"
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

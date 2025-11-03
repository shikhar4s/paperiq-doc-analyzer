import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, LogOut, Database, Settings, Lightbulb, FileSearch } from "lucide-react";
import { toast } from "sonner";
import FileUploadCard from "@/components/dashboard/FileUploadCard";
import ModuleCard from "@/components/dashboard/ModuleCard";
import {
  ingestFile,
  preprocessText,
  extractInsights,
  summarizeFile,
  logoutUser, // ✅ Import logout
} from "@/api/paperiqApi";

interface ResultsState {
  ingestion?: any;
  preprocess?: any;
  extract?: any;
  summarize?: any;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [cleanText, setCleanText] = useState("");
  const [results, setResults] = useState<ResultsState>({});

  // ✅ Updated logout handler
  const handleLogout = () => {
    logoutUser(); // clears token + user
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setRawText("");
    setCleanText("");
    setResults({});
    toast.success(`File "${file.name}" uploaded successfully`);
  };

  const handleIngest = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Session expired, please log in again.");
      navigate("/login");
      return;
    }

    if (!uploadedFile) {
      toast.error("Please upload a file first.");
      return;
    }

    try {
      const res = await ingestFile(uploadedFile);
      setRawText(res.text);
      setResults((prev) => ({ ...prev, ingestion: res }));
      toast.success("Ingestion complete!");
    } catch (err) {
      console.error(err);
      toast.error("Error in ingestion module");
    }
  };

  const handlePreprocess = async () => {
    if (!rawText) {
      toast.error("Ingestion must be run first to generate raw text.");
      return;
    }
    try {
      const res = await preprocessText(rawText);
      setCleanText(res.clean_text);
      setResults((prev) => ({ ...prev, preprocess: res }));
      toast.success("Preprocessing complete!");
    } catch (err) {
      console.error(err);
      toast.error("Error in preprocessing module");
    }
  };

  const handleExtract = async () => {
    if (!cleanText) {
      toast.error("Preprocessing must be run first to generate clean text.");
      return;
    }
    try {
      const res = await extractInsights(cleanText);
      setResults((prev) => ({ ...prev, extract: res }));
      toast.success("Insight extraction complete!");
    } catch (err) {
      console.error(err);
      toast.error("Error in extraction module");
    }
  };

  const handleSummarize = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first.");
      return;
    }
    try {
      const res = await summarizeFile(uploadedFile);
      setResults((prev) => ({ ...prev, summarize: res }));
      toast.success("Summarization complete!");
    } catch (err) {
      console.error(err);
      toast.error("Error in summarization module");
    }
  };

  return (
    <div className="min-h-screen bg-background">
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

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Upload and process your documents with AI-powered modules
          </p>
        </div>

        <div className="mb-8">
          <FileUploadCard onFileUpload={handleFileUpload} uploadedFile={uploadedFile} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <ModuleCard
            title="Ingestion Module"
            description="Extract and structure content from your documents"
            icon={<Database className="h-6 w-6" />}
            color="blue"
            disabled={!uploadedFile}
            onProcess={handleIngest}
            output={results.ingestion}
          />

          <ModuleCard
            title="Preprocessing Module"
            description="Clean and prepare data for analysis"
            icon={<Settings className="h-6 w-6" />}
            color="purple"
            disabled={!rawText}
            onProcess={handlePreprocess}
            output={results.preprocess}
          />

          <ModuleCard
            title="Insight Extraction"
            description="Extract key insights and patterns from your data"
            icon={<Lightbulb className="h-6 w-6" />}
            color="amber"
            disabled={!cleanText}
            onProcess={handleExtract}
            output={results.extract}
          />

          <ModuleCard
            title="Summarization Module"
            description="Generate concise summaries of your documents"
            icon={<FileSearch className="h-6 w-6" />}
            color="green"
            disabled={!uploadedFile}
            onProcess={handleSummarize}
            output={results.summarize}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

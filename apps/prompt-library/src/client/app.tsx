import { useState, useRef, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Button } from "@/client/components/ui/button";
import { Textarea } from "@/client/components/ui/textarea";
import { Input } from "@/client/components/ui/input";
import { Card, CardContent } from "@/client/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/client/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/client/components/ui/dropdown-menu";
import { Label } from "@/client/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/client/components/ui/tooltip";
import { ModeToggle } from "@/client/components/mode-toggle";
import Markdown from "react-markdown";
import { rpcClient } from "@/client/rpc-client";
import {
  Mail,
  NotebookPen,
  MessageSquare,
  FileText,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Copy,
  Check,
  Library,
  CircleArrowRight,
  ListIcon,
  Save,
  Edit,
  Plus,
  Zap,
  Brain,
  Lightbulb,
  Target,
  Wand2,
  PenTool,
  BookOpen,
  Users,
  Settings,
  Heart,
  Star,
  Briefcase,
  Calendar,
  Clock,
  Home,
  Search,
  Filter,
  Tag,
  Flag,
  Award,
  Shield,
  Key,
  Lock,
  Eye,
  Image,
  Video,
  Music,
  Phone,
  Globe,
  Map,
  Car,
  Plane,
  Coffee,
  Gift,
  ShoppingCart,
  CreditCard,
  Wallet,
  Calculator,
  Camera,
  Speaker,
  Headphones,
  Gamepad2,
  Tv,
  Monitor,
  Smartphone,
  Laptop,
  Tablet,
  Printer,
  Database,
  Server,
  Cloud,
  Wifi,
  Bluetooth,
  Battery,
  Power,
  Plug,
  Cpu,
  HardDrive,
  MemoryStick,
  MousePointer,
  Keyboard,
  Mouse,
  FolderOpen,
  Pencil,
  RotateCcw,
  MoreVertical,
  Trash2,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";

interface PromptTemplate {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt: string;
  color: string;
  recentlyUsedAt?: string;
  updatedAt?: string;
}

type SortOption = "recentlyUsed" | "updated";

function AppHeader() {
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between py-3 px-4">
        {/* App Title */}
        <div className="flex items-center gap-2">
          <Library className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">Prompt Library</span>
        </div>

        {/* Theme Toggle */}
        <ModeToggle />
      </div>
    </div>
  );
}

function ColumnHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-2 px-4 border-b flex-shrink-0 bg-background/50">
      <div className="flex items-center justify-between min-h-8">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="font-medium text-sm">{title}</h2>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <div
      className={`absolute left-72 top-1/2 transform -translate-x-1/2 z-10 ${className}`}
    >
      <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center shadow-xs">
        <CircleArrowRight className="h-6 w-6 text-muted" />
      </div>
    </div>
  );
}

function createPrompt(instructions: string, input: string) {
  if (!input.trim()) {
    return instructions;
  }

  return `## Context

Use the following instructions to transoform the user input. Do not include any other text in your response, just the transformed input.

## Instructions

${instructions}

## User Input

${input}`;
}

// Icon mapping for dynamic icon rendering
const iconMap = {
  Mail,
  NotebookPen,
  MessageSquare,
  FileText,
  Sparkles,
  ListIcon,
  Edit,
  Zap,
  Brain,
  Lightbulb,
  Target,
  Wand2,
  PenTool,
  BookOpen,
  Users,
  Settings,
  Heart,
  Star,
  Briefcase,
  Calendar,
  Clock,
  Home,
  Search,
  Filter,
  Tag,
  Flag,
  Award,
  Shield,
  Key,
  Lock,
  Eye,
  Image,
  Video,
  Music,
  Phone,
  Globe,
  Map,
  Car,
  Plane,
  Coffee,
  Gift,
  ShoppingCart,
  CreditCard,
  Wallet,
  Calculator,
  Camera,
  Mic,
  Speaker,
  Headphones,
  Gamepad2,
  Tv,
  Monitor,
  Smartphone,
  Laptop,
  Tablet,
  Printer,
  Database,
  Server,
  Cloud,
  Wifi,
  Bluetooth,
  Battery,
  Power,
  Plug,
  Cpu,
  HardDrive,
  MemoryStick,
  MousePointer,
  Keyboard,
  Mouse,
  FolderOpen,
} as const;

function App() {
  const [userInput, setUserInput] = useState("");
  const [promptText, setPromptText] = useState("");
  const [isListening, setIsListening] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recognition, setRecognition] = useState<any>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [isUpdatingPrompt, setIsUpdatingPrompt] = useState(false);
  const [isSavingNewPrompt, setIsSavingNewPrompt] = useState(false);
  const [isGeneratingIconColor, setIsGeneratingIconColor] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recentlyUsed");

  const [isNewPromptDialogOpen, setIsNewPromptDialogOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptText, setNewPromptText] = useState("");
  const [dialogIcon, setDialogIcon] = useState("Sparkles");
  const [dialogColor, setDialogColor] = useState("");
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Disable speech recognition for now, as the web `SpeechRecognition` API
  // doesn't work in Electron
  const isSpeechSupported = false;

  const { completion, isLoading, complete } = useCompletion({
    api: "/api/chat",
  });

  // Load prompts from API on component mount
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        setIsLoadingPrompts(true);
        const data = await rpcClient.prompts.loadPrompts();

        // Transform API data to include React components for icons
        const transformedPrompts: PromptTemplate[] = data.map((prompt) => ({
          ...prompt,
          icon: iconMap[prompt.icon as keyof typeof iconMap] || FileText,
        }));

        setPromptTemplates(transformedPrompts);
      } catch (error) {
        console.error("Failed to load prompts:", error);
        // Fallback to empty array on error
        setPromptTemplates([]);
      } finally {
        setIsLoadingPrompts(false);
      }
    };

    loadPrompts();
  }, []);

  const handlePromptClick = (template: PromptTemplate) => {
    setSelectedPrompt(template);
    setPromptText(template.prompt);

    // Focus the content after a short delay to ensure it's rendered
    contentTextareaRef.current?.focus();
  };

  // Sort prompts based on selected sort option
  const sortedPrompts = [...promptTemplates].sort((a, b) => {
    if (sortBy === "recentlyUsed") {
      const aTime = a.recentlyUsedAt ? new Date(a.recentlyUsedAt).getTime() : 0;
      const bTime = b.recentlyUsedAt ? new Date(b.recentlyUsedAt).getTime() : 0;
      return bTime - aTime; // Most recent first
    } else {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime; // Most recent first
    }
  });

  const handleGenerate = async () => {
    if (!promptText.trim()) {
      alert("Please select a prompt first!");
      return;
    }

    // Mark prompt as recently used if there's a selected prompt
    if (selectedPrompt) {
      try {
        await rpcClient.prompts.markPromptAsUsed({ id: selectedPrompt.id });

        // Update local state to reflect the new recentlyUsedAt timestamp
        setPromptTemplates((prev) =>
          prev.map((p) =>
            p.id === selectedPrompt.id
              ? { ...p, recentlyUsedAt: new Date().toISOString() }
              : p
          )
        );
      } catch (error) {
        console.error("Failed to mark prompt as used:", error);
        // Don't block the UI if this fails
      }
    }

    const combinedPrompt = createPrompt(promptText, userInput);
    complete(combinedPrompt);
  };

  const startVoiceInput = () => {
    if (!isSpeechSupported) {
      return;
    }

    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition;
    const newRecognition = new SpeechRecognition();

    newRecognition.continuous = true;
    newRecognition.interimResults = true;
    newRecognition.lang = "en-US";

    newRecognition.onstart = () => {
      setIsListening(true);
    };

    newRecognition.onend = () => {
      setIsListening(false);
      setRecognition(null);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newRecognition.onresult = (event: any) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      // Update the input with final results, keeping previous content
      if (finalTranscript) {
        setUserInput((prev) => prev + finalTranscript + " ");
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newRecognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setRecognition(null);
      if (event.error !== "aborted") {
        alert("Voice recognition failed. Please try again or use text input.");
      }
    };

    setRecognition(newRecognition);
    newRecognition.start();
  };

  const stopVoiceInput = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
      setIsListening(false);
    }
  };

  const hasClipboard = navigator.clipboard;

  const copyToClipboard = async () => {
    if (completion) {
      if (navigator.clipboard) {
        // If normal copy method available, use it
        try {
          await navigator.clipboard.writeText(completion);
        } catch (err) {
          console.error("Unable to copy to clipboard", err);
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpdatePrompt = async () => {
    if (!selectedPrompt || !promptText.trim()) {
      return;
    }

    try {
      setIsUpdatingPrompt(true);
      // Find the icon string from the iconMap
      const iconString =
        Object.entries(iconMap).find(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ([_, component]) => component === selectedPrompt.icon
        )?.[0] || "Sparkles";

      await rpcClient.prompts.updatePrompt({
        id: selectedPrompt.id,
        title: selectedPrompt.title,
        icon: iconString,
        color: selectedPrompt.color,
        prompt: promptText,
      });

      // Update the local state
      setPromptTemplates((prev) =>
        prev.map((p) =>
          p.id === selectedPrompt.id ? { ...p, prompt: promptText } : p
        )
      );

      // Update selected prompt
      setSelectedPrompt((prev) =>
        prev ? { ...prev, prompt: promptText } : null
      );
    } catch (error) {
      console.error("Failed to update prompt:", error);
      alert("Failed to update prompt. Please try again.");
    } finally {
      setIsUpdatingPrompt(false);
    }
  };

  const handleSaveNewPrompt = async () => {
    setEditingPromptId(null);
    setNewPromptText(promptText);
    setNewPromptTitle(selectedPrompt?.title || "");

    // Reset to default icon and color for new prompts
    setDialogIcon("");
    setDialogColor("");

    setIsNewPromptDialogOpen(true);

    // Auto-generate style and title if we have prompt text
    if (promptText.trim()) {
      try {
        setIsGeneratingIconColor(true);

        const result = await rpcClient.prompts.generateIconAndTitle({
          title: (selectedPrompt?.title || "").trim() || undefined,
          prompt: promptText,
        });

        setDialogIcon(result.icon);
        setDialogColor(result.color);

        // Set generated title if no existing title
        if (result.title && !(selectedPrompt?.title || "").trim()) {
          setNewPromptTitle(result.title);
        }
      } catch (error) {
        console.error("Failed to generate initial style:", error);
        // Keep default values on error
      } finally {
        setIsGeneratingIconColor(false);
      }
    }
  };

  const handleConfirmSaveNewPrompt = async () => {
    if (!newPromptTitle.trim()) {
      alert("Please enter a title for the prompt!");
      return;
    }

    try {
      setIsSavingNewPrompt(true);

      if (editingPromptId) {
        // Update existing prompt
        const existingPrompt = promptTemplates.find(
          (p) => p.id === editingPromptId
        );
        if (!existingPrompt) {
          return;
        }

        await rpcClient.prompts.updatePrompt({
          id: editingPromptId,
          title: newPromptTitle.trim(),
          icon: dialogIcon,
          color: dialogColor,
          prompt: newPromptText,
          updatedAt: new Date().toISOString(),
        });

        // Update local state
        const DialogIconComponent =
          iconMap[dialogIcon as keyof typeof iconMap] || Sparkles;
        const now = new Date().toISOString();
        setPromptTemplates((prev) =>
          prev.map((p) =>
            p.id === editingPromptId
              ? {
                  ...p,
                  title: newPromptTitle.trim(),
                  prompt: newPromptText,
                  icon: DialogIconComponent,
                  color: dialogColor,
                  updatedAt: now,
                }
              : p
          )
        );

        // Update selected prompt if it's the one being edited
        if (selectedPrompt?.id === editingPromptId) {
          const DialogIconComponent =
            iconMap[dialogIcon as keyof typeof iconMap] || Sparkles;
          setSelectedPrompt((prev) =>
            prev
              ? {
                  ...prev,
                  title: newPromptTitle.trim(),
                  prompt: newPromptText,
                  icon: DialogIconComponent,
                  color: dialogColor,
                  updatedAt: now,
                }
              : null
          );
          setPromptText(newPromptText);
        }
      } else {
        // Create new prompt using dialog's icon and color
        const id = `prompt-${Date.now()}`;
        const now = new Date().toISOString();

        const newPrompt = {
          id,
          title: newPromptTitle.trim(),
          icon: dialogIcon,
          prompt: newPromptText,
          color: dialogColor,
          updatedAt: now,
          recentlyUsedAt: now,
        };

        await rpcClient.prompts.addPrompt(newPrompt);

        // Get the React component for the icon
        const IconComponent =
          iconMap[dialogIcon as keyof typeof iconMap] || Sparkles;

        // Add to local state
        const newPromptTemplate: PromptTemplate = {
          ...newPrompt,
          icon: IconComponent,
        };

        setPromptTemplates((prev) => [...prev, newPromptTemplate]);

        // Select the newly created prompt
        setSelectedPrompt(newPromptTemplate);
        setPromptText(newPromptTemplate.prompt);
      }

      // Close dialog and reset form
      setIsNewPromptDialogOpen(false);
      setEditingPromptId(null);
      setNewPromptTitle("");
      setNewPromptText("");
      setDialogIcon("");
      setDialogColor("");
    } catch (error) {
      console.error("Failed to save prompt:", error);
      alert("Failed to save prompt. Please try again.");
    } finally {
      setIsSavingNewPrompt(false);
      setIsGeneratingIconColor(false);
    }
  };

  const handleCancelSaveNewPrompt = () => {
    setIsNewPromptDialogOpen(false);
    setEditingPromptId(null);
    setNewPromptTitle("");
    setNewPromptText("");
    setDialogIcon("");
    setDialogColor("");
  };

  const handleNewPrompt = () => {
    setSelectedPrompt(null);
    setPromptText("");
    // Focus the prompt textarea after a short delay to ensure it's rendered
    setTimeout(() => {
      promptTextareaRef.current?.focus();
    }, 0);
  };

  const handleTitleClick = () => {
    if (selectedPrompt) {
      // Pre-populate dialog with existing prompt data
      setEditingPromptId(selectedPrompt.id);
      setNewPromptTitle(selectedPrompt.title);
      setNewPromptText(promptText);

      // Set existing icon and color for editing
      const iconString =
        Object.entries(iconMap).find(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ([_, component]) => component === selectedPrompt.icon
        )?.[0] || "";
      setDialogIcon(iconString);
      setDialogColor(selectedPrompt.color);

      setIsNewPromptDialogOpen(true);
    }
  };

  const handleRegenerateStyle = async () => {
    if (!newPromptText.trim()) {
      return;
    }

    try {
      setIsGeneratingIconColor(true);

      const result = await rpcClient.prompts.generateIconAndTitle({
        title: newPromptTitle.trim() || undefined,
        prompt: newPromptText,
      });

      setDialogIcon(result.icon);
      setDialogColor(result.color);

      // Update title if one was generated and we don't have a title yet
      if (result.title && !newPromptTitle.trim()) {
        setNewPromptTitle(result.title);
      }
    } catch (error) {
      console.error("Failed to regenerate style:", error);
      alert("Failed to regenerate style. Please try again.");
    } finally {
      setIsGeneratingIconColor(false);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) {
      return;
    }

    try {
      await rpcClient.prompts.deletePrompt({ id: promptId });

      // Remove from local state
      setPromptTemplates((prev) => prev.filter((p) => p.id !== promptId));

      // Clear selection if the deleted prompt was selected
      if (selectedPrompt?.id === promptId) {
        setSelectedPrompt(null);
        setPromptText("");
      }
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      alert("Failed to delete prompt. Please try again.");
    }
  };

  const handleEditPrompt = (template: PromptTemplate) => {
    // Pre-populate dialog with existing prompt data
    setEditingPromptId(template.id);
    setNewPromptTitle(template.title);
    setNewPromptText(template.prompt);

    // Set existing icon and color for editing
    const iconString =
      Object.entries(iconMap).find(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ([_, component]) => component === template.icon
      )?.[0] || "";
    setDialogIcon(iconString);
    setDialogColor(template.color);

    setIsNewPromptDialogOpen(true);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden flex-col">
      {/* App Header */}
      <AppHeader />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Prompts */}
        <div className="w-72 border-r bg-background flex flex-col min-h-0 relative">
          <ColumnHeader
            icon={Send}
            title="Prompts"
            action={
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setSortBy("recentlyUsed")}
                      className={sortBy === "recentlyUsed" ? "bg-accent" : ""}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Recently Used
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSortBy("updated")}
                      className={sortBy === "updated" ? "bg-accent" : ""}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Recently Updated
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewPrompt}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            }
          />
          <Arrow className="left-72" />

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {isLoadingPrompts ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">
                    Loading prompts...
                  </p>
                </div>
              </div>
            ) : promptTemplates.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-muted-foreground">
                  No prompts available
                </p>
              </div>
            ) : (
              sortedPrompts.map((template) => {
                const IconComponent = template.icon;
                return (
                  <div
                    key={template.id}
                    className={`
                      relative cursor-pointer rounded-xl overflow-hidden h-20
                      ${template.color}
                      hover:scale-105 transition-all duration-200
                      shadow-lg hover:shadow-xl
                      group
                      ${
                        selectedPrompt?.id === template.id
                          ? "ring-2 ring-primary ring-offset-2"
                          : ""
                      }
                    `}
                    onClick={() => handlePromptClick(template)}
                  >
                    {/* Icon in top-left */}
                    <div className="absolute top-3 left-3">
                      <IconComponent className="h-5 w-5 text-white/90 group-hover:text-white transition-colors" />
                    </div>

                    {/* Menu in top-right */}
                    <div
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-white/80 hover:text-white hover:bg-white/20"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-50">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPrompt(template);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePrompt(template.id);
                            }}
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Title overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-semibold text-xs text-white leading-tight">
                        {template.title}
                      </h3>
                    </div>

                    {/* Subtle overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Column - Input */}
        <div className="w-120 border-r flex flex-col min-h-0 relative">
          <ColumnHeader icon={Sparkles} title="Input" />
          <Arrow className="left-[480px]" />

          <div className="flex-1 p-6 flex flex-col gap-4 min-h-0">
            {/* Prompt Textarea - 1/4 height */}
            <div className="min-h-0 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                {selectedPrompt ? (
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className={`p-1 rounded ${selectedPrompt.color} flex-shrink-0`}
                    >
                      <selectedPrompt.icon className="h-3 w-3 text-white" />
                    </div>
                    <span
                      className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={handleTitleClick}
                    >
                      {selectedPrompt.title}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded bg-muted flex-shrink-0`}>
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Prompt
                    </span>
                  </div>
                )}
              </div>
              <Textarea
                ref={promptTextareaRef}
                placeholder="Select a prompt from the left or write your own..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full h-full min-h-20"
              />

              {/* Action buttons */}
              <div className="flex justify-end gap-2 mt-2">
                {selectedPrompt && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={handleUpdatePrompt}
                    disabled={
                      isUpdatingPrompt || promptText === selectedPrompt.prompt
                    }
                  >
                    <Save className="h-3 w-3" />
                    Save Prompt
                  </Button>
                )}
                <Dialog
                  open={isNewPromptDialogOpen}
                  onOpenChange={setIsNewPromptDialogOpen}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={
                              selectedPrompt
                                ? handleTitleClick
                                : () => handleSaveNewPrompt()
                            }
                            disabled={promptText.trim() === ""}
                          >
                            {selectedPrompt ? (
                              <>
                                <Pencil className="h-3 w-3" />
                                Edit
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3" />
                                Save New
                              </>
                            )}
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {selectedPrompt
                            ? "Open prompt editor"
                            : "Save new prompt to library"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingPromptId ? "Edit Prompt" : "Save New Prompt"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingPromptId
                          ? "Edit your existing prompt template."
                          : "Create a new prompt template."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded ${
                              dialogColor ??
                              "bg-gradient-to-br from-slate-500 to-slate-600"
                            } flex-shrink-0`}
                          >
                            {(() => {
                              const DialogIconComponent =
                                iconMap[dialogIcon as keyof typeof iconMap] ||
                                Sparkles;
                              return (
                                <DialogIconComponent className="h-4 w-4 text-white" />
                              );
                            })()}
                          </div>
                          <Input
                            id="title"
                            placeholder="Enter prompt title..."
                            value={newPromptTitle}
                            onChange={(e) => setNewPromptTitle(e.target.value)}
                            className="flex-1"
                          />
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 flex-shrink-0"
                                  onClick={handleRegenerateStyle}
                                  disabled={
                                    isGeneratingIconColor ||
                                    !newPromptText.trim()
                                  }
                                >
                                  {isGeneratingIconColor ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                  ) : (
                                    <RotateCcw className="h-3 w-3" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Regenerate icon and color</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="prompt">Prompt</Label>
                        <Textarea
                          id="prompt"
                          placeholder="Enter your prompt instructions..."
                          value={newPromptText}
                          onChange={(e) => setNewPromptText(e.target.value)}
                          className="min-h-32"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={handleCancelSaveNewPrompt}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleConfirmSaveNewPrompt}
                        disabled={
                          isSavingNewPrompt ||
                          isGeneratingIconColor ||
                          !newPromptTitle.trim() ||
                          !newPromptText.trim()
                        }
                      >
                        {isGeneratingIconColor && !editingPromptId ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Generating style...
                          </>
                        ) : isSavingNewPrompt ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            {editingPromptId ? "Updating..." : "Saving..."}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {editingPromptId ? "Update Prompt" : "Save Prompt"}
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Input Textarea - 3/4 height */}
            <div className="flex-1 min-h-0 relative flex flex-col">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded bg-muted flex-shrink-0`}>
                    <FileText className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Content
                  </span>
                </div>
              </label>
              <Textarea
                ref={contentTextareaRef}
                placeholder="Type your content, notes, or text here..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className={`h-full w-full ${isSpeechSupported ? "pr-12" : ""}`}
              />

              {/* Voice Recording Button Overlay - only show if supported */}
              {isSpeechSupported && (
                <div className="absolute bottom-3 right-3">
                  {!isListening ? (
                    <Button
                      onClick={startVoiceInput}
                      size="icon"
                      variant="outline"
                      className="w-8 h-8 rounded-full shadow-xs hover:shadow-md transition-all"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={stopVoiceInput}
                      size="icon"
                      variant="destructive"
                      className="w-8 h-8 rounded-full animate-pulse shadow-xs"
                    >
                      <MicOff className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Listening Status */}
              {isListening && (
                <div className="absolute top-8 left-3">
                  <div className="flex items-center gap-2 bg-red-500/10 text-red-600 px-2 py-1 rounded-md text-xs">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Listening...
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!promptText.trim() || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Column - Output */}
        <div className="flex-1 flex flex-col bg-background min-h-0">
          <div className="py-2 px-4 border-b flex-shrink-0 bg-background/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-h-8">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="font-medium text-sm">Output</h2>
                {selectedPrompt && completion && (
                  <div className="flex items-center gap-2 ml-2">
                    <div
                      className={`p-1 rounded ${selectedPrompt.color} flex-shrink-0`}
                    >
                      <selectedPrompt.icon className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {selectedPrompt.title}
                    </span>
                  </div>
                )}
              </div>
              {hasClipboard && completion && (
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      <span className="text-xs">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      <span className="text-xs">Copy</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 p-6 min-h-0 overflow-hidden">
            {completion || isLoading ? (
              <Card className="h-full flex flex-col">
                <CardContent className="p-6 flex-1 min-h-0">
                  <div className="h-full overflow-y-auto">
                    <div className="prose prose-sm max-w-none dark:prose-invert leading-relaxed">
                      <Markdown>{completion}</Markdown>
                      {isLoading && !completion && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="italic">Generating...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4 max-w-md">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Ready to generate</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter some content in the input area and select a prompt
                      to get started.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Tailwind colors - ensure they are included in the build */}
      <div className="invisible">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600"></div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600"></div>
        <div className="bg-gradient-to-br from-violet-500 to-violet-600"></div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600"></div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600"></div>
        <div className="bg-gradient-to-br from-slate-500 to-slate-600"></div>
        <div className="bg-gradient-to-br from-sky-500 to-sky-600"></div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600"></div>
        <div className="bg-gradient-to-br from-pink-500 to-pink-600"></div>
        <div className="bg-gradient-to-br from-gray-500 to-gray-600"></div>
        <div className="bg-gradient-to-br from-zinc-500 to-zinc-600"></div>
        <div className="bg-gradient-to-br from-neutral-500 to-neutral-600"></div>
        <div className="bg-gradient-to-br from-stone-500 to-stone-600"></div>
        <div className="bg-gradient-to-br from-red-500 to-red-600"></div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600"></div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600"></div>
        <div className="bg-gradient-to-br from-lime-500 to-lime-600"></div>
        <div className="bg-gradient-to-br from-green-500 to-green-600"></div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600"></div>
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600"></div>
      </div>
    </div>
  );
}

export default App;

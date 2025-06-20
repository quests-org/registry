import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { eventIteratorToStream } from "@orpc/client";

import { UploadedFileMetadata } from "@/server/rpc/file";
import { rpcClient } from "./rpc-client";

// Simplified CSS with only essential utilities
const simplifiedStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Remove the custom Message interface as we'll use the one from AI SDK

export function App() {
  // State for file management
  const [files, setFiles] = useState<UploadedFileMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<UploadedFileMetadata[]>(
    []
  );
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  // Add character counter state
  const [charCount, setCharCount] = useState<number>(0);
  // Add keyboard focus state
  const inputRef = useRef<HTMLInputElement>(null);
  // Add scroll state for new messages button
  const [showScrollButton, setShowScrollButton] = useState(false);
  // Add input state for message input
  const [input, setInput] = useState("");

  // Ref for chat container
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // AI chat state using the useChat hook
  const { messages, sendMessage, status } = useChat({
    transport: {
      async sendMessages(options) {
        return eventIteratorToStream(
          await rpcClient.chat.chat(
            {
              chatId: options.chatId,
              messages: options.messages,
              fileIds: (options.body as { fileIds?: string[] })?.fileIds ?? [],
            },
            { signal: options.abortSignal }
          )
        );
      },
      reconnectToStream() {
        throw new Error("Unsupported");
      },
    },
  });

  // Function to scroll chat to bottom
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  // Function to check if user needs to scroll down
  const checkScrollPosition = () => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      100;
    setShowScrollButton(!atBottom);
  };

  // Check scroll position when messages change
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition);
      // Check initial position
      checkScrollPosition();
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScrollPosition);
      }
    };
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Only auto-scroll if we're already at the bottom
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        150;

      if (isAtBottom) {
        scrollToBottom();
      } else {
        checkScrollPosition();
      }
    }
  }, [messages]);

  // Focus input field after AI response is complete
  useEffect(() => {
    if (status === "ready" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [status]);

  // Fetch the list of files on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  // Function to fetch all files
  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const result = await rpcClient.file.list();
      setFiles(result);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);

      try {
        // Process all selected files
        const uploadPromises = Array.from(e.target.files).map((file) =>
          rpcClient.file.create({ file })
        );

        // Wait for all uploads to complete
        await Promise.all(uploadPromises);

        // Clear the file input
        e.target.value = "";
        // Refresh the file list
        fetchFiles();
      } catch (error) {
        console.error("Error uploading files:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Toggle selection of a file for chat context
  const toggleFileSelection = (file: UploadedFileMetadata) => {
    if (selectedFiles.some((f) => f.id === file.id)) {
      // If already selected, remove it
      setSelectedFiles(selectedFiles.filter((f) => f.id !== file.id));
    } else {
      // Otherwise add to selection
      setSelectedFiles([...selectedFiles, file]);
    }
  };

  // Select all files
  const selectAllFiles = () => {
    setSelectedFiles([...files]);
  };

  // Deselect all files
  const deselectAllFiles = () => {
    setSelectedFiles([]);
  };

  // Handle file deletion
  const handleDelete = async (fileId: string) => {
    try {
      await rpcClient.file.remove({ id: fileId });
      // Remove from selected files if it was selected
      setSelectedFiles(selectedFiles.filter((f) => f.id !== fileId));
      // Refresh the file list
      fetchFiles();
      // Reset the deleting state
      setDeletingFile(null);
    } catch (error) {
      console.error("Error deleting file:", error);
      setDeletingFile(null);
    }
  };

  // Set file for deletion confirmation
  const confirmDelete = (fileId: string) => {
    setDeletingFile(fileId);
  };

  // Cancel deletion
  const cancelDelete = () => {
    setDeletingFile(null);
  };

  // Show image preview
  const showPreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  // Hide image preview
  const hidePreview = () => {
    setPreviewImage(null);
  };

  // Function to handle input change and track character count
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setCharCount(e.target.value.length);
  };

  // Custom submit handler to include selected files
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(
        { text: input },
        {
          body: {
            fileIds: selectedFiles.map((file) => file.id),
          },
        }
      );
      setInput("");
      setCharCount(0);
    }
  };

  // Helper function to get file type icon
  const getFileTypeIcon = (fileType: string, isLarge = false) => {
    const iconSize = isLarge ? "text-base" : "text-xs";

    if (fileType.startsWith("image/")) {
      return <span className={iconSize}>🖼️</span>;
    } else if (fileType.startsWith("application/pdf")) {
      return <span className={iconSize}>📄</span>;
    } else if (fileType.startsWith("text/")) {
      return <span className={iconSize}>📝</span>;
    } else if (fileType.startsWith("audio/")) {
      return <span className={iconSize}>🎵</span>;
    } else if (fileType.startsWith("video/")) {
      return <span className={iconSize}>🎬</span>;
    } else if (fileType.includes("spreadsheet") || fileType.includes("excel")) {
      return <span className={iconSize}>📊</span>;
    } else if (fileType.includes("document") || fileType.includes("word")) {
      return <span className={iconSize}>📃</span>;
    } else {
      return <span className={iconSize}>📎</span>;
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-6xl h-screen flex flex-col">
      <style>{simplifiedStyles}</style>
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
        AI Chat with Files
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 flex-grow overflow-hidden">
        {/* Chat section - now takes 2/3 of the space and full height */}
        <div className="md:col-span-2 flex flex-col h-full overflow-hidden order-2 md:order-1">
          <article className="bg-white border border-gray-200 p-3 sm:p-5 rounded-lg flex flex-col h-full overflow-hidden shadow-sm">
            <div
              ref={messagesContainerRef}
              className="flex-grow overflow-y-auto mb-4 space-y-4 min-h-0 relative"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-100 ml-auto max-w-[80%]"
                      : "bg-gray-100 mr-auto max-w-[80%]"
                  }`}
                >
                  <div className="font-medium mb-1 flex justify-between items-center">
                    <span>{message.role === "user" ? "You:" : "AI:"}</span>
                  </div>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <div key={`${message.id}-${i}`} className="text-sm">
                            {part.text}
                          </div>
                        );
                      default:
                        return null;
                    }
                  })}
                </div>
              ))}

              {/* Show typing indicator when AI is responding */}
              {status === "streaming" && (
                <div className="p-3 rounded-lg bg-gray-100 mr-auto max-w-[80%]">
                  <div className="font-medium mb-1 flex justify-between items-center">
                    <span>AI:</span>
                    <span className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="py-1 text-gray-500">
                    Generating response...
                  </div>
                </div>
              )}

              {/* Error handling will be handled by the useChat hook internally */}

              {/* Scroll to bottom button */}
              {showScrollButton && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-2 right-2 bg-blue-500 text-white p-2 rounded-full shadow-lg"
                  aria-label="Scroll to bottom"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    ></path>
                  </svg>
                </button>
              )}
            </div>

            {/* Display currently selected files */}
            {selectedFiles.length > 0 && (
              <div className="mb-3 p-2 sm:p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                  Files included in this conversation:
                </div>
                <div className="flex overflow-x-auto pb-2">
                  {selectedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-start bg-white p-1.5 rounded border border-gray-200 mr-2 flex-shrink-0 min-h-[2.5rem]"
                    >
                      {file.previewUrl ? (
                        <div
                          className="w-6 h-6 mr-2 mt-0.5 bg-gray-100 rounded flex-shrink-0 border border-gray-200 cursor-pointer"
                          onClick={() => showPreview(file.previewUrl!)}
                        >
                          <img
                            src={file.previewUrl}
                            alt={`Preview of ${file.name}`}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 mr-2 mt-0.5 bg-gray-100 rounded flex-shrink-0 border border-gray-200 flex items-center justify-center">
                          {getFileTypeIcon(file.type)}
                        </div>
                      )}
                      <span className="text-xs line-clamp-2 max-w-[100px]">
                        {file.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-auto">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <input
                    ref={inputRef}
                    value={input}
                    placeholder={
                      status === "streaming"
                        ? "AI is responding..."
                        : "Ask about your files..."
                    }
                    onChange={handleInputChange}
                    className={`border border-gray-300 rounded-lg p-2 w-full ${
                      status === "submitted" || status === "streaming"
                        ? "bg-gray-50"
                        : ""
                    }`}
                    disabled={status === "submitted" || status === "streaming"}
                  />
                  {input.trim().length > 0 && (
                    <div
                      className={`absolute right-2 bottom-1 text-xs ${
                        charCount > 500 ? "text-amber-500" : "text-gray-400"
                      }`}
                    >
                      {charCount}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className={`px-3 sm:px-4 py-2 rounded-lg ${
                    status === "submitted" || status === "streaming"
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-blue-500 text-white"
                  }`}
                  disabled={
                    status === "submitted" ||
                    status === "streaming" ||
                    !input.trim()
                  }
                >
                  {status === "submitted"
                    ? "Sending..."
                    : status === "streaming"
                    ? "Processing..."
                    : "Send"}
                </button>
              </div>
              {selectedFiles.length > 0 ? (
                <div className="mt-2 text-xs text-gray-500">
                  <span className="hidden sm:inline">Files selected:</span>{" "}
                  {selectedFiles.length}
                  <span className="hidden sm:inline">
                    (Total size:{" "}
                    {Math.round(
                      selectedFiles.reduce(
                        (total, file) => total + file.size,
                        0
                      ) / 1024
                    )}{" "}
                    KB)
                  </span>
                </div>
              ) : (
                <div className="mt-2 text-xs text-gray-500">
                  Chatting based on conversation history only. No files
                  included.
                </div>
              )}
            </form>
          </article>
        </div>

        {/* Right column for file management */}
        <div className="flex flex-col space-y-4 sm:space-y-6 h-auto md:h-full overflow-hidden order-1 md:order-2">
          {/* Compact upload experience */}
          <article className="bg-white border border-gray-200 p-3 sm:p-4 rounded-lg flex-shrink-0 shadow-sm">
            <header className="mb-2 sm:mb-3">
              <h2 className="text-base sm:text-lg font-semibold">
                Upload Files
              </h2>
            </header>
            <div className="flex flex-col">
              <div className="flex items-center">
                <label
                  className={`relative inline-flex items-center px-4 py-2 rounded-md cursor-pointer
                  ${
                    isUploading ||
                    status === "submitted" ||
                    status === "streaming"
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-50 text-blue-600"
                  } text-sm w-full justify-center border border-gray-200`}
                >
                  <input
                    type="file"
                    onChange={handleFileChange}
                    disabled={
                      isUploading ||
                      status === "submitted" ||
                      status === "streaming"
                    }
                    className="sr-only"
                    multiple
                  />
                  <span className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      ></path>
                    </svg>
                    Choose Files
                  </span>
                </label>
              </div>
              {isUploading && (
                <div className="mt-2 flex flex-col">
                  <p className="text-sm text-gray-600 mb-1">
                    Uploading files... Please wait.
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full w-1/3"></div>
                  </div>
                </div>
              )}
            </div>
          </article>

          {/* File selection area */}
          <article className="bg-white border border-gray-200 p-3 sm:p-4 rounded-lg flex-grow flex flex-col overflow-hidden shadow-sm">
            <header className="mb-2 sm:mb-3 flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-semibold">
                Available Files
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllFiles}
                  disabled={
                    files.length === 0 ||
                    status === "submitted" ||
                    status === "streaming"
                  }
                  className="text-xs text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  All
                </button>
                <button
                  onClick={deselectAllFiles}
                  disabled={
                    selectedFiles.length === 0 ||
                    status === "submitted" ||
                    status === "streaming"
                  }
                  className="text-xs text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              </div>
            </header>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-4 text-gray-500">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full mb-2"></div>
                <p className="text-center text-sm">Loading files...</p>
              </div>
            ) : (
              <>
                {files.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 flex flex-col items-center">
                    <svg
                      className="w-12 h-12 text-gray-300 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1"
                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                    <p className="text-sm">No files uploaded yet.</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Upload files to start chatting about them
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2 overflow-y-auto flex-grow h-full">
                    {files.map((file) => (
                      <li
                        key={file.id}
                        className={`p-2 sm:p-3 border rounded-lg ${
                          selectedFiles.some((f) => f.id === file.id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        } cursor-pointer`}
                        onClick={() => {
                          if (
                            status !== "submitted" &&
                            status !== "streaming"
                          ) {
                            toggleFileSelection(file);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedFiles.some(
                                (f) => f.id === file.id
                              )}
                              onChange={(e) => {
                                e.stopPropagation(); // Prevent click from bubbling to parent
                                toggleFileSelection(file);
                              }}
                              onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to parent
                              className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0"
                              disabled={
                                status === "submitted" || status === "streaming"
                              }
                            />
                            <span className="font-medium text-sm line-clamp-2 min-h-[1.5rem] sm:min-h-[2.5rem]">
                              {file.name || "Unnamed file"}
                            </span>
                          </div>

                          {deletingFile === file.id ? (
                            <div
                              className="flex items-center gap-1 flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="text-white bg-red-600 text-xs px-1.5 py-0.5 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent click from bubbling to parent
                                  handleDelete(file.id);
                                }}
                                disabled={
                                  status === "submitted" ||
                                  status === "streaming"
                                }
                              >
                                Delete
                              </button>
                              <button
                                className="text-gray-600 text-xs px-1.5 py-0.5 bg-gray-100 rounded disabled:text-gray-400 disabled:cursor-not-allowed"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent click from bubbling to parent
                                  cancelDelete();
                                }}
                                disabled={
                                  status === "submitted" ||
                                  status === "streaming"
                                }
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              className={`text-xs ml-1 flex-shrink-0 ${
                                status === "submitted" || status === "streaming"
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-red-500"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent click from bubbling to parent
                                confirmDelete(file.id);
                              }}
                              aria-label="Delete file"
                              disabled={
                                status === "submitted" || status === "streaming"
                              }
                            >
                              Delete
                            </button>
                          )}
                        </div>

                        {file.previewUrl ? (
                          <div className="mt-2 flex items-center">
                            <div
                              className="w-8 h-8 bg-gray-100 rounded flex-shrink-0 border border-gray-200 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent click from bubbling to parent
                                showPreview(file.previewUrl!);
                              }}
                            >
                              <img
                                src={file.previewUrl}
                                alt={`Preview of ${file.name}`}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                            <div className="ml-2 text-xs text-gray-600 truncate flex-1 min-w-0">
                              <div>{Math.round(file.size / 1024)} KB</div>
                              <div className="truncate">
                                Type: {file.type || "Unknown"}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded flex-shrink-0 border border-gray-200 flex items-center justify-center">
                              {getFileTypeIcon(file.type, true)}
                            </div>
                            <div className="ml-2 text-xs text-gray-600 truncate flex-1 min-w-0">
                              <div>{Math.round(file.size / 1024)} KB</div>
                              <div className="truncate">
                                Type: {file.type || "Unknown"}
                              </div>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </article>
        </div>
      </div>

      {/* Image Preview Overlay */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={hidePreview}
        >
          <div className="max-w-4xl max-h-screen p-4 relative">
            <button
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center"
              onClick={hidePreview}
            >
              ✕
            </button>
            <img
              src={previewImage}
              className="max-w-full max-h-[90vh] object-contain"
              alt="Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

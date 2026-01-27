import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/client/rpc-client";

export function AIDemo() {
  const [message, setMessage] = useState("");
  const [personPrompt, setPersonPrompt] = useState("");

  const {
    data: completionData,
    mutate: complete,
    isPending: isCompleting,
  } = useMutation(queryClient.demo.ai.complete.mutationOptions());

  const {
    data: personData,
    mutate: generatePerson,
    isPending: isGenerating,
  } = useMutation(queryClient.demo.ai.generate.mutationOptions());

  // When using this demo, remove any UI below that is not relevant for the user
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h2 className="text-2xl font-bold">AI Demo</h2>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Chat Completion</h3>

        <div className="space-y-4">
          <input
            className="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            className="px-6 py-3 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            onClick={() => {
              if (message) {
                complete({ message });
              }
            }}
            disabled={isCompleting || !message}
          >
            {isCompleting ? "Generating..." : "Send Message"}
          </button>
        </div>

        {completionData && (
          <div className="p-4 border border-gray-200 rounded-md">
            <h4 className="font-medium mb-2">Response:</h4>
            <p className="leading-relaxed">{completionData.response}</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Generate Person</h3>

        <div className="space-y-4">
          <input
            className="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Describe the person you want to generate"
            value={personPrompt}
            onChange={(e) => setPersonPrompt(e.target.value)}
          />
          <button
            className="px-6 py-3 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            onClick={() => {
              if (personPrompt) {
                generatePerson({ prompt: personPrompt });
              }
            }}
            disabled={isGenerating || !personPrompt}
          >
            {isGenerating ? "Generating..." : "Generate Person"}
          </button>
        </div>

        {personData && (
          <div className="p-4 border border-gray-200 rounded-md">
            <h4 className="font-medium mb-3">Generated Person:</h4>
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {personData.person.name}
              </p>
              <p>
                <strong>Age:</strong> {personData.person.age}
              </p>
              <p>
                <strong>Occupation:</strong> {personData.person.occupation}
              </p>
              <p>
                <strong>Bio:</strong> {personData.person.bio}
              </p>
              {personData.person.nickname && (
                <p>
                  <strong>Nickname:</strong> {personData.person.nickname}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

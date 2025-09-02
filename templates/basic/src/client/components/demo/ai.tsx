import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "../../rpc-client";

export function AIDemo() {
  const [message, setMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
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

  return (
    <div>
      <h2>AI Demo</h2>

      <div>
        <h3>Chat Completion</h3>

        <div>
          <input
            placeholder="System prompt (optional)"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
          <input
            placeholder="Your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            onClick={() => {
              if (message) {
                complete({
                  message,
                  systemPrompt: systemPrompt || undefined,
                });
              }
            }}
            disabled={isCompleting || !message}
          >
            {isCompleting ? "Generating..." : "Send Message"}
          </button>
        </div>

        {completionData && (
          <div>
            <h4>Response:</h4>
            <p>{completionData.response}</p>
          </div>
        )}
      </div>

      <div>
        <h3>Generate Person</h3>

        <div>
          <input
            placeholder="Describe the person you want to generate"
            value={personPrompt}
            onChange={(e) => setPersonPrompt(e.target.value)}
          />
          <button
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
          <div>
            <h4>Generated Person:</h4>
            <div>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

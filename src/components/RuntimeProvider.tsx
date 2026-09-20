import {
  AssistantRuntimeProvider,
  Suggestions,
  AuiConfig,
  useLocalRuntime,
} from "@assistant-ui/react";
import type { ReactNode } from "react";
import { createHttpBackendAdapter } from "../adapters/httpBackendAdapter";
import { localAgentAdapter } from "../adapters/localAgentAdapter";

const auiConfig = AuiConfig({
  suggestions: Suggestions([
    {
      prompt: "What does our refund policy say?",
      title: "Refund policy",
      label: "RAG document question",
    },
    {
      prompt: "Fetch the latest information from https://example.com",
      title: "Fetch a URL",
      label: "MCP fetch_url",
    },
    {
      prompt: "Calculate the total cost of 3 items at $12.50 each plus 8% tax",
      title: "Calculate",
      label: "MCP calculate",
    },
  ]),
});

type RuntimeProviderProps = {
  children: ReactNode;
};

function selectAdapter() {
  const baseUrl = import.meta.env.VITE_BACKEND_BASE_URL as string | undefined;
  if (baseUrl && baseUrl.trim().length > 0) {
    return createHttpBackendAdapter({ baseUrl: baseUrl.trim() });
  }
  return localAgentAdapter;
}

export function RuntimeProvider({ children }: RuntimeProviderProps) {
  const runtime = useLocalRuntime(selectAdapter());

  return (
    <AssistantRuntimeProvider runtime={runtime} config={auiConfig}>
      {children}
    </AssistantRuntimeProvider>
  );
}

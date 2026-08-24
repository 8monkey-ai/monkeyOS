import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./app";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./contexts/auth";
import { RuntimeProvider } from "./contexts/runtime";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 20_000, refetchOnWindowFocus: false } },
});
const root = document.getElementById("root");
if (!root) throw new Error("Application root is missing");
createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RuntimeProvider>
        <AuthProvider>
          <TooltipProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </RuntimeProvider>
    </QueryClientProvider>
  </StrictMode>,
);

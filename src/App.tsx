import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GameArena } from "./components/game/GameArena";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <main
        className="fixed inset-0 w-screen h-screen overflow-hidden select-none touch-none overscroll-none bg-[#0c1017]"
        onContextMenu={(e) => e.preventDefault()}
      >
        <GameArena />
      </main>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

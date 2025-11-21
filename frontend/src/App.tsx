import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import Home from "./pages/Home";
import Markets from "./pages/Markets";
import GridDetail from "./pages/GridDetail";
import Create from "./pages/Create";
import Dashboard from "./pages/Dashboard";
import Docs from "./pages/Docs";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/grid/:gridId" element={<GridDetail />} />
        <Route path="/create" element={<Create />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;

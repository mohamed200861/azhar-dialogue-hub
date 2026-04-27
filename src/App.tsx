import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { AdminLayout } from "@/components/admin/AdminLayout";

import Index from "./pages/Index.tsx";
import About from "./pages/About.tsx";
import Vision from "./pages/Vision.tsx";
import News from "./pages/News.tsx";
import NewsDetail from "./pages/NewsDetail.tsx";
import Events from "./pages/Events.tsx";
import EventDetail from "./pages/EventDetail.tsx";
import Library from "./pages/Library.tsx";
import LibraryDetail from "./pages/LibraryDetail.tsx";
import Videos from "./pages/Videos.tsx";
import VideoDetail from "./pages/VideoDetail.tsx";
import Partnerships from "./pages/Partnerships.tsx";
import Contact from "./pages/Contact.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import NotFound from "./pages/NotFound.tsx";

import AdminSetup from "./pages/admin/Setup.tsx";

import AdminLogin from "./pages/admin/Login.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import NewsList from "./pages/admin/news/NewsList.tsx";
import NewsEdit from "./pages/admin/news/NewsEdit.tsx";
import LibraryList from "./pages/admin/library/LibraryList.tsx";
import LibraryEdit from "./pages/admin/library/LibraryEdit.tsx";
import VideosList from "./pages/admin/videos/VideosList.tsx";
import VideosEdit from "./pages/admin/videos/VideosEdit.tsx";
import EventsList from "./pages/admin/events/EventsList.tsx";
import EventsEdit from "./pages/admin/events/EventsEdit.tsx";
import MediaManager from "./pages/admin/MediaManager.tsx";
import Messages from "./pages/admin/Messages.tsx";
import Newsletter from "./pages/admin/Newsletter.tsx";
import Settings from "./pages/admin/Settings.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/vision" element={<Vision />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:slug" element={<NewsDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/library" element={<Library />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/partnerships" element={<Partnerships />} />
              <Route path="/contact" element={<Contact />} />

              {/* Admin */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route index element={<Dashboard />} />
                <Route path="news" element={<NewsList />} />
                <Route path="news/:id" element={<NewsEdit />} />
                <Route path="library" element={<LibraryList />} />
                <Route path="library/:id" element={<LibraryEdit />} />
                <Route path="videos" element={<VideosList />} />
                <Route path="videos/:id" element={<VideosEdit />} />
                <Route path="events" element={<EventsList />} />
                <Route path="events/:id" element={<EventsEdit />} />
                <Route path="media" element={<MediaManager />} />
                <Route path="messages" element={<Messages />} />
                <Route path="newsletter" element={<Newsletter />} />
                <Route path="settings" element={<Settings />} />
                <Route path="admins" element={<RequireAdmin superOnly><AdminUsers /></RequireAdmin>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;

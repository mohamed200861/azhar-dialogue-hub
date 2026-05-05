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
import LiveDetail from "./pages/LiveDetail.tsx";
import FatwaArbitration from "./pages/FatwaArbitration.tsx";
import NewsletterPublic from "./pages/NewsletterPublic.tsx";
import ShariaAcademy from "./pages/ShariaAcademy.tsx";
import CivilizationalDialogue from "./pages/CivilizationalDialogue.tsx";
import ResearchStudies from "./pages/ResearchStudies.tsx";
import NotFound from "./pages/NotFound.tsx";

import PagesList from "./pages/admin/pages/PagesList.tsx";
import PagesEdit from "./pages/admin/pages/PagesEdit.tsx";
import LiveList from "./pages/admin/live/LiveList.tsx";
import LiveEdit from "./pages/admin/live/LiveEdit.tsx";

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
import FatwaRequests from "./pages/admin/FatwaRequests.tsx";
import ShariaAcademyAdmin from "./pages/admin/ShariaAcademyAdmin.tsx";
import CivilizationalDialogueAdmin from "./pages/admin/CivilizationalDialogueAdmin.tsx";
import ResearchStudiesAdmin from "./pages/admin/ResearchStudiesAdmin.tsx";

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
              <Route path="/events/:slug" element={<EventDetail />} />
              <Route path="/library" element={<Library />} />
              <Route path="/library/:slug" element={<LibraryDetail />} />
              <Route path="/videos" element={<Videos />} />
              <Route path="/videos/:slug" element={<VideoDetail />} />
              <Route path="/partnerships" element={<Partnerships />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/live/:slug" element={<LiveDetail />} />
              <Route path="/fatwa-arbitration" element={<FatwaArbitration />} />
              <Route path="/newsletter" element={<NewsletterPublic />} />
              <Route path="/sharia-academy" element={<ShariaAcademy />} />
              <Route path="/civilizational-dialogue" element={<CivilizationalDialogue />} />
              <Route path="/research-studies" element={<ResearchStudies />} />


              {/* Admin */}
              <Route path="/admin/setup" element={<AdminSetup />} />
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
                <Route path="live" element={<LiveList />} />
                <Route path="live/:id" element={<LiveEdit />} />
                <Route path="pages" element={<PagesList />} />
                <Route path="pages/:id" element={<PagesEdit />} />
                <Route path="media" element={<MediaManager />} />
                <Route path="messages" element={<Messages />} />
                <Route path="newsletter" element={<Newsletter />} />
                <Route path="fatwa-arbitration" element={<FatwaRequests />} />
                <Route path="sharia-academy" element={<ShariaAcademyAdmin />} />
                <Route path="civilizational-dialogue" element={<CivilizationalDialogueAdmin />} />
                <Route path="research-studies" element={<ResearchStudiesAdmin />} />
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

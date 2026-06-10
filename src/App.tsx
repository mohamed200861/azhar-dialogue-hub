import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { lazyWithRetry as lazy } from "@/lib/lazyWithRetry";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { InstallPrompt } from "@/components/InstallPrompt";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";

// Eager — landing + critical
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

// Public pages — lazy
const About = lazy(() => import("./pages/About.tsx"));
const Vision = lazy(() => import("./pages/Vision.tsx"));
const News = lazy(() => import("./pages/News.tsx"));
const NewsDetail = lazy(() => import("./pages/NewsDetail.tsx"));
const Events = lazy(() => import("./pages/Events.tsx"));
const EventDetail = lazy(() => import("./pages/EventDetail.tsx"));
const Library = lazy(() => import("./pages/Library.tsx"));
const LibraryDetail = lazy(() => import("./pages/LibraryDetail.tsx"));
const Videos = lazy(() => import("./pages/Videos.tsx"));
const VideoDetail = lazy(() => import("./pages/VideoDetail.tsx"));
const Partnerships = lazy(() => import("./pages/Partnerships.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const LiveDetail = lazy(() => import("./pages/LiveDetail.tsx"));
const FatwaArbitration = lazy(() => import("./pages/FatwaArbitration.tsx"));
const NewsletterPublic = lazy(() => import("./pages/NewsletterPublic.tsx"));
const ShariaAcademy = lazy(() => import("./pages/ShariaAcademy.tsx"));
const CivilizationalDialogue = lazy(() => import("./pages/CivilizationalDialogue.tsx"));
const ResearchStudies = lazy(() => import("./pages/ResearchStudies.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const Memberships = lazy(() => import("./pages/Memberships.tsx"));
const Quran = lazy(() => import("./pages/Quran.tsx"));
const QuranDetail = lazy(() => import("./pages/QuranDetail.tsx"));
const Khutbahs = lazy(() => import("./pages/Khutbahs.tsx"));
const KhutbahDetail = lazy(() => import("./pages/KhutbahDetail.tsx"));

// Admin — lazy
const AdminSetup = lazy(() => import("./pages/admin/Setup.tsx"));
const AdminLogin = lazy(() => import("./pages/admin/Login.tsx"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard.tsx"));
const NewsList = lazy(() => import("./pages/admin/news/NewsList.tsx"));
const NewsEdit = lazy(() => import("./pages/admin/news/NewsEdit.tsx"));
const LibraryList = lazy(() => import("./pages/admin/library/LibraryList.tsx"));
const LibraryEdit = lazy(() => import("./pages/admin/library/LibraryEdit.tsx"));
const VideosList = lazy(() => import("./pages/admin/videos/VideosList.tsx"));
const VideosEdit = lazy(() => import("./pages/admin/videos/VideosEdit.tsx"));
const EventsList = lazy(() => import("./pages/admin/events/EventsList.tsx"));
const EventsEdit = lazy(() => import("./pages/admin/events/EventsEdit.tsx"));
const PagesList = lazy(() => import("./pages/admin/pages/PagesList.tsx"));
const PagesEdit = lazy(() => import("./pages/admin/pages/PagesEdit.tsx"));
const LiveList = lazy(() => import("./pages/admin/live/LiveList.tsx"));
const LiveEdit = lazy(() => import("./pages/admin/live/LiveEdit.tsx"));
const MediaManager = lazy(() => import("./pages/admin/MediaManager.tsx"));
const Messages = lazy(() => import("./pages/admin/Messages.tsx"));
const Newsletter = lazy(() => import("./pages/admin/Newsletter.tsx"));
const Settings = lazy(() => import("./pages/admin/Settings.tsx"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers.tsx"));
const FatwaRequests = lazy(() => import("./pages/admin/FatwaRequests.tsx"));
const ShariaAcademyAdmin = lazy(() => import("./pages/admin/ShariaAcademyAdmin.tsx"));
const CivilizationalDialogueAdmin = lazy(() => import("./pages/admin/CivilizationalDialogueAdmin.tsx"));
const ResearchStudiesAdmin = lazy(() => import("./pages/admin/ResearchStudiesAdmin.tsx"));
const NewsTickerAdmin = lazy(() => import("./pages/admin/NewsTickerAdmin.tsx"));
const FatwaFilesAdmin = lazy(() => import("./pages/admin/FatwaFilesAdmin.tsx"));
const FeedbackAdmin = lazy(() => import("./pages/admin/FeedbackAdmin.tsx"));
const RolesPermissions = lazy(() => import("./pages/admin/RolesPermissions.tsx"));
const FatwaDepartmentsAdmin = lazy(() => import("./pages/admin/FatwaDepartmentsAdmin.tsx"));
const MembershipTypesAdmin = lazy(() => import("./pages/admin/MembershipTypesAdmin.tsx"));
const MembershipApplicationsAdmin = lazy(() => import("./pages/admin/MembershipApplicationsAdmin.tsx"));
const MembershipMethodsAdmin = lazy(() => import("./pages/admin/MembershipMethodsAdmin.tsx"));
const QuranLessonsAdmin = lazy(() => import("./pages/admin/QuranLessonsAdmin.tsx"));
const KhutbahsAdmin = lazy(() => import("./pages/admin/KhutbahsAdmin.tsx"));
const SimpleListAdmins = lazy(() => import("./pages/admin/SimpleListAdmins.tsx").then(m => ({ default: m.QuranCategoriesAdmin })));
const QuranTeachersAdminLazy = lazy(() => import("./pages/admin/SimpleListAdmins.tsx").then(m => ({ default: m.QuranTeachersAdmin })));
const KhutbahCategoriesAdminLazy = lazy(() => import("./pages/admin/SimpleListAdmins.tsx").then(m => ({ default: m.KhutbahCategoriesAdmin })));
const KhutbahSpeakersAdminLazy = lazy(() => import("./pages/admin/SimpleListAdmins.tsx").then(m => ({ default: m.KhutbahSpeakersAdmin })));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center" dir="rtl">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <RouteErrorBoundary>
              <Suspense fallback={<RouteFallback />}>

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
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                <Route path="/memberships" element={<Memberships />} />
                <Route path="/quran" element={<Quran />} />
                <Route path="/quran/:slug" element={<QuranDetail />} />
                <Route path="/khutbahs" element={<Khutbahs />} />
                <Route path="/khutbahs/:slug" element={<KhutbahDetail />} />

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
                  <Route path="fatwa-arbitration/files" element={<FatwaFilesAdmin />} />
                  <Route path="fatwa-arbitration/departments" element={<FatwaDepartmentsAdmin />} />
                  <Route path="feedback" element={<FeedbackAdmin />} />
                  <Route path="sharia-academy" element={<ShariaAcademyAdmin />} />
                  <Route path="civilizational-dialogue" element={<CivilizationalDialogueAdmin />} />
                  <Route path="research-studies" element={<ResearchStudiesAdmin />} />
                  <Route path="news-ticker" element={<NewsTickerAdmin />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="admins" element={<RequireAdmin superOnly><AdminUsers /></RequireAdmin>} />
                  <Route path="roles" element={<RequireAdmin superOnly><RolesPermissions /></RequireAdmin>} />

                  <Route path="memberships" element={<MembershipApplicationsAdmin />} />
                  <Route path="memberships/types" element={<MembershipTypesAdmin />} />
                  <Route path="memberships/applications" element={<MembershipApplicationsAdmin />} />
                  <Route path="memberships/payment-methods" element={<MembershipMethodsAdmin />} />
                  <Route path="memberships/methods" element={<MembershipMethodsAdmin />} />

                  <Route path="quran" element={<QuranLessonsAdmin />} />
                  <Route path="quran/lessons" element={<QuranLessonsAdmin />} />
                  <Route path="quran/categories" element={<SimpleListAdmins />} />
                  <Route path="quran/teachers" element={<QuranTeachersAdminLazy />} />

                  <Route path="khutbahs" element={<KhutbahsAdmin />} />
                  <Route path="khutbahs/categories" element={<KhutbahCategoriesAdminLazy />} />
                  <Route path="khutbahs/speakers" element={<KhutbahSpeakersAdminLazy />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;

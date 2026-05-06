// Arabic-only content for the public site.
// Keep `Bi` as an alias to plain string so any legacy `.ar` access stays valid via getters.

export type Bi = { ar: string; it: string };
const a = (ar: string): Bi => ({ ar, it: ar });

export const site = {
  name: a("اتحاد علماء الأزهر"),
  slogan: a("منهج أزهري… ورسالة عالمية"),
  email: "alazharscholarunion@gmail.com",
  facebook: "https://www.facebook.com/share/1ECiSRM9VT/",
  founded: "2017",
  scope: a("خدمة علمية ودعوية عالمية"),
  hq: a("خدمة علمية ودعوية عالمية"),
};

// Public navigation — Arabic only.
export const nav: { key: string; href: string; label: string }[] = [
  { key: "home", href: "/", label: "الرئيسية" },
  { key: "about", href: "/about", label: "من نحن" },
  { key: "vision", href: "/vision", label: "الرؤية والرسالة" },
  { key: "news", href: "/news", label: "الأخبار والبيانات" },
  { key: "events", href: "/events", label: "الفعاليات" },
  { key: "library", href: "/library", label: "المكتبة" },
  { key: "videos", href: "/videos", label: "المرئيات والبث المباشر" },
  { key: "contact", href: "/contact", label: "تواصل معنا" },
];

// Specialized sections — shown as dropdown "الأقسام" in header and as a footer column.
export const specializedSections: { href: string; label: string; desc: string }[] = [
  { href: "/fatwa-arbitration", label: "الفتوى والتحكيم الشرعي", desc: "فتاوى وتحكيم شرعي بمنهج وسطي." },
  { href: "/sharia-academy", label: "أكاديمية العلوم الشرعية", desc: "دورات ودبلومات وإجازات علمية." },
  { href: "/civilizational-dialogue", label: "الحوار والتواصل الحضاري", desc: "حوار بين الأديان والثقافات." },
  { href: "/research-studies", label: "البحوث والدراسات", desc: "بحوث ودراسات شرعية وفكرية." },
  { href: "/newsletter", label: "نشرة الأخبار", desc: "اشترك ليصلك كل جديد." },
];

// Institutional publisher sources (no personal names).
export const PUBLISHER_SOURCES = [
  "إدارة الاتحاد",
  "إدارة الموقع",
  "اللجنة العلمية",
  "القسم الإعلامي",
  "القسم العلمي",
  "قسم التدريب",
  "قسم النشر",
  "المكتبة العلمية",
  "خدمة علمية ودعوية عالمية",
] as const;

export const hero = {
  title: "اتحاد علماء الأزهر",
  subtitle: "منهج أزهري… ورسالة عالمية",
  description:
    "مؤسسة إسلامية دعوية علمية غير ربحية تسعى إلى نشر المنهج الأزهري الوسطي وخدمة قضايا الأمة وتعزيز القيم الإسلامية في المجتمعات المعاصرة.",
  buttons: {
    primary: { label: "تعرف علينا", href: "/about" },
    secondary: { label: "آخر البيانات", href: "/news" },
    tertiary: { label: "تواصل معنا", href: "/contact" },
  },
};

export const about = {
  short:
    "اتحاد علماء الأزهر مؤسسة إسلامية دعوية علمية غير ربحية، تضم نخبة من علماء الأزهر الشريف والمهتمين بالدعوة الإسلامية.",
  full:
    "اتحاد علماء الأزهر مؤسسة إسلامية دعوية علمية غير ربحية، تضم نخبة من علماء الأزهر الشريف والمهتمين بالدعوة الإسلامية. يسعى الاتحاد إلى نشر المنهج الأزهري الوسطي، والدفاع عن ثوابت الإسلام، وتعزيز الحضور العلمي والدعوي للأزهر الشريف على المستوى العالمي، من خلال برامج علمية وتربوية ومجتمعية تواكب تحديات العصر.",
};

export const vision =
  "الريادة في العمل الدعوي والعلمي الوسطي، واستعادة الدور الحضاري للأزهر الشريف في قيادة الأمة فكريًا وروحيًا.";

export const mission =
  "نشر المنهج الأزهري المعتدل، وتأهيل العلماء والدعاة، وخدمة قضايا الأمة، وتعزيز القيم الإسلامية في المجتمعات المعاصرة.";

export const values: { label: string; icon: string }[] = [
  { label: "الوسطية", icon: "Scale" },
  { label: "الاعتدال", icon: "GitFork" },
  { label: "العلمية", icon: "BookOpen" },
  { label: "المصداقية", icon: "ShieldCheck" },
  { label: "العمل المؤسسي", icon: "Building2" },
  { label: "خدمة المجتمع", icon: "HeartHandshake" },
];

// مجالات عمل الاتحاد — replaces homepage statistics.
export const workAreas: { title: string; desc: string; icon: string }[] = [
  { title: "الدعوة", desc: "نشر المنهج الأزهري الوسطي وتقديم الفهم الصحيح للإسلام للناس في كل مكان.", icon: "Megaphone" },
  { title: "العلم", desc: "البحث والدراسات الشرعية وفق منهج الأزهر الشريف وخدمة العلوم الإسلامية.", icon: "GraduationCap" },
  { title: "التدريب", desc: "تأهيل العلماء والدعاة علميًا ومهنيًا عبر برامج متخصصة ومستمرة.", icon: "Users" },
  { title: "الإعلام", desc: "إنتاج محتوى إعلامي هادف يخدم رسالة الاتحاد ويواكب تحديات العصر.", icon: "Tv" },
  { title: "العمل الاجتماعي", desc: "خدمة المجتمع وتعزيز القيم الإنسانية المشتركة والتعاون مع المؤسسات.", icon: "HeartHandshake" },
];

export const objectives: string[] = [
  "تعزيز مكانة الأزهر الشريف والدفاع عن رسالته.",
  "نشر الفهم الصحيح للإسلام وفق المنهج الوسطي.",
  "الرد على الشبهات المثارة حول الإسلام.",
  "تطوير وتأهيل العلماء والدعاة علميًا ومهنيًا.",
  "دعم العلماء ورعايتهم اجتماعيًا ومهنيًا.",
  "بيان الأحكام الشرعية في القضايا المعاصرة.",
  "تعزيز التعاون مع المؤسسات على القيم الإنسانية المشتركة.",
];

export const activities: string[] = [
  "تنظيم المحاضرات والندوات العلمية",
  "إعداد البرامج الدعوية والتوعوية",
  "الإسهام في معالجة القضايا المعاصرة",
  "بناء شراكات مع المؤسسات العلمية والدعوية",
];

export const newsCategories: string[] = [
  "بيانات رسمية", "أخبار الاتحاد", "مقالات", "قضايا معاصرة",
  "تهاني وتعازي", "لقاءات وحوارات", "أنشطة الاتحاد",
];

export const eventTypes: string[] = ["مؤتمرات", "ندوات", "دورات", "لقاءات", "محاضرات", "بث مباشر"];

export const libraryCategories: string[] = [
  "كتب", "ملفات PDF", "بحوث علمية", "مقالات علمية", "مجلات",
  "إصدارات الاتحاد", "مواد تدريبية", "المرئيات", "الصوتيات",
];

export const videoCategories: string[] = [
  "بث مباشر", "محاضرات", "لقاءات", "دروس قصيرة", "ندوات مسجلة", "تسجيلات", "برامج توعوية",
];

export const placeholders = {
  comingSoon: "سيتم إضافة هذا المحتوى قريبًا.",
  bioSoon: "سيتم إضافة هذا المحتوى قريبًا.",
  noLive: "لا يوجد بث مباشر حاليًا. تابعونا لمعرفة مواعيد البث القادمة.",
};

export const ui = {
  readMore: "اقرأ المزيد",
  viewAll: "عرض الكل",
  download: "تحميل",
  readOnline: "قراءة أونلاين",
  search: "بحث",
  send: "إرسال",
  subscribe: "اشترك الآن",
  emailPlaceholder: "أدخل بريدك الإلكتروني",
  newsletterTitle: "الاشتراك في النشرة البريدية",
  newsletterDesc: "اشترك الآن ليصلك كل ما هو جديد عن أخبار الاتحاد.",
  upcomingEvents: "الفعاليات القادمة",
  pastEvents: "الفعاليات السابقة",
  watchReplay: "مشاهدة التسجيل",
  register: "سجل الآن",
  publishedBy: "نُشر بواسطة",
  organizedBy: "نُظّم بواسطة",
  partnerCta: "للتعاون والشراكات المؤسسية، يمكنكم التواصل معنا عبر البريد الإلكتروني الرسمي.",
  copyright: "جميع الحقوق محفوظة — اتحاد علماء الأزهر",
};

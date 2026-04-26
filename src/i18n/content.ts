// Arabic-only content for the public site.
// The `Bi` shape (ar/it) is kept so existing pages that read `.ar` keep working,
// but `it` simply mirrors `ar`. New content should just use plain strings.

export type Bi = { ar: string; it: string };
const a = (ar: string): Bi => ({ ar, it: ar });

export const site = {
  name: a("اتحاد علماء الأزهر"),
  slogan: a("منهج أزهري… ورسالة عالمية"),
  email: "alazharscholarunion@gmail.com",
  facebook: "https://www.facebook.com/share/1ECiSRM9VT/",
  founded: "2017",
  hq: a("إنجلترا"),
};

// Public navigation — Arabic only, Leadership removed.
export const nav: { key: string; href: string; label: Bi }[] = [
  { key: "home", href: "/", label: a("الرئيسية") },
  { key: "about", href: "/about", label: a("من نحن") },
  { key: "vision", href: "/vision", label: a("الرؤية والرسالة") },
  { key: "news", href: "/news", label: a("الأخبار والبيانات") },
  { key: "events", href: "/events", label: a("الفعاليات") },
  { key: "library", href: "/library", label: a("المكتبة") },
  { key: "videos", href: "/videos", label: a("المرئيات والبث المباشر") },
  { key: "partners", href: "/partnerships", label: a("الشراكات") },
  { key: "contact", href: "/contact", label: a("تواصل معنا") },
];

// Institutional publisher sources (no personal names).
export const PUBLISHER_SOURCES = [
  "إدارة الاتحاد",
  "الأمانة العامة",
  "فريق التحرير",
  "إدارة الموقع",
  "القسم الإعلامي",
  "القسم العلمي",
  "قسم التدريب",
  "قسم النشر",
  "المكتبة العلمية",
] as const;

export const hero = {
  title: site.name,
  subtitle: site.slogan,
  description: a(
    "مؤسسة إسلامية دعوية علمية غير ربحية تسعى إلى نشر المنهج الأزهري الوسطي وخدمة قضايا الأمة وتعزيز القيم الإسلامية في المجتمعات المعاصرة."
  ),
  buttons: {
    primary: { ...a("تعرف علينا"), href: "/about" },
    secondary: { ...a("آخر البيانات"), href: "/news" },
    tertiary: { ...a("تواصل معنا"), href: "/contact" },
  },
};

export const about = {
  short: a(
    "اتحاد علماء الأزهر مؤسسة إسلامية دعوية علمية غير ربحية، تضم نخبة من علماء الأزهر الشريف والمهتمين بالدعوة الإسلامية."
  ),
  full: a(
    "اتحاد علماء الأزهر مؤسسة إسلامية دعوية علمية غير ربحية، تضم نخبة من علماء الأزهر الشريف والمهتمين بالدعوة الإسلامية. يسعى الاتحاد إلى نشر المنهج الأزهري الوسطي، والدفاع عن ثوابت الإسلام، وتعزيز الحضور العلمي والدعوي للأزهر الشريف على المستوى العالمي، من خلال برامج علمية وتربوية ومجتمعية تواكب تحديات العصر."
  ),
};

export const vision: Bi = a(
  "الريادة في العمل الدعوي والعلمي الوسطي، واستعادة الدور الحضاري للأزهر الشريف في قيادة الأمة فكريًا وروحيًا."
);

export const mission: Bi = a(
  "نشر المنهج الأزهري المعتدل، وتأهيل العلماء والدعاة، وخدمة قضايا الأمة، وتعزيز القيم الإسلامية في المجتمعات المعاصرة."
);

export const values: { ar: string; it: string; icon: string }[] = [
  { ...a("الوسطية"), icon: "Scale" },
  { ...a("الاعتدال"), icon: "GitFork" },
  { ...a("العلمية"), icon: "BookOpen" },
  { ...a("المصداقية"), icon: "ShieldCheck" },
  { ...a("العمل المؤسسي"), icon: "Building2" },
  { ...a("خدمة المجتمع"), icon: "HeartHandshake" },
];

// New: مجالات عمل الاتحاد — replaces homepage statistics.
export const workAreas: { title: string; desc: string; icon: string }[] = [
  {
    title: "الدعوة",
    desc: "نشر المنهج الأزهري الوسطي وتقديم الفهم الصحيح للإسلام للناس في كل مكان.",
    icon: "Megaphone",
  },
  {
    title: "العلم",
    desc: "البحث والدراسات الشرعية وفق منهج الأزهر الشريف وخدمة العلوم الإسلامية.",
    icon: "GraduationCap",
  },
  {
    title: "التدريب",
    desc: "تأهيل العلماء والدعاة علميًا ومهنيًا عبر برامج متخصصة ومستمرة.",
    icon: "Users",
  },
  {
    title: "الإعلام",
    desc: "إنتاج محتوى إعلامي هادف يخدم رسالة الاتحاد ويواكب تحديات العصر.",
    icon: "Tv",
  },
  {
    title: "العمل الاجتماعي",
    desc: "خدمة المجتمع وتعزيز القيم الإنسانية المشتركة والتعاون مع المؤسسات.",
    icon: "HeartHandshake",
  },
];

// Kept for any page that still references it (legacy alias = workAreas).
export const fields = workAreas.map((w) => ({
  ar: w.title,
  it: w.title,
  icon: w.icon,
  desc: a(w.desc),
}));

export const objectives: Bi[] = [
  a("تعزيز مكانة الأزهر الشريف والدفاع عن رسالته."),
  a("نشر الفهم الصحيح للإسلام وفق المنهج الوسطي."),
  a("الرد على الشبهات المثارة حول الإسلام."),
  a("تطوير وتأهيل العلماء والدعاة علميًا ومهنيًا."),
  a("دعم العلماء ورعايتهم اجتماعيًا ومهنيًا."),
  a("بيان الأحكام الشرعية في القضايا المعاصرة."),
  a("تعزيز التعاون مع المؤسسات على القيم الإنسانية المشتركة."),
];

export const activities: Bi[] = [
  a("تنظيم المحاضرات والندوات العلمية"),
  a("إعداد البرامج الدعوية والتوعوية"),
  a("الإسهام في معالجة القضايا المعاصرة"),
  a("بناء شراكات مع المؤسسات العلمية والدعوية"),
];

export const newsCategories: Bi[] = [
  a("بيانات رسمية"),
  a("أخبار الاتحاد"),
  a("مقالات"),
  a("قضايا معاصرة"),
  a("تهاني وتعازي"),
  a("لقاءات وحوارات"),
  a("أنشطة الاتحاد"),
];

// Sample posts use institutional `publisher` instead of personal author names.
export const sampleNews = [
  {
    category: newsCategories[0],
    publisher: "الأمانة العامة",
    title: a("بيان الاتحاد بمناسبة المؤتمر السنوي للعلماء"),
    excerpt: a(
      "يصدر اتحاد علماء الأزهر بيانًا رسميًا بمناسبة انعقاد المؤتمر السنوي للعلماء، مؤكدًا على أهمية المنهج الأزهري الوسطي في خدمة قضايا الأمة."
    ),
    date: "2024-09-12",
  },
  {
    category: newsCategories[1],
    publisher: "إدارة الاتحاد",
    title: a("انطلاق برنامج تأهيل الدعاة الجدد"),
    excerpt: a(
      "أعلن الاتحاد عن انطلاق الدفعة الجديدة من برنامج تأهيل الدعاة، الذي يستهدف تطوير المهارات العلمية والدعوية وفق منهج الأزهر الشريف."
    ),
    date: "2024-08-04",
  },
  {
    category: newsCategories[3],
    publisher: "فريق التحرير",
    title: a("مقاربة شرعية في قضايا الأسرة المعاصرة"),
    excerpt: a(
      "ورقة علمية تستعرض المقاربة الأزهرية لعدد من قضايا الأسرة المعاصرة، مع التركيز على القيم المشتركة والاعتدال."
    ),
    date: "2024-07-21",
  },
  {
    category: newsCategories[6],
    publisher: "إدارة الاتحاد",
    title: a("زيارة وفد الاتحاد لمؤسسات علمية في أوروبا"),
    excerpt: a(
      "في إطار تعزيز التعاون المؤسسي، زار وفد من الاتحاد عددًا من المؤسسات العلمية والدعوية في أوروبا."
    ),
    date: "2024-06-15",
  },
  {
    category: newsCategories[2],
    publisher: "فريق التحرير",
    title: a("المنهج الوسطي وبناء الجسور الحضارية"),
    excerpt: a(
      "مقال يستعرض دور المنهج الأزهري الوسطي في بناء جسور التفاهم بين الحضارات وتعزيز القيم الإنسانية المشتركة."
    ),
    date: "2024-05-30",
  },
  {
    category: newsCategories[4],
    publisher: "الأمانة العامة",
    title: a("تهنئة بمناسبة الأعياد المباركة"),
    excerpt: a(
      "يتقدم اتحاد علماء الأزهر بأحرّ التهاني بمناسبة الأعياد المباركة، سائلين المولى عز وجل أن يعيدها على الأمة بالخير."
    ),
    date: "2024-04-10",
  },
];

export const eventTypes: Bi[] = [
  a("مؤتمرات"),
  a("ندوات"),
  a("دورات"),
  a("لقاءات"),
  a("محاضرات"),
  a("بث مباشر"),
];

export const sampleEvents = [
  {
    type: eventTypes[0],
    organizer: "إدارة الاتحاد",
    title: a("المؤتمر السنوي للعلماء"),
    description: a(
      "مؤتمر علمي يجمع علماء الأزهر والمهتمين لمناقشة قضايا الأمة المعاصرة وفق المنهج الوسطي."
    ),
    date: "2025-03-15",
    location: a("لندن، المملكة المتحدة"),
    status: "upcoming" as const,
  },
  {
    type: eventTypes[1],
    organizer: "القسم العلمي",
    title: a("ندوة: الأسرة المسلمة في الغرب"),
    description: a(
      "ندوة تستعرض التحديات والفرص أمام الأسرة المسلمة في المجتمعات الغربية."
    ),
    date: "2025-02-10",
    location: a("عبر الإنترنت"),
    status: "upcoming" as const,
  },
  {
    type: eventTypes[2],
    organizer: "قسم التدريب",
    title: a("دورة تأهيل الأئمة والدعاة"),
    description: a(
      "دورة مكثفة في العلوم الشرعية ومهارات الخطابة والدعوة وفق المنهج الأزهري."
    ),
    date: "2025-04-01",
    location: a("مانشستر، المملكة المتحدة"),
    status: "upcoming" as const,
  },
  {
    type: eventTypes[4],
    organizer: "القسم العلمي",
    title: a("محاضرة: مقاصد الشريعة في عصرنا"),
    description: a(
      "محاضرة علمية تتناول مقاصد الشريعة الإسلامية وتطبيقاتها المعاصرة."
    ),
    date: "2024-11-20",
    location: a("عبر الإنترنت"),
    status: "completed" as const,
  },
];

export const libraryCategories: Bi[] = [
  a("كتب"),
  a("ملفات PDF"),
  a("بحوث علمية"),
  a("مقالات علمية"),
  a("مجلات"),
  a("إصدارات الاتحاد"),
  a("مواد تدريبية"),
  a("المرئيات"),
  a("الصوتيات"),
];

export const sampleLibrary = [
  {
    category: libraryCategories[0],
    publisher: "إصدارات الاتحاد",
    // Legacy alias kept for any UI still reading `.author`
    author: a("إصدارات الاتحاد"),
    title: a("المنهج الأزهري الوسطي"),
    description: a(
      "كتاب يعرّف بالمنهج الأزهري الوسطي ويستعرض أصوله وتطبيقاته المعاصرة."
    ),
  },
  {
    category: libraryCategories[2],
    publisher: "قسم النشر",
    author: a("قسم النشر"),
    title: a("الفقه الإسلامي وقضايا العصر"),
    description: a(
      "بحث جماعي يتناول مقاربات الفقه الإسلامي للقضايا المعاصرة."
    ),
  },
  {
    category: libraryCategories[5],
    publisher: "إدارة الاتحاد",
    author: a("إدارة الاتحاد"),
    title: a("إصدارات الاتحاد السنوية"),
    description: a(
      "مجموعة الإصدارات السنوية للاتحاد، تتضمن البيانات والدراسات والأنشطة."
    ),
  },
  {
    category: libraryCategories[6],
    publisher: "قسم التدريب",
    author: a("قسم التدريب"),
    title: a("دليل الداعية المعاصر"),
    description: a(
      "مادة تدريبية تستهدف تأهيل الدعاة وفق المنهج الأزهري."
    ),
  },
];

export const videoCategories: Bi[] = [
  a("بث مباشر"),
  a("محاضرات"),
  a("لقاءات"),
  a("دروس قصيرة"),
  a("ندوات مسجلة"),
  a("تسجيلات"),
  a("برامج توعوية"),
];

export const placeholders = {
  comingSoon: a("سيتم إضافة هذا المحتوى قريبًا."),
  bioSoon: a("سيتم إضافة هذا المحتوى قريبًا."),
  noLive: a("لا يوجد بث مباشر حاليًا. تابعونا لمعرفة مواعيد البث القادمة."),
};

export const ui = {
  readMore: a("اقرأ المزيد"),
  viewAll: a("عرض الكل"),
  download: a("تحميل"),
  readOnline: a("قراءة أونلاين"),
  search: a("بحث"),
  send: a("إرسال"),
  subscribe: a("اشترك الآن"),
  emailPlaceholder: a("أدخل بريدك الإلكتروني"),
  newsletterTitle: a("الاشتراك في النشرة البريدية"),
  newsletterDesc: a("اشترك الآن ليصلك كل ما هو جديد عن أخبار الاتحاد."),
  upcomingEvents: a("الفعاليات القادمة"),
  pastEvents: a("الفعاليات السابقة"),
  watchReplay: a("مشاهدة التسجيل"),
  register: a("سجل الآن"),
  publishedBy: a("نُشر بواسطة"),
  organizedBy: a("نُظّم بواسطة"),
  partnerCta: a(
    "للتعاون والشراكات المؤسسية، يمكنكم التواصل معنا عبر البريد الإلكتروني الرسمي."
  ),
  copyright: a("جميع الحقوق محفوظة — اتحاد علماء الأزهر"),
};

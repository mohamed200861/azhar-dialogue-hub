// All bilingual content for the public site lives here.
// AR = Arabic, IT = Italian. Keep institutional, calm, and respectful tone.

export type Bi = { ar: string; it: string };

export const site = {
  name: { ar: "اتحاد علماء الأزهر", it: "Azhar Scholars Union" },
  slogan: { ar: "منهج أزهري… ورسالة عالمية", it: "Metodo azharita… messaggio globale" },
  email: "alazharscholarunion@gmail.com",
  facebook: "https://www.facebook.com/share/1ECiSRM9VT/",
  founded: "2017",
  hq: { ar: "إنجلترا", it: "Inghilterra" },
};

export const nav: { key: string; href: string; label: Bi }[] = [
  { key: "home", href: "/", label: { ar: "الرئيسية", it: "Home" } },
  { key: "about", href: "/about", label: { ar: "من نحن", it: "Chi siamo" } },
  { key: "vision", href: "/vision", label: { ar: "الرؤية والرسالة", it: "Visione e missione" } },
  { key: "leadership", href: "/leadership", label: { ar: "القيادة", it: "Leadership" } },
  { key: "news", href: "/news", label: { ar: "الأخبار والبيانات", it: "News e comunicati" } },
  { key: "events", href: "/events", label: { ar: "الفعاليات", it: "Eventi" } },
  { key: "library", href: "/library", label: { ar: "المكتبة", it: "Biblioteca" } },
  { key: "videos", href: "/videos", label: { ar: "المرئيات والبث", it: "Video e dirette" } },
  { key: "partners", href: "/partnerships", label: { ar: "الشراكات", it: "Collaborazioni" } },
  { key: "contact", href: "/contact", label: { ar: "تواصل معنا", it: "Contatti" } },
];

export const hero = {
  title: site.name,
  subtitle: site.slogan,
  description: {
    ar: "مؤسسة إسلامية دعوية علمية غير ربحية تسعى إلى نشر المنهج الأزهري الوسطي وخدمة قضايا الأمة وتعزيز القيم الإسلامية في المجتمعات المعاصرة.",
    it: "Un'istituzione islamica, scientifica, educativa e non profit che promuove il metodo azharita moderato e contribuisce al dialogo, alla formazione e al servizio della comunità.",
  },
  buttons: {
    primary: { ar: "تعرف علينا", it: "Scopri chi siamo", href: "/about" },
    secondary: { ar: "آخر البيانات", it: "Ultimi comunicati", href: "/news" },
    tertiary: { ar: "تواصل معنا", it: "Contattaci", href: "/contact" },
  },
};

export const stats: { value: string; label: Bi }[] = [
  { value: "2017", label: { ar: "سنة التأسيس", it: "Anno di fondazione" } },
  { value: "UK", label: { ar: "المقر الرئيسي", it: "Sede principale" } },
  { value: "5", label: { ar: "مجالات العمل", it: "Aree di lavoro" } },
  { value: "∞", label: { ar: "رسالة عالمية", it: "Messaggio globale" } },
];

export const about = {
  short: {
    ar: "اتحاد علماء الأزهر مؤسسة إسلامية دعوية علمية غير ربحية، تضم نخبة من علماء الأزهر الشريف والمهتمين بالدعوة الإسلامية.",
    it: "L'Azhar Scholars Union è un'istituzione islamica, scientifica, educativa e non profit, che riunisce studiosi di Al-Azhar e persone impegnate nella da'wah islamica.",
  },
  full: {
    ar: "اتحاد علماء الأزهر مؤسسة إسلامية دعوية علمية غير ربحية، تضم نخبة من علماء الأزهر الشريف والمهتمين بالدعوة الإسلامية. يسعى الاتحاد إلى نشر المنهج الأزهري الوسطي، والدفاع عن ثوابت الإسلام، وتعزيز الحضور العلمي والدعوي للأزهر الشريف على المستوى العالمي، من خلال برامج علمية وتربوية ومجتمعية تواكب تحديات العصر.",
    it: "L'Azhar Scholars Union è un'istituzione islamica, scientifica, educativa e non profit, che riunisce studiosi di Al-Azhar e persone impegnate nella da'wah islamica. L'Unione mira a diffondere il metodo azharita moderato, difendere i principi fondamentali dell'Islam e rafforzare la presenza scientifica ed educativa di Al-Azhar a livello globale, attraverso programmi formativi, culturali e sociali adatti alle sfide del nostro tempo.",
  },
};

export const vision: Bi = {
  ar: "الريادة في العمل الدعوي والعلمي الوسطي، واستعادة الدور الحضاري للأزهر الشريف في قيادة الأمة فكريًا وروحيًا.",
  it: "Essere un punto di riferimento nel lavoro scientifico, educativo e religioso moderato, contribuendo a rafforzare il ruolo culturale e spirituale di Al-Azhar nella guida della comunità.",
};

export const mission: Bi = {
  ar: "نشر المنهج الأزهري المعتدل، وتأهيل العلماء والدعاة، وخدمة قضايا الأمة، وتعزيز القيم الإسلامية في المجتمعات المعاصرة.",
  it: "Diffondere il metodo azharita moderato, formare studiosi e predicatori, servire le questioni della comunità e promuovere i valori islamici nelle società contemporanee.",
};

export const values: { ar: string; it: string; icon: string }[] = [
  { ar: "الوسطية", it: "Moderazione", icon: "Scale" },
  { ar: "الاعتدال", it: "Equilibrio", icon: "GitFork" },
  { ar: "العلمية", it: "Conoscenza", icon: "BookOpen" },
  { ar: "المصداقية", it: "Credibilità", icon: "ShieldCheck" },
  { ar: "العمل المؤسسي", it: "Lavoro istituzionale", icon: "Building2" },
  { ar: "خدمة المجتمع", it: "Servizio alla comunità", icon: "HeartHandshake" },
];

export const fields: { ar: string; it: string; icon: string; desc: Bi }[] = [
  {
    ar: "دعوي", it: "Da'wah", icon: "Megaphone",
    desc: { ar: "نشر المنهج الأزهري الوسطي وتقديم الفهم الصحيح للإسلام.", it: "Diffondere il metodo azharita moderato e una corretta comprensione dell'Islam." },
  },
  {
    ar: "علمي", it: "Scientifico", icon: "GraduationCap",
    desc: { ar: "البحث والدراسات الشرعية وفق منهج الأزهر الشريف.", it: "Ricerca e studi religiosi secondo il metodo di Al-Azhar." },
  },
  {
    ar: "تدريبي", it: "Formativo", icon: "Users",
    desc: { ar: "تأهيل العلماء والدعاة علميًا ومهنيًا.", it: "Formare studiosi e predicatori a livello scientifico e professionale." },
  },
  {
    ar: "إعلامي", it: "Media", icon: "Tv",
    desc: { ar: "إنتاج محتوى إعلامي هادف يخدم رسالة الاتحاد.", it: "Produrre contenuti mediatici che servano la missione dell'Unione." },
  },
  {
    ar: "اجتماعي", it: "Sociale", icon: "HeartHandshake",
    desc: { ar: "خدمة المجتمع وتعزيز القيم الإنسانية المشتركة.", it: "Servire la comunità e promuovere i valori umani condivisi." },
  },
];

export const objectives: Bi[] = [
  { ar: "تعزيز مكانة الأزهر الشريف والدفاع عن رسالته.", it: "Rafforzare il ruolo di Al-Azhar e difendere il suo messaggio." },
  { ar: "نشر الفهم الصحيح للإسلام وفق المنهج الوسطي.", it: "Diffondere una corretta comprensione dell'Islam secondo il metodo moderato." },
  { ar: "الرد على الشبهات المثارة حول الإسلام.", it: "Rispondere ai dubbi e alle idee errate sull'Islam." },
  { ar: "تطوير وتأهيل العلماء والدعاة علميًا ومهنيًا.", it: "Formare e qualificare studiosi e predicatori a livello scientifico e professionale." },
  { ar: "دعم العلماء ورعايتهم اجتماعيًا ومهنيًا.", it: "Sostenere gli studiosi dal punto di vista sociale e professionale." },
  { ar: "بيان الأحكام الشرعية في القضايا المعاصرة.", it: "Chiarire le questioni religiose contemporanee." },
  { ar: "تعزيز التعاون مع المؤسسات على القيم الإنسانية المشتركة.", it: "Rafforzare la collaborazione con istituzioni basate su valori umani comuni." },
];

export const activities: Bi[] = [
  { ar: "تنظيم المحاضرات والندوات العلمية", it: "Organizzazione di conferenze e seminari scientifici" },
  { ar: "إعداد البرامج الدعوية والتوعوية", it: "Preparazione di programmi educativi e di sensibilizzazione" },
  { ar: "الإسهام في معالجة القضايا المعاصرة", it: "Contributo alla discussione delle questioni contemporanee" },
  { ar: "بناء شراكات مع المؤسسات العلمية والدعوية", it: "Costruzione di collaborazioni con istituzioni scientifiche e religiose" },
];

export const leadership = [
  {
    name: { ar: "د. عبدالعزيز رجب", it: "Dott. Abdelaziz Ragab" },
    role: { ar: "الأمين العام", it: "Segretario Generale" },
    initials: "ع",
  },
  {
    name: { ar: "د. خالد فياض", it: "Dott. Khaled Fayad" },
    role: { ar: "وكيل الاتحاد", it: "Vice dell'Unione" },
    initials: "خ",
  },
  {
    name: { ar: "الشيخ أحمد جابر", it: "Sheikh Ahmed Gaber" },
    role: { ar: "المدير التنفيذي", it: "Direttore Esecutivo" },
    initials: "أ",
  },
];

export const newsCategories: Bi[] = [
  { ar: "بيانات رسمية", it: "Comunicati ufficiali" },
  { ar: "أخبار الاتحاد", it: "News dell'Unione" },
  { ar: "مقالات", it: "Articoli" },
  { ar: "تهاني وتعازي", it: "Messaggi istituzionali" },
  { ar: "قضايا معاصرة", it: "Questioni contemporanee" },
  { ar: "أنشطة الاتحاد", it: "Attività dell'Unione" },
];

export const sampleNews = [
  {
    category: newsCategories[0],
    title: { ar: "بيان الاتحاد بمناسبة المؤتمر السنوي للعلماء", it: "Comunicato dell'Unione in occasione della conferenza annuale" },
    excerpt: {
      ar: "يصدر اتحاد علماء الأزهر بيانًا رسميًا بمناسبة انعقاد المؤتمر السنوي للعلماء، مؤكدًا على أهمية المنهج الأزهري الوسطي في خدمة قضايا الأمة.",
      it: "L'Unione pubblica un comunicato ufficiale in occasione della conferenza annuale, sottolineando l'importanza del metodo azharita moderato.",
    },
    date: "2024-09-12",
  },
  {
    category: newsCategories[1],
    title: { ar: "انطلاق برنامج تأهيل الدعاة الجدد", it: "Avvio del programma di formazione per nuovi predicatori" },
    excerpt: {
      ar: "أعلن الاتحاد عن انطلاق الدفعة الجديدة من برنامج تأهيل الدعاة، الذي يستهدف تطوير المهارات العلمية والدعوية وفق منهج الأزهر الشريف.",
      it: "L'Unione annuncia l'inizio della nuova edizione del programma di formazione per predicatori, mirato allo sviluppo delle competenze scientifiche e di da'wah.",
    },
    date: "2024-08-04",
  },
  {
    category: newsCategories[4],
    title: { ar: "مقاربة شرعية في قضايا الأسرة المعاصرة", it: "Un approccio religioso alle questioni familiari contemporanee" },
    excerpt: {
      ar: "ورقة علمية تستعرض المقاربة الأزهرية لعدد من قضايا الأسرة المعاصرة، مع التركيز على القيم المشتركة والاعتدال.",
      it: "Un documento accademico che presenta l'approccio azharita ad alcune questioni familiari contemporanee, con attenzione ai valori condivisi e alla moderazione.",
    },
    date: "2024-07-21",
  },
  {
    category: newsCategories[5],
    title: { ar: "زيارة وفد الاتحاد لمؤسسات علمية في أوروبا", it: "Visita della delegazione dell'Unione a istituzioni scientifiche in Europa" },
    excerpt: {
      ar: "في إطار تعزيز التعاون المؤسسي، زار وفد من الاتحاد عددًا من المؤسسات العلمية والدعوية في أوروبا.",
      it: "Nell'ambito del rafforzamento della collaborazione istituzionale, una delegazione dell'Unione ha visitato istituzioni scientifiche e religiose in Europa.",
    },
    date: "2024-06-15",
  },
  {
    category: newsCategories[2],
    title: { ar: "المنهج الوسطي وبناء الجسور الحضارية", it: "Il metodo moderato e la costruzione di ponti culturali" },
    excerpt: {
      ar: "مقال يستعرض دور المنهج الأزهري الوسطي في بناء جسور التفاهم بين الحضارات وتعزيز القيم الإنسانية المشتركة.",
      it: "Un articolo che esplora il ruolo del metodo azharita moderato nella costruzione di ponti tra culture.",
    },
    date: "2024-05-30",
  },
  {
    category: newsCategories[3],
    title: { ar: "تهنئة بمناسبة الأعياد المباركة", it: "Auguri in occasione delle festività" },
    excerpt: {
      ar: "يتقدم اتحاد علماء الأزهر بأحرّ التهاني بمناسبة الأعياد المباركة، سائلين المولى عز وجل أن يعيدها على الأمة بالخير.",
      it: "L'Unione porge i suoi più sinceri auguri in occasione delle festività benedette.",
    },
    date: "2024-04-10",
  },
];

export const eventTypes: Bi[] = [
  { ar: "مؤتمرات", it: "Conferenze" },
  { ar: "ندوات", it: "Seminari" },
  { ar: "دورات", it: "Corsi" },
  { ar: "لقاءات", it: "Incontri" },
  { ar: "محاضرات", it: "Lezioni" },
  { ar: "بث مباشر", it: "Dirette" },
];

export const sampleEvents = [
  {
    type: eventTypes[0],
    title: { ar: "المؤتمر السنوي للعلماء", it: "Conferenza Annuale degli Studiosi" },
    description: {
      ar: "مؤتمر علمي يجمع علماء الأزهر والمهتمين لمناقشة قضايا الأمة المعاصرة وفق المنهج الوسطي.",
      it: "Una conferenza scientifica che riunisce studiosi di Al-Azhar per discutere le questioni contemporanee della comunità.",
    },
    date: "2025-03-15",
    location: { ar: "لندن، المملكة المتحدة", it: "Londra, Regno Unito" },
    status: "upcoming" as const,
  },
  {
    type: eventTypes[1],
    title: { ar: "ندوة: الأسرة المسلمة في الغرب", it: "Seminario: La famiglia musulmana in Occidente" },
    description: {
      ar: "ندوة تستعرض التحديات والفرص أمام الأسرة المسلمة في المجتمعات الغربية.",
      it: "Un seminario che analizza sfide e opportunità per la famiglia musulmana nelle società occidentali.",
    },
    date: "2025-02-10",
    location: { ar: "عبر الإنترنت", it: "Online" },
    status: "upcoming" as const,
  },
  {
    type: eventTypes[2],
    title: { ar: "دورة تأهيل الأئمة والدعاة", it: "Corso di formazione per imam e predicatori" },
    description: {
      ar: "دورة مكثفة في العلوم الشرعية ومهارات الخطابة والدعوة وفق المنهج الأزهري.",
      it: "Un corso intensivo in scienze religiose e abilità di predicazione secondo il metodo azharita.",
    },
    date: "2025-04-01",
    location: { ar: "مانشستر، المملكة المتحدة", it: "Manchester, Regno Unito" },
    status: "upcoming" as const,
  },
  {
    type: eventTypes[4],
    title: { ar: "محاضرة: مقاصد الشريعة في عصرنا", it: "Lezione: Gli obiettivi della Sharia nel nostro tempo" },
    description: {
      ar: "محاضرة علمية تتناول مقاصد الشريعة الإسلامية وتطبيقاتها المعاصرة.",
      it: "Una lezione accademica sugli obiettivi della Sharia e le loro applicazioni contemporanee.",
    },
    date: "2024-11-20",
    location: { ar: "عبر الإنترنت", it: "Online" },
    status: "completed" as const,
  },
];

export const libraryCategories: Bi[] = [
  { ar: "كتب", it: "Libri" },
  { ar: "ملفات PDF", it: "Documenti PDF" },
  { ar: "بحوث علمية", it: "Ricerche scientifiche" },
  { ar: "مقالات علمية", it: "Articoli scientifici" },
  { ar: "مجلات", it: "Riviste" },
  { ar: "رسائل علمية", it: "Studi e tesi" },
  { ar: "إصدارات الاتحاد", it: "Pubblicazioni dell'Unione" },
  { ar: "مواد تدريبية", it: "Materiali formativi" },
];

export const sampleLibrary = [
  {
    category: libraryCategories[0],
    title: { ar: "المنهج الأزهري الوسطي", it: "Il metodo azharita moderato" },
    author: { ar: "إصدارات الاتحاد", it: "Pubblicazioni dell'Unione" },
    description: {
      ar: "كتاب يعرّف بالمنهج الأزهري الوسطي ويستعرض أصوله وتطبيقاته المعاصرة.",
      it: "Un libro che presenta il metodo azharita moderato, le sue basi e le applicazioni contemporanee.",
    },
  },
  {
    category: libraryCategories[2],
    title: { ar: "الفقه الإسلامي وقضايا العصر", it: "Il fiqh islamico e le questioni contemporanee" },
    author: { ar: "مجموعة من الباحثين", it: "Gruppo di ricercatori" },
    description: {
      ar: "بحث جماعي يتناول مقاربات الفقه الإسلامي للقضايا المعاصرة.",
      it: "Una ricerca collettiva sugli approcci del fiqh islamico alle questioni contemporanee.",
    },
  },
  {
    category: libraryCategories[6],
    title: { ar: "إصدارات الاتحاد السنوية", it: "Pubblicazioni annuali dell'Unione" },
    author: { ar: "اتحاد علماء الأزهر", it: "Azhar Scholars Union" },
    description: {
      ar: "مجموعة الإصدارات السنوية للاتحاد، تتضمن البيانات والدراسات والأنشطة.",
      it: "Raccolta delle pubblicazioni annuali dell'Unione: comunicati, studi e attività.",
    },
  },
  {
    category: libraryCategories[7],
    title: { ar: "دليل الداعية المعاصر", it: "Manuale del predicatore contemporaneo" },
    author: { ar: "إصدارات الاتحاد", it: "Pubblicazioni dell'Unione" },
    description: {
      ar: "مادة تدريبية تستهدف تأهيل الدعاة وفق المنهج الأزهري.",
      it: "Materiale formativo per i predicatori secondo il metodo azharita.",
    },
  },
];

export const videoCategories: Bi[] = [
  { ar: "البث المباشر", it: "Diretta live" },
  { ar: "التسجيلات", it: "Registrazioni" },
  { ar: "المحاضرات المرئية", it: "Lezioni video" },
  { ar: "اللقاءات", it: "Interviste" },
  { ar: "المقاطع القصيرة", it: "Video brevi" },
];

export const placeholders = {
  comingSoon: { ar: "سيتم إضافة هذا المحتوى قريبًا.", it: "Questo contenuto sarà aggiunto prossimamente." },
  bioSoon: { ar: "سيتم إضافة السيرة الذاتية قريبًا.", it: "La biografia sarà aggiunta prossimamente." },
  noLive: {
    ar: "لا يوجد بث مباشر حاليًا. تابعونا لمعرفة مواعيد البث القادمة.",
    it: "Al momento non ci sono dirette. Seguiteci per conoscere le prossime trasmissioni.",
  },
};

export const ui = {
  readMore: { ar: "اقرأ المزيد", it: "Leggi di più" },
  viewAll: { ar: "عرض الكل", it: "Vedi tutti" },
  download: { ar: "تحميل", it: "Scarica" },
  readOnline: { ar: "قراءة أونلاين", it: "Leggi online" },
  search: { ar: "بحث", it: "Cerca" },
  send: { ar: "إرسال", it: "Invia" },
  subscribe: { ar: "اشتراك", it: "Iscriviti" },
  emailPlaceholder: { ar: "بريدك الإلكتروني", it: "La tua email" },
  newsletterTitle: { ar: "اشترك في النشرة البريدية", it: "Iscriviti alla newsletter" },
  newsletterDesc: {
    ar: "احصل على آخر البيانات والأخبار والإصدارات مباشرة إلى بريدك الإلكتروني.",
    it: "Ricevi gli ultimi comunicati, news e pubblicazioni direttamente nella tua email.",
  },
  upcomingEvents: { ar: "الفعاليات القادمة", it: "Eventi in arrivo" },
  pastEvents: { ar: "الفعاليات السابقة", it: "Eventi passati" },
  watchReplay: { ar: "مشاهدة التسجيل", it: "Guarda la replay" },
  register: { ar: "سجل الآن", it: "Iscriviti ora" },
  partnerCta: {
    ar: "للتعاون والشراكات المؤسسية، يمكنكم التواصل معنا عبر البريد الإلكتروني الرسمي.",
    it: "Per collaborazioni istituzionali, è possibile contattarci tramite l'email ufficiale.",
  },
  copyright: {
    ar: "© جميع الحقوق محفوظة لاتحاد علماء الأزهر",
    it: "© Tutti i diritti riservati — Azhar Scholars Union",
  },
};

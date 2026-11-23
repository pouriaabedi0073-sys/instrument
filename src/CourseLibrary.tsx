import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { courseChapters, courseSections } from './course'
import type { CourseChapter, CourseDomain } from './course'
import './CourseLibrary.css'

const normalize = (value: string) => value.toLocaleLowerCase('fa')
  .replace(/[يى]/g, 'ی')
  .replace(/ك/g, 'ک')
  .replace(/[\u200c\u200f\u0640]/g, ' ')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim()

const topicKeywords = (topic: string) => normalize(topic).split(' ')
  .filter((word) => word.length > 2 && !['در', 'برای', 'با', 'از', 'به', 'and'].includes(word))
  .map((word) => word.replace(/(های|ها|ان|ات|es|s)$/u, ''))
  .filter((word) => word.length > 1)

const topicExplanations: Record<string, string> = {
  'chapter-02:اصول ایمنی الکتریکی': 'پیش از کار، منبع و همهٔ مسیرهای بازگشت انرژی را طبق مجوز سایت ایزوله کنید، قفل و برچسب بزنید و بی‌برقی را با وسیلهٔ آزموده‌شده تأیید کنید. ردهٔ ایمنی مولتی‌متر و پراب باید متناسب با مدار باشد؛ اتصال زمین، فیوز حفاظتی و تجهیزات فردی را جایگزین رویهٔ ایمن نکنید.',
  'chapter-06:Thermocouple': 'ترموکوپل از اتصال دو فلز متفاوت ولتاژی وابسته به اختلاف دما میان اتصال اندازه‌گیری و مرجع تولید می‌کند. نوع زوج سیم، قطبیت، سیم جبران و جبران اتصال مرجع در ترانسمیتر باید هماهنگ باشند؛ اتصال مسی نامناسب یا جابه‌جایی قطب‌ها می‌تواند خطای بزرگ ایجاد کند.',
  'chapter-09:اصول آنالیز فرایندی': 'آنالایزر باید نمونه‌ای نماینده از فرایند را در شرایط قابل‌اندازه‌گیری دریافت کند. محل نمونه‌گیری، زمان انتقال، فشار، دما و آماده‌سازی روی نتیجه اثر دارند؛ صحت سنسور بدون نمونهٔ مناسب، تضمین‌کنندهٔ نتیجهٔ معتبر نیست.',
  'chapter-09:Sample Conditioning System': 'سامانهٔ آماده‌سازی نمونه، نمونه را با دبی، فشار، دما و پاکیزگی لازم به آنالایزر می‌رساند و اجزایی مثل فیلتر، تنظیم فشار یا خنک‌کننده ممکن است داشته باشد. طراحی نامناسب می‌تواند ترکیب نمونه را تغییر دهد یا آن را دیر برساند؛ اجزا را از نقشهٔ نمونه‌گیری و دستور سازنده بررسی کنید.',
  'chapter-12:مفهوم Calibration': 'کالیبراسیون مقایسهٔ پاسخ ابزار با مرجع دارای عدم‌قطعیت معلوم و ثبت نتایج در شرایط مشخص است. کالیبراسیون به‌تنهایی به معنای تنظیم، تعمیر یا تأیید مناسب‌بودن ابزار برای کار نیست؛ این تصمیم‌ها معیارهای جداگانه دارند.',
  'chapter-13:Cable Gland و Cable Tray': 'Cable Gland ورود کابل به محفظه را مهار و، بر اساس نوع آن، آب‌بندی یا حفاظت محیطی/ضدانفجاری ایجاد می‌کند. Cable Tray مسیر نگهدارندهٔ کابل است. قطر و نوع کابل، رزوه، جنس، IP و گواهی ناحیهٔ خطرناک را با طراحی تأییدشده تطبیق دهید.',
  'chapter-13:Junction Box': 'Junction Box محل اتصال و توزیع ترمینال‌های کابل میدانی است. شمارهٔ ترمینال، tag، درجهٔ حفاظت، ورودی گلند، ارت و فضای تعمیراتی باید با Termination Diagram و شرایط محل نصب یکسان باشد.',
  'chapter-13:Hazardous Area': 'ناحیهٔ خطرناک بر اساس احتمال حضور گاز، بخار یا غبار قابل‌اشتعال طبقه‌بندی می‌شود. گروه ماده، کلاس دما، zone/division و روش حفاظت تجهیز باید با گواهی محل و استاندارد پروژه منطبق باشد؛ IP rating به‌تنهایی حفاظت انفجاری را ثابت نمی‌کند.',
  'chapter-14:Multimeter': 'مولتی‌متر ولتاژ، جریان، مقاومت یا پیوستگی را با اتصال و بازهٔ مناسب می‌سنجد. برای جریان‌سنجی، دستگاه در مسیر سری قرار می‌گیرد؛ پراب در ورودی درست و ردهٔ ایمنی متناسب باشد. اندازه‌گیری مقاومت فقط روی مدار بی‌برق انجام می‌شود.',
  'chapter-14:Troubleshooting': 'عیب‌یابی را با ثبت نشانه و مقایسهٔ زنجیرهٔ سیگنال از حسگر تا ورودی کنترلر آغاز کنید. هر بار یک فرضیه را با آزمون ایمن بررسی کنید؛ پیش از بازکردن اتصال یا تغییر تنظیم، مجوز، ایزولاسیون و اثر بر فرایند را بسنجید.',
  'chapter-14:PM و CM': 'PM نگهداری پیشگیرانهٔ زمان‌بندی‌شده برای کاهش ریسک یا کشف زودهنگام خرابی است؛ CM تعمیر اصلاحی پس از شناسایی نقص است. تناوب و کار لازم باید بر اساس ریسک، سابقهٔ خرابی، شرایط کار و توصیهٔ سازنده تعیین شود.',
  'chapter-15:Flow Coefficient یا Cv': 'Cv شاخص ظرفیت عبور شیر تحت شرایط مرجع تعریف‌شده است و برای اندازه‌گذاری شیر به کار می‌رود. تبدیل Cv به دبی به سیال، چگالی، فشار، افت فشار و استاندارد محاسبه وابسته است؛ یک عدد Cv را بدون این شرایط معادل دبی ثابت ندانید.',
  'chapter-15:I/P Converter': 'مبدل I/P سیگنال جریان الکتریکی را به فشار پنوماتیکی متناسب تبدیل می‌کند تا فرمانی برای عملگر یا positioner فراهم شود. بازهٔ ورودی و خروجی، هوای تمیز و خشک، فشار تغذیه، اتصال و جهت عملکرد را از دیتاشیت بررسی کنید.',
  'chapter-15:Calibration و Troubleshooting': 'کالیبراسیون کنترل‌ولو، تطبیق سیگنال ورودی با حرکت و فیدبک موقعیت را در شرایط تعریف‌شده می‌سنجد. پیش از تنظیم، گیر مکانیکی، هوای محرک، نشتی، اصطکاک و جهت عملکرد را بررسی کنید؛ تغییر ولو در سرویس فقط با مجوز و هماهنگی بهره‌برداری مجاز است.',
  'chapter-16:Pneumatic، Hydraulic و Electric Actuator': 'محرک پنوماتیکی از هوای فشرده، هیدرولیکی از فشار مایع و الکتریکی از موتور و گیربکس نیرو می‌گیرد. نیرو/گشتاور، زمان حرکت، منبع انرژی، شرایط محیط و حالت امن هنگام قطع انرژی معیار مقایسه‌اند؛ هیچ نوعی برای همهٔ کاربردها مناسب نیست.',
  'chapter-18:Control System': 'سامانهٔ کنترل اندازه‌گیری‌ها و فرمان‌ها را برای نگه‌داشتن فرایند در رفتار مطلوب به هم پیوند می‌دهد. مرز سامانه می‌تواند از حسگر و کنترلر تا عملگر و رابط اپراتور باشد؛ هدف، ورودی‌ها، خروجی‌ها و حالت‌های شکست باید تعریف شوند.',
  'chapter-18:PV، Set Point و Controller Output': 'PV مقدار فرایند اندازه‌گیری‌شده، Set Point مقدار هدف و Controller Output فرمان محاسبه‌شدهٔ کنترلر است. اختلاف PV و SP خطای کنترل را می‌سازد؛ مقیاس و جهت عمل هر متغیر باید در پیکربندی و نقشهٔ حلقه مشخص باشد.',
  'chapter-19:Proportional، Integral و Derivative': 'بخش P خروجی را متناسب با خطای لحظه‌ای تغییر می‌دهد؛ I خطای ماندگار را در زمان انباشته می‌کند؛ D به نرخ تغییر خطا پاسخ می‌دهد. واحد، فرم و جهت الگوریتم بین کنترلرها متفاوت است و تنظیم PID باید بر اساس مدل و آزمون کنترل‌شدهٔ فرایند انجام شود.',
  'chapter-20:Distributed Architecture': 'در معماری توزیع‌شده، اندازه‌گیری، کنترل و نمایش میان چند کنترلر یا ایستگاه تقسیم می‌شوند و از طریق شبکهٔ صنعتی هماهنگ هستند. توزیع می‌تواند مقیاس‌پذیری و دسترس‌پذیری را بهبود دهد، اما وابستگی شبکه، هم‌زمانی داده و نقاط خرابی مشترک باید طراحی شوند.',
  'chapter-22:Power Supply': 'منبع تغذیهٔ PLC ولتاژهای لازم برای CPU و ماژول‌ها را فراهم می‌کند. ظرفیت بار، بازهٔ ورودی، اتصال زمین، حفاظت و افزونگی را طبق مشخصات سازنده کنترل کنید؛ از قطع یا جابه‌جایی منبع در سیستم فعال بدون مجوز خودداری کنید.',
  'chapter-22:Memory': 'حافظهٔ PLC برنامه، دادهٔ فرایند و تنظیمات را نگه می‌دارد؛ نوع حافظه و ماندگاری داده پس از قطع برق میان مدل‌ها فرق دارد. وضعیت باتری، retention، نسخهٔ برنامه و روش پشتیبان‌گیری را از راهنمای همان کنترلر بررسی کنید.',
  'chapter-22:Scan Cycle': 'چرخهٔ اسکن در بسیاری از PLCها ورودی‌ها را نمونه‌برداری، برنامه را اجرا و خروجی‌ها را به‌روزرسانی می‌کند؛ ارتباط و تشخیص نیز ممکن است در چرخه سهم داشته باشند. زمان اسکن به مدل، برنامه و بار ارتباطی وابسته است و بر پاسخ حلقه اثر می‌گذارد.',
  'chapter-23:Logic Gates': 'گیت‌های منطقی AND، OR و NOT ورودی‌های دودویی را به شرط خروجی تبدیل می‌کنند. AND فقط با برقرار بودن همهٔ شروط فعال است، OR با برقرار بودن دست‌کم یک شرط و NOT حالت را معکوس می‌کند؛ منطق واقعی باید با جدول علت‌ومعلول و حالت خرابی کنترل شود.',
  'chapter-26:Human Machine Interface': 'HMI رابط دیداری اپراتور برای مشاهدهٔ وضعیت، روند، آلارم و صدور فرمان مجاز است. چیدمان باید سلسله‌مراتب اطلاعات، وضوح واحدها، کیفیت داده و بازخورد عمل فرمان را نشان دهد؛ acknowledgement آلارم به معنای رفع علت نیست.',
  'chapter-26:Operator Command': 'فرمان اپراتور در HMI باید اختیار کاربر، وضعیت permissive/interlock، مقدار مجاز و بازخورد نتیجه را روشن کند. فرمان‌های راه‌دور و تغییر setpoint می‌توانند بر فرایند اثر بگذارند؛ اجرای آن‌ها تابع رویهٔ بهره‌برداری و سطح دسترسی است.',
  'chapter-28:Ethernet Network': 'اترنت صنعتی روش انتقال فریم و داده روی شبکه است؛ پروتکل کاربردی، توپولوژی، تجهیزات و نیازهای زمانی لایه‌های جداگانه‌اند. آدرس‌دهی، سرعت، افزونگی، تداخل الکترومغناطیسی و محدودیت سازگاری را مطابق نقشهٔ مصوب بررسی کنید.',
  'chapter-28:Fiber Optic': 'فیبر نوری داده را با نور منتقل می‌کند و در مسیر فیبر در برابر تداخل الکترومغناطیسی مصون است. نوع single-mode یا multimode، کانکتور، افت مسیر، مبدل و محدودیت خمش باید با طراحی شبکه تطبیق داده شود؛ آلودگی کانکتور نیز کیفیت لینک را کاهش می‌دهد.',
  'chapter-30:F&G System': 'سامانهٔ Fire & Gas آشکارسازهای گاز و حریق، منطق ارزیابی و خروجی‌های هشدار یا حفاظت را به هم پیوند می‌دهد. پوشش آشکارسازی، نوع ماده، محل نصب و اقدام هر Cause & Effect باید در طراحی و آزمون‌های مصوب بررسی شود.',
  'chapter-34:Troubleshooting': 'عیب‌یابی سامانهٔ کنترل را با بررسی آلارم و گزارش تشخیصی، تغذیه، وضعیت CPU، کانال I/O، کیفیت ارتباط و تغییرات اخیر پیش ببرید. شواهد را قبل از تعویض قطعه ثبت کنید و از force یا دستکاری آنلاین بدون مجوز بپرهیزید.',
  'chapter-34:خطای ارتباطی': 'خطای ارتباطی ممکن است از آدرس‌دهی، کابل/لایهٔ فیزیکی، تنظیم پروتکل، بار شبکه یا قطع تغذیه ناشی شود. ابتدا وضعیت محلی و diagnostic را بخوانید و با نقشهٔ مجاز مقایسه کنید؛ اسکن یا تغییر شبکهٔ تولیدی بدون هماهنگی انجام ندهید.',
  'chapter-35:تفاوت IT و OT': 'IT عمدتاً سامانه‌های اطلاعات و داده را اداره می‌کند؛ OT تجهیزات فیزیکی و فرایند را پایش یا کنترل می‌کند. در OT ایمنی، دسترس‌پذیری و زمان پاسخ اهمیت ویژه دارند؛ کنترل تغییر و اقدام امنیتی باید اثر عملیاتی را هم بسنجد.',
}

const getTopicExplanation = (chapter: CourseChapter, topic: string) => {
  const authoredExplanation = topicExplanations[`${chapter.id}:${topic}`]
  if (authoredExplanation) return authoredExplanation

  const sentences = chapter.content
    .split(/(?<=[.!؟؛])\s+|\n+/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
  const topicText = normalize(topic)
  const exactMatches = sentences.filter((sentence) => normalize(sentence).includes(topicText))
  if (exactMatches.length) return exactMatches.slice(0, 2).join(' ')

  const keywords = topicKeywords(topic)
  const relevant = sentences.filter((sentence) => {
    const sentenceText = normalize(sentence)
    return keywords.some((keyword) => sentenceText.includes(keyword))
  })
  if (relevant.length) return relevant.slice(0, keywords.length > 3 ? 3 : 2).join(' ')

  return `در فصل «${chapter.title}»، این سرفصل را در ارتباط با ${chapter.summary} بررسی کنید. هنگام مطالعه، تعریف دقیق، کاربرد صنعتی، محدودیت اندازه‌گیری یا عملکرد، و ارتباط آن با اجزای دیگر سامانه را از روی مدارک و مرجع فنی همان تجهیز مشخص کنید.`
}

const chapterMatches = (chapter: CourseChapter, query: string) => {
  const term = normalize(query)
  if (!term) return true
  const searchableText = normalize([
    chapter.title,
    chapter.summary,
    chapter.sectionTitle,
    chapter.sectionIntro,
    chapter.content,
    ...chapter.topics,
  ].join(' '))
  return searchableText.includes(term)
}

const renderBidiText = (text: string) => text.split(/([A-Za-z][A-Za-z0-9]*(?:[ \t/&+.-]+[A-Za-z0-9][A-Za-z0-9]*)*)/g)
  .map((part, index) => /^[A-Za-z]/.test(part)
    ? <bdi className="english-term" dir="ltr" key={index}>{part}</bdi>
    : part)

type CourseLibraryProps = {
  initialChapterId?: string | null
  onOpenExercise?: (chapterId: string) => void
}

function CourseLibrary({ initialChapterId = null, onOpenExercise }: CourseLibraryProps) {
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState<CourseDomain>(() =>
    courseChapters.find((chapter) => chapter.id === initialChapterId)?.domain ?? 'ابزار دقیق',
  )
  const [activeSection, setActiveSection] = useState<number | null>(null)
  const [selectedChapter, setSelectedChapter] = useState<CourseChapter | null>(() =>
    courseChapters.find((chapter) => chapter.id === initialChapterId) ?? null,
  )
  const [notice, setNotice] = useState('')

  useEffect(() => {
    try {
      localStorage.removeItem('precisionpro-topic-notes')
    } catch (error) {
      console.error('پاک‌کردن یادداشت‌های منسوخ‌شده ناموفق بود.', error)
    }
  }, [])

  const matchingChapters = useMemo(
    () => courseChapters.filter((chapter) =>
      chapter.domain === domain &&
      (activeSection === null || chapter.sectionNumber === activeSection) &&
      chapterMatches(chapter, query),
    ),
    [activeSection, domain, query],
  )
  const matchingSections = courseSections.filter((section) => section.domain === domain)
  const domainChapters = courseChapters.filter((chapter) => chapter.domain === domain)
  const completedChapters = (() => {
    try {
      const saved = localStorage.getItem('precisionpro-completed')
      const parsed: unknown = saved ? JSON.parse(saved) : []
      return Array.isArray(parsed) && parsed.every((id) => typeof id === 'string') ? parsed : []
    } catch (error) {
      console.error('خواندن وضعیت پیشرفت دوره ناموفق بود.', error)
      return []
    }
  })()
  const completedCount = domainChapters.filter((chapter) => completedChapters.includes(chapter.id)).length

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
    setSelectedChapter(null)
  }

  return (
    <section className="course-app page-enter" aria-label={`دانشنامهٔ ${domain}`}>
      <header className="course-welcome">
        <div className="course-welcome-copy">
          <span className="course-kicker">کتابخانهٔ یادگیری PrecisionPro</span>
          <h1>دانشنامهٔ <em>{domain}</em></h1>
          <p>{domain === 'ابزار دقیق' ? 'از شناخت فرایند تا سنجش، نصب و کالیبراسیون تجهیزات؛ با درس‌نامه و سرفصل‌های مستقل.' : 'از اصول کنترل تا PLC، شبکه و پروژه؛ مسیر درس‌ها و بخش‌های سیستم کنترل در یک فضای جدا.'}</p>
        </div>
        <div className="course-progress-card" aria-label={`پیشرفت ${domain} ${completedCount} از ${domainChapters.length} فصل`}>
          <span className="course-progress-icon">✓</span>
          <div><strong>{new Intl.NumberFormat('fa-IR').format(completedCount)} از {new Intl.NumberFormat('fa-IR').format(domainChapters.length)}</strong><span>فصل خوانده‌شده</span></div>
        </div>
      </header>

      <div className="course-domain-tabs" role="group" aria-label="حوزه‌های آموزشی">
        {(['ابزار دقیق', 'سیستم کنترل'] as CourseDomain[]).map((item) => (
          <button key={item} aria-pressed={domain === item} className={domain === item ? 'is-active' : ''} onClick={() => { setDomain(item); setActiveSection(null); setSelectedChapter(null); setQuery('') }}>
            <span>{item === 'ابزار دقیق' ? '◉' : '⌘'}</span><b>{item}</b><small>{new Intl.NumberFormat('fa-IR').format(courseChapters.filter((chapter) => chapter.domain === item).length)} فصل</small>
          </button>
        ))}
      </div>

      <div className="course-toolbar">
        <label className="course-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={handleSearch} placeholder="جست‌وجو در نام فصل، سرفصل یا متن درس..." aria-label="جست‌وجو در دوره" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="پاک‌کردن جست‌وجو">×</button>}
        </label>
        <span className="course-result-count">{new Intl.NumberFormat('fa-IR').format(matchingChapters.length)} فصل</span>
      </div>

      <div className="course-layout">
        <aside className="course-sidebar" aria-label="بخش‌های دوره">
          <div className="course-sidebar-title"><span>بخش‌های {domain}</span><span>{new Intl.NumberFormat('fa-IR').format(matchingSections.length)} بخش</span></div>
          <button className={`course-section-filter ${activeSection === null ? 'is-active' : ''}`} onClick={() => { setActiveSection(null); setSelectedChapter(null) }}>
            <span className="section-filter-number">⌂</span><span className="section-filter-text"><b>همهٔ فصل‌های {domain}</b><small>فهرست کامل این حوزه</small></span><span className="section-filter-count">{new Intl.NumberFormat('fa-IR').format(domainChapters.length)}</span>
          </button>
          {matchingSections.map((section) => (
            <button key={section.sectionNumber} className={`course-section-filter ${activeSection === section.sectionNumber ? 'is-active' : ''}`} onClick={() => { setActiveSection(section.sectionNumber); setSelectedChapter(null) }}>
              <span className="section-filter-number">{new Intl.NumberFormat('fa-IR').format(section.sectionNumber)}</span>
              <span className="section-filter-text"><b>{section.sectionTitle}</b><small>فصل‌های {new Intl.NumberFormat('fa-IR').format(section.first)} تا {new Intl.NumberFormat('fa-IR').format(section.last)}</small></span>
              <span className="section-filter-count">{new Intl.NumberFormat('fa-IR').format(section.last - section.first + 1)}</span>
            </button>
          ))}
          <div className="course-sidebar-foot">برای ادامهٔ مطالعه، یک فصل را انتخاب کنید. پیشرفت شما روی همین دستگاه ذخیره می‌شود.</div>
        </aside>

        <div className="course-main">
          {selectedChapter ? (
            <article className="chapter-reader">
              <button className="reader-back" onClick={() => setSelectedChapter(null)}>← بازگشت به فهرست فصل‌ها</button>
              <div className="reader-heading">
                <div className="reader-chapter-mark">{new Intl.NumberFormat('fa-IR').format(selectedChapter.chapterNumber)}</div>
                <div className="reader-heading-copy">
                  <div className="reader-meta"><span>{selectedChapter.sectionTitle}</span><span className={`reader-level level-${selectedChapter.level}`}>{selectedChapter.level}</span></div>
                  <h2>{selectedChapter.title}</h2>
                  <p>{renderBidiText(selectedChapter.summary)}</p>
                </div>
              </div>
              <div className="reader-section-intro"><strong>{renderBidiText(selectedChapter.sectionIntro)}</strong><span>{selectedChapter.domain} · فصل {new Intl.NumberFormat('fa-IR').format(selectedChapter.chapterNumber)} از ۳۶</span></div>
              <div className="reader-text-heading"><h3>درس‌نامهٔ فصل</h3><span>مفهوم‌های کلیدی و کاربردهای صنعتی</span></div>
              <div className="reader-body" dir="rtl">
                {selectedChapter.content.split('\n\n').filter(Boolean).map((paragraph, index) => <p key={index}>{renderBidiText(paragraph)}</p>)}
              </div>
              <div className="topics-heading"><div><span className="course-kicker">مطالعهٔ جزئی‌تر</span><h3>سرفصل‌های این فصل</h3></div><span>{new Intl.NumberFormat('fa-IR').format(selectedChapter.topics.length)} موضوع</span></div>
              <p className="topics-hint">هر سرفصل را باز کنید تا توضیح مفهومی و ارتباط آن با کاربرد صنعتی را بخوانید.</p>
              <div className="topic-list">
                {selectedChapter.topics.map((topic, index) => {
                  const key = `${selectedChapter.id}:${index}`
                  return (
                    <details className="topic-item" key={key}>
                      <summary><span className="topic-order">{new Intl.NumberFormat('fa-IR').format(index + 1)}</span><strong>{renderBidiText(topic)}</strong><span className="topic-chevron">⌄</span></summary>
                      <div className="topic-content">
                        <h4>توضیح مفهومی</h4>
                        <p>{renderBidiText(getTopicExplanation(selectedChapter, topic))}</p>
                      </div>
                    </details>
                  )
                })}
              </div>
              <div className="chapter-reference">
                <div><span className="course-kicker">برای مطالعهٔ بیشتر</span><strong>{renderBidiText(selectedChapter.sourceLabel)}</strong></div>
                <a href={selectedChapter.source} target="_blank" rel="noreferrer">مشاهدهٔ مرجع اصلی ↗</a>
              </div>
              <button className="chapter-complete" onClick={() => {
                const next = completedChapters.includes(selectedChapter.id)
                  ? completedChapters.filter((id) => id !== selectedChapter.id)
                  : [...completedChapters, selectedChapter.id]
                try {
                  localStorage.setItem('precisionpro-completed', JSON.stringify(next))
                  setNotice(next.includes(selectedChapter.id) ? 'فصل به‌عنوان خوانده‌شده ذخیره شد.' : 'علامت مطالعهٔ فصل برداشته شد.')
                } catch (error) {
                  console.error('ذخیرهٔ پیشرفت فصل ناموفق بود.', error)
                  setNotice('ذخیرهٔ پیشرفت فصل ناموفق بود.')
                }
              }}>{completedChapters.includes(selectedChapter.id) ? '✓ این فصل خوانده شده؛ برداشتن علامت' : 'علامت‌گذاری فصل به‌عنوان خوانده‌شده'}</button>
              {onOpenExercise && <button className="chapter-exercise" onClick={() => onOpenExercise(selectedChapter.id)}>رفتن به تمرین همین فصل ←</button>}
            </article>
          ) : (
            <>
              {activeSection !== null && (() => {
                const section = matchingSections.find((item) => item.sectionNumber === activeSection)
                return section ? <div className="selected-section-banner"><span className="section-banner-number">{new Intl.NumberFormat('fa-IR').format(section.sectionNumber)}</span><div><span className="course-kicker">بخش {new Intl.NumberFormat('fa-IR').format(section.sectionNumber)}</span><h2>{section.sectionTitle}</h2><p>{section.sectionIntro}</p></div></div> : null
              })()}
              <div className="chapter-grid">
                {matchingChapters.map((chapter) => (
                  <button className="chapter-card" key={chapter.id} onClick={() => setSelectedChapter(chapter)}>
                    <div className="chapter-card-top"><span className="chapter-number">فصل {new Intl.NumberFormat('fa-IR').format(chapter.chapterNumber)}</span><span className={`reader-level level-${chapter.level}`}>{chapter.level}</span></div>
                    <span className="chapter-section-label">{chapter.sectionTitle}</span>
                    <h3>{renderBidiText(chapter.title)}</h3>
                    <p>{renderBidiText(chapter.summary)}</p>
                    <div className="chapter-card-footer"><span>{new Intl.NumberFormat('fa-IR').format(chapter.topics.length)} سرفصل با توضیح</span><span className="chapter-open">شروع مطالعه <b>←</b></span></div>
                  </button>
                ))}
                {matchingChapters.length === 0 && <div className="course-empty"><span>⌕</span><h3>فصلی پیدا نشد</h3><p>عبارت دیگری جست‌وجو کنید یا بخش دیگری را انتخاب کنید.</p></div>}
              </div>
            </>
          )}
        </div>
      </div>
      {notice && <div className="course-toast" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="بستن پیام">×</button></div>}
    </section>
  )
}

export default CourseLibrary

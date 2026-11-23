import { useMemo, useState } from 'react'
import { courseChapters, learningStages } from './course'
import type { CourseDomain } from './course'
import './LearningPath.css'

type LearningPathProps = { initialDomain?: CourseDomain; onOpenChapter: (chapterId: string) => void }

const readCompleted = () => {
  try {
    const saved = localStorage.getItem('precisionpro-completed')
    const parsed: unknown = saved ? JSON.parse(saved) : []
    return Array.isArray(parsed) && parsed.every((id) => typeof id === 'string') ? parsed : []
  } catch (error) {
    console.error('خواندن پیشرفت مسیر یادگیری ناموفق بود.', error)
    return []
  }
}

const renderBidiText = (text: string) => text.split(/([A-Za-z][A-Za-z0-9]*(?:[ \t/&+.-]+[A-Za-z0-9][A-Za-z0-9]*)*)/g)
  .map((part, index) => /^[A-Za-z]/.test(part)
    ? <bdi className="english-term" dir="ltr" key={index}>{part}</bdi>
    : part)

function LearningPath({ initialDomain = 'ابزار دقیق', onOpenChapter }: LearningPathProps) {
  const [domain, setDomain] = useState<CourseDomain>(initialDomain)
  const completed = useMemo(() => readCompleted(), [])
  const domainChapters = courseChapters.filter((chapter) => chapter.domain === domain)
  const completedCount = domainChapters.filter((chapter) => completed.includes(chapter.id)).length
  const progress = domainChapters.length ? Math.round(completedCount / domainChapters.length * 100) : 0
  const stages = learningStages.filter((stage) => (stage.first <= 17 ? 'ابزار دقیق' : 'سیستم کنترل') === domain)

  return (
    <section className="learning-path page-enter">
      <header className="path-hero">
        <div>
          <span className="path-eyebrow">نقشهٔ راه آموزشی</span>
          <h1>مسیر یادگیری <em>{domain}</em></h1>
          <p>ترتیب پیشنهادی فصل‌ها را دنبال کنید؛ از مفاهیم پایه تا مهارت‌های تخصصی و پروژه.</p>
        </div>
        <div className="path-overview">
          <strong>{new Intl.NumberFormat('fa-IR').format(progress)}٪</strong>
          <span>{new Intl.NumberFormat('fa-IR').format(completedCount)} از {new Intl.NumberFormat('fa-IR').format(domainChapters.length)} فصل خوانده‌شده</span>
          <div className="path-progress-track"><i style={{ width: `${progress}%` }} /></div>
        </div>
      </header>

      <div className="path-domain-tabs" role="group" aria-label="انتخاب مسیر یادگیری">
        {(['ابزار دقیق', 'سیستم کنترل'] as CourseDomain[]).map((item) => {
          const count = courseChapters.filter((chapter) => chapter.domain === item).length
          return <button key={item} aria-pressed={domain === item} className={domain === item ? 'is-active' : ''} onClick={() => setDomain(item)}>
            <span>{item === 'ابزار دقیق' ? '◉' : '⌘'}</span><b>{item}</b><small>{new Intl.NumberFormat('fa-IR').format(count)} فصل</small>
          </button>
        })}
      </div>

      <div className="path-stage-list">
        {stages.map((stage) => {
          const chapters = courseChapters.filter((chapter) => chapter.chapterNumber >= stage.first && chapter.chapterNumber <= stage.last)
          const stageCompleted = chapters.filter((chapter) => completed.includes(chapter.id)).length
          const isComplete = chapters.length > 0 && stageCompleted === chapters.length
          const stageProgress = chapters.length ? Math.round(stageCompleted / chapters.length * 100) : 0
          const stageNumber = learningStages.indexOf(stage) + 1
          return (
            <article className={`path-stage ${isComplete ? 'is-complete' : ''}`} key={stage.title}>
              <div className="path-stage-marker">{isComplete ? '✓' : new Intl.NumberFormat('fa-IR').format(stageNumber)}</div>
              <div className="path-stage-card">
                <header className="path-stage-heading">
                  <div className="path-stage-title">
                    <span>مرحلهٔ {new Intl.NumberFormat('fa-IR').format(stageNumber)} · فصل‌های {new Intl.NumberFormat('fa-IR').format(stage.first)} تا {new Intl.NumberFormat('fa-IR').format(stage.last)}</span>
                    <h2>{renderBidiText(stage.title.replace(/^مرحلهٔ [^:]+:\s*/, ''))}</h2>
                    <p>{stage.goal}</p>
                  </div>
                  <div className="stage-progress"><strong>{new Intl.NumberFormat('fa-IR').format(stageProgress)}٪</strong><small>{new Intl.NumberFormat('fa-IR').format(stageCompleted)}/{new Intl.NumberFormat('fa-IR').format(chapters.length)} فصل</small></div>
                </header>
                <div className="path-stage-progress"><i style={{ width: `${stageProgress}%` }} /></div>
                <div className="path-chapter-list">
                  {chapters.map((chapter) => <button key={chapter.id} className={completed.includes(chapter.id) ? 'chapter-done' : ''} onClick={() => onOpenChapter(chapter.id)}>
                    <span className="path-chapter-number">{new Intl.NumberFormat('fa-IR').format(chapter.chapterNumber)}</span>
                    <span className="path-chapter-copy"><b>{renderBidiText(chapter.title)}</b><small>{chapter.sectionTitle}</small></span>
                    <span className="path-chapter-action">{completed.includes(chapter.id) ? '✓ خوانده‌شده' : 'مطالعهٔ فصل ←'}</span>
                  </button>)}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default LearningPath

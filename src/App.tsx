import { useMemo, useState } from 'react'
import CourseLibrary from './CourseLibrary'
import Exercises from './Exercises'
import EngineeringTools from './EngineeringTools'
import LearningPath from './LearningPath'
import { courseChapters } from './course'
import type { CourseDomain } from './course'
import { placementQuestions } from './quizData'
import './App.css'

type View = 'home' | 'course' | 'assessment' | 'result' | 'path' | 'exercise' | 'calculator'
const questions = placementQuestions

const formatNumber = (value: number, digits = 2) => new Intl.NumberFormat('fa-IR', { maximumFractionDigits: digits }).format(value)

function App() {
  const [view, setView] = useState<View>('home')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [domainScores, setDomainScores] = useState<Record<CourseDomain, number>>({ 'ابزار دقیق': 0, 'سیستم کنترل': 0 })
  const [pathDomain, setPathDomain] = useState<CourseDomain>('ابزار دقیق')
  const [activeCourseChapterId, setActiveCourseChapterId] = useState<string | null>(null)
  const [activeExerciseChapterId, setActiveExerciseChapterId] = useState<string | null>(null)

  const progress = useMemo(() => ((questionIndex + 1) / questions.length) * 100, [questionIndex])
  const activeQuestion = questions[questionIndex]
  const level = score <= 2 ? 'مقدماتی' : score <= 5 ? 'متوسط' : 'پیشرفته'

  const startAssessment = () => {
    setQuestionIndex(0)
    setSelected(null)
    setScore(0)
    setDomainScores({ 'ابزار دقیق': 0, 'سیستم کنترل': 0 })
    setView('assessment')
  }

  const nextQuestion = () => {
    if (selected === null) return
    const isCorrect = selected === activeQuestion.answerIndex
    const nextScore = score + (isCorrect ? 1 : 0)
    const nextDomainScores = {
      ...domainScores,
      [activeQuestion.domain]: domainScores[activeQuestion.domain] + (isCorrect ? 1 : 0),
    }
    setScore(nextScore)
    setDomainScores(nextDomainScores)
    if (questionIndex === questions.length - 1) {
      setPathDomain(nextDomainScores['سیستم کنترل'] > nextDomainScores['ابزار دقیق'] ? 'سیستم کنترل' : 'ابزار دقیق')
      setView('result')
    } else {
      setQuestionIndex((i) => i + 1)
      setSelected(null)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView('home')} aria-label="صفحه اصلی">
          <span className="brand-mark">P</span>
          <span>Precision<span>Pro</span></span>
        </button>
        <nav className="nav" aria-label="ناوبری اصلی">
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>خانه</button>
          <button className={view === 'course' ? 'active' : ''} onClick={() => { setActiveCourseChapterId(null); setView('course') }}>دانشنامه</button>
          <button className={view === 'path' ? 'active' : ''} onClick={() => setView('path')}>مسیر یادگیری</button>
          <button className={view === 'exercise' ? 'active' : ''} onClick={() => setView('exercise')}>تمرین‌ها</button>
          <button className={view === 'calculator' ? 'active' : ''} onClick={() => setView('calculator')}>محاسبات مهندسی</button>
        </nav>
        <div className="user-area">
          <button className="streak" aria-label="امتیاز هفتگی">🔥 <strong>۷</strong></button>
          <div className="avatar">م.ر</div>
        </div>
      </header>

      <main>
        {view === 'course' && <CourseLibrary
          key={activeCourseChapterId ?? 'all-chapters'}
          initialChapterId={activeCourseChapterId}
          onOpenExercise={(chapterId) => { setActiveExerciseChapterId(chapterId); setView('exercise') }}
        />}
        {view === 'home' && (
          <section className="home page-enter">
            <div className="hero">
              <div className="hero-copy">
                <span className="eyebrow">پلتفرم آموزش ابزار دقیق</span>
                <h1>تخصصی یاد بگیر.<br /><em>آماده عمل باش.</em></h1>
                <p>با آزمون تعیین سطح و مسیر یادگیری مرحله‌به‌مرحله، مهارت‌های اندازه‌گیری و کنترل فرایند را تقویت کن.</p>
                <div className="hero-actions">
                  <button className="primary" onClick={startAssessment}>شروع تعیین سطح <span>←</span></button>
                  <button className="secondary" onClick={() => setView('path')}>نمایش مسیر من</button>
                </div>
              </div>
              <div className="hero-visual" aria-label="تصویرسازی ابزار دقیق">
                <div className="grid-lines"></div>
                <div className="instrument-card">
                  <div className="instrument-top"><span>میکرومتر دیجیتال</span><span className="status-dot"></span></div>
                  <div className="display">۱۲٫۴۸</div>
                  <div className="caliper"><i></i><i></i><i></i></div>
                </div>
                <div className="float-badge badge-one">دقت ۰٫۰۱ mm</div>
                <div className="float-badge badge-two">کالیبره شده</div>
              </div>
            </div>

            <div className="continue-section">
              <div className="section-heading">
                <div><span className="eyebrow">ادامه یادگیری</span><h2>درس‌های پیشنهادی</h2></div>
                <button className="text-button" onClick={() => setView('path')}>مشاهده همه ←</button>
              </div>
              <div className="lesson-grid">
                {[courseChapters[0], courseChapters[4], courseChapters[17]].map((chapter) => (
                  <button className="lesson-card" key={chapter.id} onClick={() => { setActiveCourseChapterId(chapter.id); setView('course') }}>
                    <div className="lesson-icon">{formatNumber(chapter.chapterNumber, 0)}</div>
                    <div className="lesson-content">
                      <div className="lesson-meta"><span>{chapter.level}</span><span>فصل {formatNumber(chapter.chapterNumber, 0)}</span></div>
                      <h3>{chapter.title}</h3>
                      <p>{chapter.summary}</p>
                      <div className="lesson-footer"><span>ورود به درس‌نامه</span><b>←</b></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {view === 'assessment' && (
          <section className="assessment page-enter">
            <div className="assessment-head">
              <button className="back-button" onClick={() => setView('home')}>→</button>
              <div>
                <span>سوال {formatNumber(questionIndex + 1, 0)} از {formatNumber(questions.length, 0)} · {activeQuestion.domain}</span>
                <div className="progress-track wide"><div style={{ width: `${progress}%` }}></div></div>
              </div>
            </div>
            <div className="question-card">
              <span className="category">{activeQuestion.domain} · فصل {formatNumber(activeQuestion.chapterNumber, 0)} · {activeQuestion.chapterTitle}</span>
              <h1>{activeQuestion.prompt}</h1>
              <div className="options">
                {activeQuestion.options.map((option, index) => (
                  <button
                    key={option}
                    className={selected === index ? 'selected' : ''}
                    onClick={() => setSelected(index)}
                  >
                    <span className="option-letter">{['الف', 'ب', 'ج', 'د'][index]}</span>
                    <span>{option}</span>
                    <i></i>
                  </button>
                ))}
              </div>
              {selected !== null && <div className="assessment-feedback" role="status">
                <strong>{selected === activeQuestion.answerIndex ? 'پاسخ درست است.' : `پاسخ درست: ${activeQuestion.options[activeQuestion.answerIndex]}`}</strong>
                <p>{activeQuestion.explanation}</p>
              </div>}
              <button className="primary next-button" disabled={selected === null} onClick={nextQuestion}>
                {questionIndex === questions.length - 1 ? 'مشاهده نتیجه' : 'سوال بعدی'} <span>←</span>
              </button>
            </div>
          </section>
        )}

        {view === 'result' && (
          <section className="result page-enter">
            <div className="result-card">
              <div className="confetti">✦</div>
              <span className="eyebrow">نتیجه تعیین سطح</span>
              <div className="score-ring" style={{ '--score': `${score / questions.length * 360}deg` } as React.CSSProperties}>
                <div><strong>{score}</strong><span>از {questions.length}</span></div>
              </div>
              <h1>سطح {level}</h1>
              <p>ابزار دقیق: {formatNumber(domainScores['ابزار دقیق'], 0)} از ۴ · سیستم کنترل: {formatNumber(domainScores['سیستم کنترل'], 0)} از ۴. پیشنهاد شروع: مسیر {pathDomain}. این آزمون کوتاه راهنمای مطالعه است، نه ارزیابی صلاحیت حرفه‌ای.</p>
              <button className="primary" onClick={() => setView('path')}>شروع مسیر {pathDomain} <span>←</span></button>
              <button className="text-button" onClick={startAssessment}>تکرار آزمون</button>
            </div>
          </section>
        )}

        {view === 'path' && <LearningPath initialDomain={pathDomain} onOpenChapter={(chapterId) => { setActiveCourseChapterId(chapterId); setView('course') }} />}

        {view === 'calculator' && <EngineeringTools />}

        {view === 'exercise' && <Exercises
          key={activeExerciseChapterId ?? 'default-exercise'}
          initialChapterId={activeExerciseChapterId}
          onOpenChapter={(chapterId) => { setActiveCourseChapterId(chapterId); setView('course') }}
        />}
      </main>
    </div>
  )
}

export default App

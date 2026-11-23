import { useMemo, useState } from 'react'
import { courseChapters } from './course'
import type { CourseDomain } from './course'
import { courseQuestions } from './quizData'
import './Exercises.css'

type ExercisesProps = { initialChapterId?: string | null; onOpenChapter: (chapterId: string) => void }

const formatNumber = (value: number) => new Intl.NumberFormat('fa-IR').format(value)

function Exercises({ initialChapterId = null, onOpenChapter }: ExercisesProps) {
  const [domain, setDomain] = useState<CourseDomain>(() =>
    courseQuestions.find((question) => question.chapterId === initialChapterId)?.domain ?? 'ابزار دقیق',
  )
  const questionsForDomain = useMemo(
    () => courseQuestions.filter((question) => question.domain === domain),
    [domain],
  )
  const [chapterId, setChapterId] = useState(initialChapterId ?? courseQuestions[0]?.chapterId ?? '')
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)

  const selectedQuestion = questionsForDomain.find((question) => question.chapterId === chapterId)
  const selectedChapter = courseChapters.find((chapter) => chapter.id === chapterId)

  const changeDomain = (nextDomain: CourseDomain) => {
    const firstQuestion = courseQuestions.find((question) => question.domain === nextDomain)
    if (!firstQuestion) {
      console.error(`هیچ تمرینی برای حوزهٔ ${nextDomain} تعریف نشده است.`)
      return
    }
    setDomain(nextDomain)
    setChapterId(firstQuestion.chapterId)
    setSelectedOption(null)
    setChecked(false)
  }

  const changeChapter = (nextChapterId: string) => {
    setChapterId(nextChapterId)
    setSelectedOption(null)
    setChecked(false)
  }

  if (!selectedQuestion || !selectedChapter) {
    return <section className="exercise-hub page-enter" role="alert">
      <h1>تمرین این فصل در دسترس نیست</h1>
      <p>ارتباط تمرین و فصل دانشنامه را بررسی کنید و دوباره تلاش کنید.</p>
    </section>
  }

  const isCorrect = selectedOption === selectedQuestion.answerIndex
  const chaptersWithPractice = courseChapters.filter((chapter) =>
    chapter.domain === domain && courseQuestions.some((question) => question.chapterId === chapter.id),
  )

  return <section className="exercise-hub page-enter">
    <header className="exercise-hero">
      <div>
        <span className="exercise-eyebrow">تمرین فصل‌محور · بازخورد آموزشی</span>
        <h1>تمرین‌های <em>{domain}</em></h1>
        <p>هر سؤال به یک فصل مشخص از دانشنامه متصل است؛ پاسخ و توضیح را ببینید و برای مرور به درس‌نامه بروید.</p>
      </div>
      <div className="exercise-count"><strong>{formatNumber(chaptersWithPractice.length)}</strong><span>فصل دارای تمرین</span></div>
    </header>

    <div className="exercise-domain-tabs" role="group" aria-label="انتخاب حوزهٔ تمرین">
      {(['ابزار دقیق', 'سیستم کنترل'] as CourseDomain[]).map((item) => {
        const count = courseQuestions.filter((question) => question.domain === item).length
        return <button key={item} aria-pressed={domain === item} className={domain === item ? 'is-active' : ''} onClick={() => changeDomain(item)}>
          <span>{item === 'ابزار دقیق' ? '◉' : '⌘'}</span><b>{item}</b><small>{formatNumber(count)} تمرین</small>
        </button>
      })}
    </div>

    <article className="exercise-question-card">
      <div className="exercise-card-top">
        <div><span className="exercise-section-label">{selectedChapter.sectionTitle}</span><h2>فصل {formatNumber(selectedChapter.chapterNumber)} · {selectedChapter.title}</h2></div>
        <span className="exercise-level">{selectedChapter.level}</span>
      </div>

      <label className="exercise-chapter-picker">انتخاب فصل
        <select value={chapterId} onChange={(event) => changeChapter(event.currentTarget.value)}>
          {chaptersWithPractice.map((chapter) => <option key={chapter.id} value={chapter.id}>فصل {formatNumber(chapter.chapterNumber)} · {chapter.title}</option>)}
        </select>
      </label>

      <div className="exercise-prompt">
        <span>تمرین فصل {formatNumber(selectedQuestion.chapterNumber)}</span>
        <h3>{selectedQuestion.prompt}</h3>
      </div>

      <div className="exercise-answer-options" role="group" aria-label="گزینه‌های پاسخ">
        {selectedQuestion.options.map((option, index) => {
          const optionIsCorrect = index === selectedQuestion.answerIndex
          const stateClass = checked && optionIsCorrect ? 'is-correct' : checked && selectedOption === index ? 'is-incorrect' : ''
          return <button key={option} className={`${selectedOption === index ? 'is-selected' : ''} ${stateClass}`} aria-pressed={selectedOption === index} disabled={checked} onClick={() => setSelectedOption(index)}>
            <span className="exercise-option-letter">{['الف', 'ب', 'ج', 'د'][index]}</span><span>{option}</span>
            {checked && optionIsCorrect && <b aria-label="پاسخ درست">✓</b>}
          </button>
        })}
      </div>

      {checked && <div className={`exercise-feedback ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`} role="status">
        <strong>{isCorrect ? 'پاسخ درست است' : 'این پاسخ درست نیست؛ توضیح را مرور کنید'}</strong>
        <p>{selectedQuestion.explanation}</p>
      </div>}

      <div className="exercise-actions">
        {!checked
          ? <button className="exercise-check-button" disabled={selectedOption === null} onClick={() => setChecked(true)}>بررسی پاسخ</button>
          : <button className="exercise-check-button secondary-action" onClick={() => { setSelectedOption(null); setChecked(false) }}>تلاش دوباره</button>}
        <button className="exercise-review-button" onClick={() => onOpenChapter(selectedChapter.id)}>مطالعهٔ درس‌نامهٔ فصل ←</button>
      </div>
    </article>
    <p className="exercise-bank-note">بانک تمرین با فصل‌های دانشنامه تطبیق داده شده است و می‌تواند همراه با افزودن درس‌های جدید گسترش یابد.</p>
  </section>
}

export default Exercises

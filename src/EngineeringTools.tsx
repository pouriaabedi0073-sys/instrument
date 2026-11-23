import { useMemo, useState } from 'react'
import './EngineeringTools.css'

type Tool = 'signal' | 'flow' | 'pressure' | 'temperature' | 'ohm' | 'tank'
type TankType = 'vertical' | 'horizontal' | 'rectangular'

const formatNumber = (value: number, digits = 2) =>
  Number.isFinite(value)
    ? new Intl.NumberFormat('fa-IR', { maximumFractionDigits: digits }).format(value)
    : '—'

const horizontalSegmentArea = (radius: number, liquidHeight: number) => {
  const height = Math.min(Math.max(liquidHeight, 0), radius * 2)
  const offset = radius - height
  return radius ** 2 * Math.acos(offset / radius) - offset * Math.sqrt(Math.max(0, 2 * radius * height - height ** 2))
}

function NumberField({ label, unit, value, onChange, step = 'any', min }: {
  label: string
  unit?: string
  value: number
  onChange: (value: number) => void
  step?: string
  min?: number
}) {
  return <label className="engineering-field">{label}{unit && <span>{unit}</span>}<input type="number" step={step} min={min} value={Number.isFinite(value) ? value : ''} onChange={(event) => onChange(event.currentTarget.value === '' ? Number.NaN : Number(event.currentTarget.value))} /></label>
}

function Formula({ title = 'رابطهٔ محاسباتی', children, note }: { title?: string; children: string; note?: string }) {
  return <div className="engineering-formula"><span>{title}</span><code dir="ltr">{children}</code>{note && <small>{note}</small>}</div>
}

function EngineeringTools() {
  const [tool, setTool] = useState<Tool>('signal')
  const [signalMode, setSignalMode] = useState<'current' | 'value'>('current')
  const [signal, setSignal] = useState({ current: 12, value: 50, lrv: 0, urv: 100 })
  const [flow, setFlow] = useState({ dpPercent: 25, maxFlow: 100 })
  const [pressure, setPressure] = useState({ value: 1, from: 'bar', to: 'kPa' })
  const [temperature, setTemperature] = useState({ value: 25, from: 'C', to: 'F' })
  const [electrical, setElectrical] = useState({ current: 20, resistance: 250 })
  const [tankType, setTankType] = useState<TankType>('vertical')
  const [tank, setTank] = useState({ diameter: 2, length: 4, width: 3, height: 4, level: 2 })

  const signalRangeValid = Number.isFinite(signal.lrv) && Number.isFinite(signal.urv) && signal.urv !== signal.lrv
  const signalValue = signalRangeValid
    ? signalMode === 'current' ? signal.lrv + (signal.current - 4) / 16 * (signal.urv - signal.lrv) : 4 + (signal.value - signal.lrv) / (signal.urv - signal.lrv) * 16
    : Number.NaN
  const calibrationPoints = [0, 25, 50, 75, 100].map((percent) => ({
    percent,
    current: 4 + percent / 100 * 16,
    value: signalRangeValid ? signal.lrv + (signal.urv - signal.lrv) * percent / 100 : Number.NaN,
  }))

  const flowResult = useMemo(() => {
    const valid = Number.isFinite(flow.dpPercent) && Number.isFinite(flow.maxFlow) && flow.maxFlow >= 0 && flow.dpPercent >= 0
    const percent = valid ? Math.sqrt(flow.dpPercent / 100) * 100 : Number.NaN
    return { valid, percent, value: percent / 100 * flow.maxFlow }
  }, [flow])

  const pressureUnits = [
    { key: 'Pa', label: 'پاسکال', factor: 0.001 },
    { key: 'kPa', label: 'کیلوپاسکال', factor: 1 },
    { key: 'bar', label: 'بار', factor: 100 },
    { key: 'MPa', label: 'مگاپاسکال', factor: 1000 },
    { key: 'psi', label: 'پوند بر اینچ مربع', factor: 6.894757293 },
  ]
  const pressureResult = Number.isFinite(pressure.value)
    ? pressure.value * (pressureUnits.find((unit) => unit.key === pressure.from)?.factor ?? 1) / (pressureUnits.find((unit) => unit.key === pressure.to)?.factor ?? 1)
    : Number.NaN
  const toCelsius = (value: number, unit: string) => unit === 'F' ? (value - 32) * 5 / 9 : unit === 'K' ? value - 273.15 : value
  const fromCelsius = (value: number, unit: string) => unit === 'F' ? value * 9 / 5 + 32 : unit === 'K' ? value + 273.15 : value
  const temperatureCelsius = Number.isFinite(temperature.value) ? toCelsius(temperature.value, temperature.from) : Number.NaN
  const temperatureValid = Number.isFinite(temperatureCelsius) && temperatureCelsius >= -273.15
  const temperatureResult = temperatureValid
    ? fromCelsius(temperatureCelsius, temperature.to)
    : Number.NaN
  const electricalValid = Number.isFinite(electrical.current) && electrical.current >= 0 && Number.isFinite(electrical.resistance) && electrical.resistance >= 0
  const voltage = electricalValid ? electrical.current / 1000 * electrical.resistance : Number.NaN
  const power = voltage * electrical.current / 1000

  const tankResult = useMemo(() => {
    const dimensions = Object.values(tank)
    if (!dimensions.every(Number.isFinite) || tank.diameter <= 0 || tank.length <= 0 || tank.width <= 0 || tank.height <= 0) {
      return { capacity: Number.NaN, liquidVolume: Number.NaN, fillPercent: Number.NaN, level: 0, valid: false }
    }
    const radius = tank.diameter / 2
    const maxLevel = tankType === 'horizontal' ? tank.diameter : tankType === 'vertical' ? tank.height : tank.height
    const level = Math.min(Math.max(tank.level, 0), maxLevel)
    let capacity: number
    let liquidVolume: number
    if (tankType === 'horizontal') {
      capacity = Math.PI * radius ** 2 * tank.length
      liquidVolume = horizontalSegmentArea(radius, level) * tank.length
    } else if (tankType === 'rectangular') {
      capacity = tank.length * tank.width * tank.height
      liquidVolume = tank.length * tank.width * level
    } else {
      capacity = Math.PI * radius ** 2 * tank.height
      liquidVolume = Math.PI * radius ** 2 * level
    }
    return { capacity, liquidVolume, fillPercent: capacity > 0 ? liquidVolume / capacity * 100 : 0, level, valid: true }
  }, [tank, tankType])

  const tabs: { id: Tool; title: string; icon: string }[] = [
    { id: 'signal', title: 'سیگنال ۴–۲۰ میلی‌آمپر', icon: '↔' },
    { id: 'flow', title: 'محاسبهٔ جریان', icon: '∿' },
    { id: 'pressure', title: 'تبدیل فشار', icon: '◉' },
    { id: 'temperature', title: 'تبدیل دما', icon: '♨' },
    { id: 'ohm', title: 'قانون اهم', icon: 'ϟ' },
    { id: 'tank', title: 'حجم مخزن', icon: '▤' },
  ]

  return <section className="engineering-tools page-enter" aria-label="جعبه‌ابزار محاسبات مهندسی">
    <header className="engineering-hero">
      <div><span className="engineering-eyebrow">جعبه‌ابزار فنی · آفلاین</span><h1>محاسبات مهندسی <em>ابزار دقیق</em></h1><p>محاسبه‌های پرکاربرد را با واحد، رابطه و فرض‌های روشن انجام دهید.</p></div>
      <div className="engineering-hero-mark" aria-hidden="true">ƒx</div>
    </header>

    <nav className="engineering-tool-tabs" aria-label="انتخاب ابزار محاسباتی">
      {tabs.map((item) => <button key={item.id} className={tool === item.id ? 'selected' : ''} aria-pressed={tool === item.id} onClick={() => setTool(item.id)}><span>{item.icon}</span><b>{item.title}</b></button>)}
    </nav>

    <div className="engineering-workspace">
      {tool === 'signal' && <article className="engineering-panel">
        <div className="engineering-panel-heading"><span className="engineering-icon">↔</span><div><h2>مقیاس‌کردن سیگنال خطی ۴–۲۰ میلی‌آمپر</h2><p>تبدیل جریان حلقه به مقدار فرایندی یا محاسبهٔ جریان متناظر با مقدار ورودی</p></div></div>
        <div className="engineering-mode-tabs"><button className={signalMode === 'current' ? 'selected' : ''} onClick={() => setSignalMode('current')}>جریان به مقدار فرایندی</button><button className={signalMode === 'value' ? 'selected' : ''} onClick={() => setSignalMode('value')}>مقدار فرایندی به جریان</button></div>
        <div className="engineering-fields">
          <NumberField label="مقدار پایین بازه · LRV" unit="واحد فرایند" value={signal.lrv} onChange={(lrv) => setSignal((current) => ({ ...current, lrv }))} />
          <NumberField label="مقدار بالای بازه · URV" unit="واحد فرایند" value={signal.urv} onChange={(urv) => setSignal((current) => ({ ...current, urv }))} />
          {signalMode === 'current'
            ? <NumberField label="جریان اندازه‌گیری‌شده" unit="mA" value={signal.current} onChange={(current) => setSignal((state) => ({ ...state, current }))} />
            : <NumberField label="مقدار فرایندی" unit="واحد فرایند" value={signal.value} onChange={(value) => setSignal((state) => ({ ...state, value }))} />}
        </div>
        <Formula>{signalMode === 'current' ? 'PV = LRV + ((I − 4 mA) / 16 mA) × (URV − LRV)' : 'I = 4 mA + ((PV − LRV) / (URV − LRV)) × 16 mA'}</Formula>
        {signalRangeValid ? <div className="engineering-result"><span>{signalMode === 'current' ? 'مقدار فرایندی محاسبه‌شده' : 'جریان متناظر'}</span><strong>{formatNumber(signalValue)} <small>{signalMode === 'current' ? 'واحد فرایند' : 'mA'}</small></strong></div> : <p className="engineering-warning">برای محاسبه، LRV و URV باید عددی و متفاوت باشند.</p>}
        {signalRangeValid && <div className="calibration-table-wrap"><h3>نقاط مرجع مقیاس</h3><table className="calibration-table"><thead><tr><th>درصد بازه</th><th>جریان حلقه</th><th>مقدار فرایندی</th></tr></thead><tbody>{calibrationPoints.map((point) => <tr key={point.percent}><td>{formatNumber(point.percent, 0)}٪</td><td dir="ltr">{formatNumber(point.current, 1)} mA</td><td>{formatNumber(point.value)}</td></tr>)}</tbody></table></div>}
        <p className="engineering-caveat">این رابطه برای تبدیل خطی و بازهٔ تنظیم‌شدهٔ فرستنده است؛ وضعیت خطا، قطع حلقه و محدودیت‌های تجهیز را جداگانه بررسی کنید.</p>
      </article>}

      {tool === 'flow' && <article className="engineering-panel">
        <div className="engineering-panel-heading"><span className="engineering-icon">∿</span><div><h2>استخراج جذر در اندازه‌گیری جریان</h2><p>محاسبهٔ جریان از درصد بازهٔ اختلاف فشار در یک عنصر اولیهٔ مناسب</p></div></div>
        <div className="engineering-fields two-fields"><NumberField label="اختلاف فشار نسبت به بازهٔ DP" unit="% از بازه" value={flow.dpPercent} onChange={(dpPercent) => setFlow((current) => ({ ...current, dpPercent }))} /><NumberField label="حد بالای بازهٔ جریان" unit="واحد جریان" min={0} value={flow.maxFlow} onChange={(maxFlow) => setFlow((current) => ({ ...current, maxFlow }))} /></div>
        <Formula note="این شکل ساده‌شده فرض می‌کند مقدار DP بر حسب درصدِ بازهٔ اختلاف فشار وارد شده است.">{'Q% = √(ΔP%) × 100     |     Q = (Q% / 100) × Qmax'}</Formula>
        {flowResult.valid ? <><div className="engineering-result"><span>جریان متناظر با اختلاف فشار</span><strong>{formatNumber(flowResult.value)} <small>واحد جریان</small></strong><div className="result-subline">{formatNumber(flowResult.percent, 1)}٪ از بازهٔ جریان</div></div>{flow.dpPercent > 100 && <p className="engineering-warning">اختلاف فشار از ۱۰۰٪ بازه فراتر رفته است؛ نتیجه برون‌یابی‌شده و خارج از محدودهٔ تنظیمی است.</p>}</> : <p className="engineering-warning">اختلاف فشار باید نامنفی و حد بالای جریان یک عدد نامنفی باشد.</p>}
        <p className="engineering-caveat">استخراج جذر باید فقط یک‌بار در مسیر اندازه‌گیری انجام شود. چگالی، شرایط سیال، نصب و مشخصات عنصر اولیه بر رابطهٔ واقعی اثر می‌گذارند.</p>
      </article>}

      {tool === 'pressure' && <article className="engineering-panel">
        <div className="engineering-panel-heading"><span className="engineering-icon">◉</span><div><h2>تبدیل واحد فشار</h2><p>تبدیل فشار بین پاسکال، کیلوپاسکال، بار، مگاپاسکال و psi</p></div></div>
        <div className="engineering-fields conversion-fields"><NumberField label="مقدار فشار" value={pressure.value} onChange={(value) => setPressure((current) => ({ ...current, value }))} /><label className="engineering-field">از واحد<select value={pressure.from} onChange={(event) => setPressure((current) => ({ ...current, from: event.target.value }))}>{pressureUnits.map((unit) => <option key={unit.key} value={unit.key}>{unit.label} ({unit.key})</option>)}</select></label><span className="conversion-arrow" aria-hidden="true">←</span><label className="engineering-field">به واحد<select value={pressure.to} onChange={(event) => setPressure((current) => ({ ...current, to: event.target.value }))}>{pressureUnits.map((unit) => <option key={unit.key} value={unit.key}>{unit.label} ({unit.key})</option>)}</select></label></div>
        <Formula>{'P₂ = P₁ × factor(واحد مبدأ) / factor(واحد مقصد)'}</Formula>
        <div className="engineering-result"><span>فشار تبدیل‌شده</span><strong>{formatNumber(pressureResult, 4)} <small dir="ltr">{pressure.to}</small></strong></div>
        <p className="engineering-caveat">تبدیل واحد، تفاوت فشار مطلق و گیج را تغییر نمی‌دهد؛ نوع مرجع فشار را در گزارش و محاسبه حفظ کنید.</p>
      </article>}

      {tool === 'temperature' && <article className="engineering-panel">
        <div className="engineering-panel-heading"><span className="engineering-icon">♨</span><div><h2>تبدیل واحد دما</h2><p>تبدیل دما بین درجهٔ سلسیوس، فارنهایت و کلوین</p></div></div>
        <div className="engineering-fields conversion-fields"><NumberField label="مقدار دما" value={temperature.value} onChange={(value) => setTemperature((current) => ({ ...current, value }))} /><label className="engineering-field">از واحد<select value={temperature.from} onChange={(event) => setTemperature((current) => ({ ...current, from: event.target.value }))}><option value="C">سلسیوس (°C)</option><option value="F">فارنهایت (°F)</option><option value="K">کلوین (K)</option></select></label><span className="conversion-arrow" aria-hidden="true">←</span><label className="engineering-field">به واحد<select value={temperature.to} onChange={(event) => setTemperature((current) => ({ ...current, to: event.target.value }))}><option value="C">سلسیوس (°C)</option><option value="F">فارنهایت (°F)</option><option value="K">کلوین (K)</option></select></label></div>
        <Formula note="ابتدا به سلسیوس تبدیل و سپس به واحد مقصد محاسبه می‌شود.">{'°F = (°C × 9/5) + 32     |     K = °C + 273.15'}</Formula>
        {temperatureValid ? <div className="engineering-result"><span>دمای تبدیل‌شده</span><strong>{formatNumber(temperatureResult, 3)} <small dir="ltr">{temperature.to}</small></strong></div> : <p className="engineering-warning">دمای واردشده باید عددی و بالاتر از صفر مطلق باشد.</p>}
        <p className="engineering-caveat">در محاسبات اختلاف دما و محاسبات ترمودینامیکی، انتخاب مقیاس و مرجع را با رابطهٔ مورد استفاده تطبیق دهید.</p>
      </article>}

      {tool === 'ohm' && <article className="engineering-panel">
        <div className="engineering-panel-heading"><span className="engineering-icon">ϟ</span><div><h2>قانون اهم و توان حلقه</h2><p>برآورد افت ولتاژ و توان یک مقاومت از جریان عبوری</p></div></div>
        <div className="engineering-fields two-fields"><NumberField label="جریان حلقه" unit="mA" value={electrical.current} onChange={(current) => setElectrical((state) => ({ ...state, current }))} /><NumberField label="مقاومت" unit="Ω" min={0} value={electrical.resistance} onChange={(resistance) => setElectrical((state) => ({ ...state, resistance }))} /></div>
        <Formula>{'V = I × R     |     P = V × I     (I بر حسب آمپر)'}</Formula>
        {electricalValid ? <div className="engineering-result-grid"><div className="engineering-result"><span>افت ولتاژ</span><strong>{formatNumber(voltage)} <small>V</small></strong></div><div className="engineering-result"><span>توان تلف‌شده</span><strong>{formatNumber(power)} <small>W</small></strong></div></div> : <p className="engineering-warning">جریان و مقاومت باید عددی و نامنفی باشند.</p>}
        <p className="engineering-caveat">افت ولتاژ مجموع تجهیزات، کابل و مقاومت‌ها باید از ولتاژ قابل‌دسترس منبع کمتر باشد. این محاسبه جایگزین بررسی الزامات ایمنی ذاتی و دیتاشیت نیست.</p>
      </article>}

      {tool === 'tank' && <article className="engineering-panel tank-tool-panel">
        <div className="engineering-panel-heading"><span className="engineering-icon">▤</span><div><h2>حجم مخزن و برآورد سطح مایع</h2><p>برآورد هندسی برای مخازن استوانه‌ای عمودی، افقی و مکعبی</p></div></div>
        <div className="tank-tool-tabs" role="group" aria-label="شکل مخزن">
          <button className={tankType === 'vertical' ? 'selected' : ''} onClick={() => setTankType('vertical')}>استوانهٔ عمودی</button><button className={tankType === 'horizontal' ? 'selected' : ''} onClick={() => setTankType('horizontal')}>استوانهٔ افقی</button><button className={tankType === 'rectangular' ? 'selected' : ''} onClick={() => setTankType('rectangular')}>مکعبی</button>
        </div>
        <div className="engineering-fields tank-fields">
          {tankType !== 'rectangular' && <NumberField label="قطر داخلی" unit="m" min={0.01} value={tank.diameter} onChange={(diameter) => setTank((current) => ({ ...current, diameter }))} />}
          <NumberField label={tankType === 'vertical' ? 'ارتفاع مخزن' : 'طول مخزن'} unit="m" min={0.01} value={tank.length} onChange={(length) => setTank((current) => ({ ...current, length, height: tankType === 'vertical' ? length : current.height }))} />
          {tankType === 'rectangular' && <><NumberField label="عرض مخزن" unit="m" min={0.01} value={tank.width} onChange={(width) => setTank((current) => ({ ...current, width }))} /><NumberField label="ارتفاع مخزن" unit="m" min={0.01} value={tank.height} onChange={(height) => setTank((current) => ({ ...current, height }))} /></>}
          <NumberField label="ارتفاع مایع" unit="m" value={tank.level} onChange={(level) => setTank((current) => ({ ...current, level }))} />
        </div>
        <Formula>{tankType === 'rectangular' ? 'V = طول × عرض × ارتفاع' : tankType === 'vertical' ? 'V = π × (قطر / 2)² × ارتفاع مایع' : 'V = طول × مساحت قطاع دایره در ارتفاع مایع'}</Formula>
        {tankResult.valid ? <><div className="tank-fill-track"><i style={{ width: `${Math.min(tankResult.fillPercent, 100)}%` }} /></div><div className="engineering-result-grid"><div className="engineering-result"><span>حجم مایع · {formatNumber(tankResult.fillPercent, 1)}٪</span><strong>{formatNumber(tankResult.liquidVolume)} <small>m³</small></strong><div className="result-subline">{formatNumber(tankResult.liquidVolume * 1000, 0)} لیتر</div></div><div className="engineering-result"><span>ظرفیت مخزن</span><strong>{formatNumber(tankResult.capacity)} <small>m³</small></strong><div className="result-subline">{formatNumber(tankResult.capacity * 1000, 0)} لیتر</div></div></div>{tank.level !== tankResult.level && <p className="engineering-warning">ارتفاع مایع برای محاسبه به محدودهٔ ارتفاع مخزن محدود شده است.</p>}</> : <p className="engineering-warning">ابعاد مخزن باید عددی و مثبت باشند.</p>}
        <p className="engineering-caveat">برآورد برای هندسهٔ ایده‌آل است؛ عدسی، شیب، تجهیزات داخلی و جدول کالیبراسیون مخزن در این محاسبه لحاظ نشده‌اند.</p>
      </article>}
    </div>
    <footer className="engineering-safety">ابزارهای آموزشی هستند؛ پیش از استفاده در طراحی، بهره‌برداری یا ایمنی فرایند، روابط و داده‌های ورودی را با مرجع معتبر و مشخصات پروژه تطبیق دهید.</footer>
  </section>
}

export default EngineeringTools

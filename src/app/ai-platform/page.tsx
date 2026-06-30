'use client';

import { useState, useRef, useEffect, CSSProperties } from 'react';

// ═══════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════
const OR  = '#FF5E00';
const BG  = '#0B0805';
const SF  = '#141009';
const SF2 = '#1C1410';
const BD  = '#2D2018';
const TX  = '#EDE8DF';
const MU  = '#9A8878';
const DIM = '#52433A';
const ORD = 'rgba(255,94,0,0.1)';
const ORB = 'rgba(255,94,0,0.35)';

const COST: Record<string, number> = { fast: 1, balanced: 3, quality: 4 };
const RC   = ['#EDE5D8', '#D5DCEA', '#D9E8D5', '#E8D9DC'];
const POSES = ['Фронт', '3/4 вид', 'Сбоку', 'Сзади'];
const PHASES: [number, string][] = [
  [0,  'Анализ изображения...'],
  [22, 'Подбор AI-модели...'],
  [50, 'Примеряем одежду...'],
  [82, 'Финальная обработка...'],
];

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
type Page = 'landing' | 'auth' | 'studio' | 'gallery' | 'billing';
type GenStatus = 'idle' | 'gen' | 'done';

interface User        { email: string; name: string; credits: number; plan: string; }
interface GalleryItem { id: string; color: string; date: string; market: string; type: string; credits: number; }
interface Settings    { g: string; mk: string; mod: string; bg: string; q: string; }
interface Toast       { msg: string; type?: 'ok' | 'err' | ''; }

// ═══════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════

function Logo({ h = 20 }: { h?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, userSelect: 'none', lineHeight: 1 }}>
      <span style={{ fontSize: h, fontWeight: 900, color: OR, letterSpacing: '-0.025em' }}>Mode</span>
      <span style={{ fontSize: h * 0.76, fontWeight: 300, color: OR, letterSpacing: '.015em' }}>(labs)</span>
    </div>
  );
}

interface BtnProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  onClick?: () => void;
  style?: CSSProperties;
  disabled?: boolean;
  sm?: boolean;
}
function Btn({ children, variant = 'primary', onClick, style: sx = {}, disabled = false, sm = false }: BtnProps) {
  const vs: Record<string, CSSProperties> = {
    primary: { background: OR, color: '#fff', border: 'none' },
    ghost:   { background: 'transparent', color: TX, border: `1px solid ${BD}` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderRadius: 8, fontWeight: 700, fontSize: sm ? 12 : 14,
        padding: sm ? '7px 13px' : '11px 20px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap', lineHeight: 1,
        transition: 'all .15s', ...vs[variant], ...sx,
      }}
    >
      {children}
    </button>
  );
}

function FInp({ type = 'text', placeholder, value, onChange }: {
  type?: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '10px 13px', fontSize: 14, outline: 'none',
        border: `1px solid ${focused ? ORB : BD}`, background: SF2, color: TX,
        borderRadius: 8, boxSizing: 'border-box', transition: 'border .15s',
      }}
    />
  );
}

function SG({ label, opts, val, set }: {
  label: string; opts: [string, string][]; val: string; set: (v: string) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: DIM, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {opts.map(([v, l]) => (
          <button key={v} onClick={() => set(v)} style={{
            padding: '5px 9px', border: `1px solid ${val === v ? ORB : BD}`,
            borderRadius: 6, background: val === v ? ORD : 'transparent',
            color: val === v ? OR : MU, fontSize: 11, cursor: 'pointer',
            fontWeight: val === v ? 700 : 400, transition: 'all .15s',
          }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function Sil({ sz = 30, op = 0.22 }: { sz?: number; op?: number }) {
  return (
    <svg width={sz} viewBox="0 0 60 120" fill="none" style={{ opacity: op }}>
      <circle cx="30" cy="14" r="11" fill="#604030" />
      <path d="M14 32 Q30 24 46 32 L49 86 Q30 96 11 86Z" fill="#604030" />
      <rect x="15" y="84" width="11" height="28" rx="5" fill="#604030" />
      <rect x="34" y="84" width="11" height="28" rx="5" fill="#604030" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════
// DROPZONE
// ═══════════════════════════════════════════════════════
function Dropzone({ onFile, preview, dragging, onDrag }: {
  onFile: (f: File) => void; preview: string | null; dragging: boolean; onDrag: (v: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); onDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) onFile(f);
  };
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); onDrag(true); }}
      onDragLeave={() => onDrag(false)}
      onDrop={handleDrop}
      style={{
        border: `1.5px dashed ${dragging ? OR : BD}`, borderRadius: 10,
        padding: preview ? '10px' : '20px 14px', textAlign: 'center',
        cursor: 'pointer', marginBottom: 14,
        background: dragging ? ORD : 'transparent', transition: 'all .2s',
      }}
    >
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
      {preview ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="preview"
            style={{ maxHeight: 66, maxWidth: '100%', borderRadius: 6, objectFit: 'contain', display: 'block', margin: '0 auto 5px' }} />
          <div style={{ fontSize: 11, color: MU }}>Нажмите чтобы заменить</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 20, color: DIM, marginBottom: 7 }}>↑</div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>Загрузить фото товара</div>
          <div style={{ fontSize: 11, color: DIM }}>JPG · PNG · WEBP · до 10 МБ</div>
          <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>или перетащите файл</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════
function Header({ user, page, onNav, onLogout }: {
  user: User | null; page: Page; onNav: (p: Page) => void; onLogout: () => void;
}) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 52, borderBottom: `1px solid ${BD}`, background: BG,
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <button onClick={() => onNav('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <Logo h={19} />
      </button>

      {user && (
        <nav style={{ display: 'flex', gap: 2 }}>
          {(['studio', 'gallery', 'billing'] as Page[]).map(p => {
            const labels: Record<string, string> = { studio: 'Студия', gallery: 'Галерея', billing: 'Тарифы' };
            return (
              <button key={p} onClick={() => onNav(p)} style={{
                border: 'none', fontSize: 12, cursor: 'pointer', padding: '5px 12px', borderRadius: 6,
                color: page === p ? TX : MU, fontWeight: page === p ? 700 : 400,
                background: page === p ? SF : 'transparent', transition: 'all .15s',
              }}>{labels[p]}</button>
            );
          })}
        </nav>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user ? (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
              background: SF, border: `1px solid ${BD}`, borderRadius: 7, fontSize: 12,
            }}>
              <span style={{ color: OR, fontWeight: 700 }}>{user.credits}</span>
              <span style={{ color: MU }}>кр</span>
            </div>
            <span style={{ fontSize: 11, color: MU, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </span>
            <Btn variant="ghost" sm onClick={onLogout}>Выйти</Btn>
          </>
        ) : (
          <>
            <Btn variant="ghost" sm onClick={() => onNav('auth')}>Войти</Btn>
            <Btn sm onClick={() => onNav('auth')}>Начать</Btn>
          </>
        )}
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════
function Landing({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const features = [
    { ic: '📦', t: 'Пресеты маркетплейсов', d: 'WB 900×1200, Ozon 1000×1000, Яндекс Маркет — в один клик. Автоматическая обрезка.' },
    { ic: '👤', t: 'AI-модели на выбор', d: 'Женские и мужские, европейский и азиатский фенотипы. Разные позы.' },
    { ic: '🛡', t: 'Русский интерфейс', d: 'Оплата рублями через ЮKassa. Поддержка продавцов без VPN.' },
    { ic: '⚡', t: 'Быстрая генерация', d: '4 варианта за 20–40 секунд. Скачивание ZIP-архивом.' },
    { ic: '👗', t: 'Любой тип одежды', d: 'Верх, низ, платья, обувь, аксессуары. Флэтлэй, манекен, вешалка.' },
    { ic: '∞', t: 'Кредиты не сгорают', d: '5 кредитов при регистрации. Пакеты от 490 ₽. Срок бессрочный.' },
  ];

  const plans = [
    { n: 'Старт', p: '490', cr: 100, per: '4.9', pop: false },
    { n: 'Про', p: '1 990', cr: 500, per: '4.0', pop: true },
    { n: 'Бизнес', p: '5 990', cr: 2000, per: '3.0', pop: false },
  ];

  return (
    <div className="ml-fade" style={{ background: BG, color: TX }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '72px 28px 60px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: ORD, color: OR, padding: '4px 12px', borderRadius: 20,
          fontSize: 11, fontWeight: 700, marginBottom: 20,
        }}>✦ AI-фотосессии для маркетплейсов</div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 46px)', fontWeight: 900, lineHeight: 1.07, letterSpacing: '-0.03em', margin: '0 0 18px' }}>
          Карточка товара<br />с <span style={{ color: OR }}>AI-моделью</span><br />за 30 секунд
        </h1>
        <p style={{ fontSize: 16, color: MU, lineHeight: 1.7, margin: '0 0 30px', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
          Загрузите фото на вешалке или флэтлэй — получите профессиональный снимок с моделью для Wildberries и Ozon
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Btn style={{ padding: '12px 24px', fontSize: 15 }} onClick={onRegister}>Попробовать бесплатно</Btn>
          <Btn variant="ghost" style={{ padding: '12px 24px', fontSize: 15 }} onClick={onLogin}>Войти в аккаунт</Btn>
        </div>
        <p style={{ fontSize: 11, color: DIM, marginTop: 12 }}>5 бесплатных генераций · Без кредитной карты</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', borderTop: `1px solid ${BD}`, borderBottom: `1px solid ${BD}` }}>
        {[['30 сек', 'Генерация'], ['4 фото', 'С загруза'], ['от 3 ₽', 'За кредит'], ['2K / 4K', 'Разрешение'], ['5+ форматов', 'WB, Ozon, Яндекс']].map(([n, l], i) => (
          <div key={i} style={{ flex: '1 1 120px', padding: '22px 12px', textAlign: 'center', borderRight: i < 4 ? `1px solid ${BD}` : 'none' }}>
            <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1 }}>{n}</div>
            <div style={{ fontSize: 11, color: MU, marginTop: 5 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ padding: '60px 28px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: DIM, marginBottom: 10 }}>Возможности</div>
          <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em' }}>Всё что нужно для карточки товара</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 13 }}>
          {features.map(({ ic, t, d }) => (
            <div key={t} style={{ padding: 20, border: `1px solid ${BD}`, borderRadius: 10 }}>
              <div style={{ width: 34, height: 34, background: ORD, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, fontSize: 16 }}>{ic}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 12, color: MU, lineHeight: 1.65 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: '52px 28px', borderTop: `1px solid ${BD}`, background: SF }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: DIM, marginBottom: 10 }}>Как это работает</div>
          <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em' }}>Три шага до готовой карточки</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          {[
            ['1', 'Загрузите товар', 'Флэтлэй, на манекене или вешалке. JPG, PNG, WEBP.'],
            ['2', 'Выберите настройки', 'Маркетплейс, тип модели, фон и качество.'],
            ['3', 'Скачайте результат', '4 варианта в нужном формате. Готово к публикации.'],
          ].map(([n, t, d]) => (
            <div key={n}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%', border: `1px solid ${ORB}`,
                background: 'rgba(255,94,0,0.06)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 14px', fontSize: 18, fontWeight: 900, color: OR,
              }}>{n}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t}</div>
              <div style={{ fontSize: 12, color: MU, lineHeight: 1.65 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{ padding: '60px 28px', maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: DIM, marginBottom: 10 }}>Тарифы</div>
        <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 44px' }}>Простые цены, без подписки</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 13 }}>
          {plans.map(({ n, p, cr, per, pop }) => (
            <div key={n} style={{ padding: 22, border: `1px solid ${pop ? OR : BD}`, borderRadius: 10, position: 'relative' }}>
              {pop && (
                <div style={{
                  position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                  background: OR, color: '#fff', fontSize: 9, fontWeight: 800,
                  padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap',
                }}>Популярный</div>
              )}
              <div style={{ fontSize: 11, color: MU, marginBottom: 7 }}>{n}</div>
              <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 3 }}>{p} ₽</div>
              <div style={{ fontSize: 11, color: MU, marginBottom: 3 }}>{cr} кредитов</div>
              <div style={{ fontSize: 11, color: OR, marginBottom: 20 }}>~{per} ₽ / генерация</div>
              <Btn variant={pop ? 'primary' : 'ghost'} style={{ width: '100%', fontSize: 12, padding: '8px 0' }} onClick={onRegister}>
                Выбрать
              </Btn>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 14, fontSize: 11, color: DIM }}>Оплата через ЮKassa · Рублёвые карты · СБП · Без подписки</p>
      </div>

      {/* Bottom CTA */}
      <div style={{ textAlign: 'center', padding: '48px 28px', borderTop: `1px solid ${BD}`, background: SF }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 12px' }}>Начните прямо сейчас</h2>
        <p style={{ color: MU, marginBottom: 24, fontSize: 14 }}>5 генераций бесплатно — без карты и обязательств</p>
        <Btn style={{ padding: '12px 26px', fontSize: 15 }} onClick={onRegister}>Создать аккаунт бесплатно</Btn>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '14px 28px', borderTop: `1px solid ${BD}` }}>
        <Logo h={14} />
        <div style={{ fontSize: 11, color: DIM }}>© 2025 Mode(labs) · AI-фотосессии для маркетплейсов</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// AUTH PAGE
// ═══════════════════════════════════════════════════════
function Auth({ mode, onBack, onSuccess }: {
  mode: 'login' | 'register'; onBack: () => void; onSuccess: (u: User) => void;
}) {
  const [m, setM] = useState(mode);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const isLogin = m === 'login';

  const submit = () => {
    if (!email.includes('@')) { setErr('Введите корректный email'); return; }
    if (pass.length < 4)       { setErr('Пароль слишком короткий (мин. 4 символа)'); return; }
    setErr('');
    onSuccess({ email, name: name || email.split('@')[0], credits: 5, plan: 'free' });
  };

  return (
    <div className="ml-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px', minHeight: 'calc(100vh - 52px)', background: BG }}>
      <div style={{ width: '100%', maxWidth: 360, padding: 36, border: `1px solid ${BD}`, borderRadius: 14, background: SF }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}><Logo h={24} /></div>
        <h2 style={{ fontSize: 18, fontWeight: 800, textAlign: 'center', marginBottom: 5, letterSpacing: '-0.01em' }}>
          {isLogin ? 'Добро пожаловать' : 'Создать аккаунт'}
        </h2>
        <p style={{ fontSize: 12, color: MU, textAlign: 'center', margin: '0 0 22px' }}>
          {isLogin ? 'Войдите в аккаунт Mode(labs)' : '5 кредитов в подарок при регистрации'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {!isLogin && <FInp placeholder="Имя (необязательно)" value={name} onChange={setName} />}
          <FInp type="email" placeholder="Email" value={email} onChange={setEmail} />
          <FInp type="password" placeholder="Пароль" value={pass} onChange={setPass} />
        </div>
        {err && <div style={{ fontSize: 12, color: '#EF4444', marginTop: 8 }}>⚠ {err}</div>}
        <button onClick={submit} style={{
          width: '100%', marginTop: 16, padding: '11px 0', background: OR, color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          {isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: DIM }}>
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button onClick={() => setM(isLogin ? 'register' : 'login')} style={{
            background: 'none', border: 'none', color: OR, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: 0,
          }}>{isLogin ? 'Зарегистрироваться' : 'Войти'}</button>
        </p>
        <button onClick={onBack} style={{
          display: 'block', marginTop: 16, background: 'none', border: 'none',
          color: DIM, cursor: 'pointer', fontSize: 12, padding: 0,
        }}>← На главную</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STUDIO — LEFT PANEL
// ═══════════════════════════════════════════════════════
function LeftPanel({ s, ss, preview, dragging, onFile, onDrag, onGen, credits, gs }: {
  s: Settings; ss: (k: keyof Settings, v: string) => void;
  preview: string | null; dragging: boolean;
  onFile: (f: File) => void; onDrag: (v: boolean) => void;
  onGen: () => void; credits: number; gs: GenStatus;
}) {
  const cost = COST[s.q];
  const canGen = !!preview && credits >= cost && gs !== 'gen';
  return (
    <div style={{ width: 212, borderRight: `1px solid ${BD}`, overflowY: 'auto', padding: '13px 12px', flexShrink: 0 }}>
      <Dropzone onFile={onFile} preview={preview} dragging={dragging} onDrag={onDrag} />
      <SG label="Тип одежды" opts={[['top', 'Верх'], ['bot', 'Низ'], ['dress', 'Платье'], ['shoes', 'Обувь'], ['acc', 'Аксессуар']]} val={s.g} set={v => ss('g', v)} />
      <SG label="Маркетплейс" opts={[['wb', 'WB'], ['ozon', 'Ozon'], ['ym', 'Яндекс'], ['c', 'Кастом']]} val={s.mk} set={v => ss('mk', v)} />
      <SG label="Модель" opts={[['f', 'Женская'], ['m', 'Мужская'], ['n', 'Нейтральная']]} val={s.mod} set={v => ss('mod', v)} />
      <SG label="Фон" opts={[['w', 'Белый'], ['g', 'Серый'], ['t', 'Без фона']]} val={s.bg} set={v => ss('bg', v)} />
      <SG label="Качество" opts={[['fast', 'Быстро·1кр'], ['balanced', 'Баланс·3кр'], ['quality', 'Макс·4кр']]} val={s.q} set={v => ss('q', v)} />
      <hr style={{ border: 'none', borderTop: `1px solid ${BD}`, margin: '10px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: MU }}>Стоимость</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: OR }}>{cost} {cost === 1 ? 'кредит' : 'кредита'}</span>
      </div>
      <button onClick={onGen} disabled={!canGen} style={{
        width: '100%', padding: '11px 0', background: canGen ? OR : BD,
        color: canGen ? '#fff' : MU, border: 'none', borderRadius: 8, fontSize: 13,
        fontWeight: 700, cursor: canGen ? 'pointer' : 'not-allowed', transition: 'all .15s',
      }}>
        {gs === 'gen' ? '⚡ Генерирую...' : !preview ? 'Загрузите фото' : credits < cost ? 'Нет кредитов' : '⚡ Сгенерировать'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STUDIO — CENTER PANEL
// ═══════════════════════════════════════════════════════
function CenterPanel({ preview, gs, progress }: { preview: string | null; gs: GenStatus; progress: number }) {
  const phase = PHASES.reduce<string>((a, [t, l]) => (progress >= t ? l : a), PHASES[0][1]);
  const eta = progress < 96 ? Math.max(1, Math.round((96 - progress) / 12)) : 0;

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060402', position: 'relative', padding: 16, minHeight: 524 }}>
      {preview ? (
        <div style={{ position: 'relative', maxWidth: '100%', maxHeight: 480 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="товар" style={{
            maxWidth: '100%', maxHeight: 480, objectFit: 'contain', borderRadius: 8, display: 'block',
            opacity: gs === 'gen' ? 0.22 : 1, transition: 'opacity .5s',
          }} />
          {gs !== 'idle' && (
            <div style={{ position: 'absolute', top: 8, left: 8, padding: '3px 8px', background: 'rgba(0,0,0,.65)', borderRadius: 4, fontSize: 9, fontWeight: 700, color: '#fff' }}>
              ОРИГИНАЛ
            </div>
          )}
          {gs === 'gen' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div className="ml-pulse" style={{ width: 56, height: 56, background: ORD, border: `1px solid ${ORB}`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: OR }}>⚡</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TX, textAlign: 'center' }}>{phase}</div>
              <div style={{ width: 240, background: 'rgba(255,255,255,.07)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: OR, borderRadius: 100, width: `${progress}%`, transition: 'width .25s ease' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: OR, lineHeight: 1 }}>{Math.round(progress)}</span>
                <span style={{ fontSize: 13, color: MU }}>%{eta > 0 ? ` · ~${eta}с` : ''}</span>
              </div>
            </div>
          )}
          {gs === 'done' && (
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(34,197,94,.14)', border: '1px solid rgba(34,197,94,.35)', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#22C55E' }}>
              ✓ Готово — 4 варианта
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: DIM, userSelect: 'none' }}>
          <div style={{ width: 72, height: 72, background: SF, border: `1px solid ${BD}`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>🖼</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: MU }}>Загрузите товар слева</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Превью появится здесь</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STUDIO — RIGHT PANEL
// ═══════════════════════════════════════════════════════
function RightPanel({ gs, results, mk, progress, onDL, onDLAll, onRegen, gallery, showT }: {
  gs: GenStatus; results: string[]; mk: string; progress: number;
  onDL: (t: number | string) => void; onDLAll: () => void; onRegen: () => void;
  gallery: GalleryItem[]; showT: (msg: string, type?: string) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const fmt = mk === 'wb' ? '900×1200' : mk === 'ozon' ? '1000×1000' : mk === 'ym' ? '900×1200' : 'AUTO';
  const ar = mk === 'ozon' ? '1 / 1' : '3 / 4';
  const recent = gallery.slice(0, 3);

  if (gs === 'done' && results.length > 0) return (
    <div style={{ width: 212, borderLeft: `1px solid ${BD}`, display: 'flex', flexDirection: 'column', padding: '13px 12px', flexShrink: 0, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: DIM }}>Результаты</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', background: 'rgba(34,197,94,.1)', padding: '2px 7px', borderRadius: 4 }}>4 / 4 ✓</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 10 }}>
        {results.map((c, i) => (
          <div key={i} onClick={() => onDL(i)}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            style={{ borderRadius: 7, overflow: 'hidden', border: `1px solid ${hovered === i ? ORB : BD}`, cursor: 'pointer', transition: 'all .18s', transform: hovered === i ? 'scale(1.02)' : 'none' }}>
            <div style={{ background: c, aspectRatio: ar, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Sil sz={mk === 'ozon' ? 26 : 22} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3px 5px', background: 'rgba(0,0,0,.38)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,.7)' }}>{POSES[i]}</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#fff' }}>{fmt}</span>
              </div>
            </div>
            <div style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: hovered === i ? SF2 : SF }}>
              <span style={{ fontSize: 10, color: MU }}>вар. {i + 1}</span>
              <span style={{ fontSize: 11, color: OR }}>↓</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={onDLAll} style={{ width: '100%', padding: '9px 0', background: OR, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>↓ Скачать всё (ZIP)</button>
        <button onClick={() => onDL('wb')} style={{ width: '100%', padding: '7px 0', background: 'transparent', color: MU, border: `1px solid ${BD}`, borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>↓ Для WB · 900×1200</button>
        <button onClick={() => onDL('ozon')} style={{ width: '100%', padding: '7px 0', background: 'transparent', color: MU, border: `1px solid ${BD}`, borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>↓ Для Ozon · 1000×1000</button>
        <button onClick={onRegen} style={{ width: '100%', padding: '7px 0', background: 'transparent', color: DIM, border: `1px solid ${BD}`, borderRadius: 7, fontSize: 11, cursor: 'pointer' }}>↺ Ещё раз</button>
      </div>
    </div>
  );

  if (gs === 'gen') return (
    <div style={{ width: 212, borderLeft: `1px solid ${BD}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '13px 12px', flexShrink: 0, textAlign: 'center', gap: 12 }}>
      <div className="ml-pulse" style={{ width: 44, height: 44, background: ORD, border: `1px solid ${ORB}`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: OR }}>⚡</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: MU }}>AI генерирует...</div>
      <div style={{ width: '85%', background: SF2, borderRadius: 100, height: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: OR, borderRadius: 100, width: `${progress}%`, transition: 'width .25s ease' }} />
      </div>
      <div style={{ fontSize: 11, color: DIM }}>{Math.round(progress)}% завершено</div>
    </div>
  );

  // idle state — show recent history
  return (
    <div style={{ width: 212, borderLeft: `1px solid ${BD}`, display: 'flex', flexDirection: 'column', padding: '13px 12px', flexShrink: 0, overflowY: 'auto' }}>
      {recent.length > 0 ? (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: DIM, marginBottom: 10 }}>Последние сессии</div>
          {recent.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, padding: '8px 9px', border: `1px solid ${BD}`, borderRadius: 8, cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = ORB; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = BD; }}>
              <div style={{ width: 32, height: 42, background: g.color, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sil sz={12} op={0.25} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.market} · {g.type}</div>
                <div style={{ fontSize: 10, color: DIM, marginTop: 2 }}>{g.date} · {g.credits}кр</div>
              </div>
              <button onClick={() => { showT(`↓ Загрузка: ${g.market} · ${g.type}...`); setTimeout(() => showT('✓ Файлы сохранены', 'ok'), 1300); }}
                style={{ background: 'none', border: `1px solid ${BD}`, color: MU, cursor: 'pointer', fontSize: 11, padding: '3px 7px', borderRadius: 5 }}>↓</button>
            </div>
          ))}
          <hr style={{ border: 'none', borderTop: `1px solid ${BD}`, margin: '10px 0' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>✨</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: MU }}>Новый результат здесь</div>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 10 }}>
          <div style={{ width: 48, height: 48, background: SF, border: `1px solid ${BD}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>✨</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: MU }}>Результат здесь</div>
          <div style={{ fontSize: 11, color: DIM }}>4 варианта после генерации</div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// STUDIO PAGE
// ═══════════════════════════════════════════════════════
function Studio({ user, setUser, addToGallery, gallery, onNav }: {
  user: User; setUser: (u: User) => void; addToGallery: (item: GalleryItem) => void;
  gallery: GalleryItem[]; onNav: (p: Page) => void;
}) {
  const [preview, setPrev] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [gs, setGs] = useState<GenStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [results, setRes] = useState<string[]>([]);
  const [s, setSettings] = useState<Settings>({ g: 'top', mk: 'wb', mod: 'f', bg: 'w', q: 'balanced' });
  const [toast, setToast] = useState<Toast | null>(null);
  const iRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (iRef.current) clearInterval(iRef.current);
    if (tRef.current) clearTimeout(tRef.current);
  }, []);

  const ss = (k: keyof Settings, v: string) => setSettings(p => ({ ...p, [k]: v }));

  const showT = (msg: string, type: Toast['type'] = '') => {
    if (tRef.current) clearTimeout(tRef.current);
    setToast({ msg, type });
    tRef.current = setTimeout(() => setToast(null), 4200);
  };

  const onFile = (f: File) => {
    setPrev(URL.createObjectURL(f));
    setGs('idle'); setRes([]); setProgress(0);
    showT('Фото загружено!', 'ok');
  };

  const onGen = () => {
    const cost = COST[s.q];
    if (!preview || user.credits < cost || gs === 'gen') return;
    setUser({ ...user, credits: Math.max(0, user.credits - cost) });
    setGs('gen'); setProgress(0); setRes([]);
    if (iRef.current) clearInterval(iRef.current);

    iRef.current = setInterval(() => {
      setProgress(p => {
        const inc = p < 40 ? 7 : p < 70 ? 3.5 : p < 88 ? 1.5 : 0.6;
        const next = p + inc;
        if (next >= 96) {
          if (iRef.current) clearInterval(iRef.current);
          setTimeout(() => {
            setProgress(100); setGs('done'); setRes(RC);
            const mkL = s.mk === 'wb' ? 'WB' : s.mk === 'ozon' ? 'Ozon' : 'Яндекс';
            const gL  = s.g === 'top' ? 'Верх' : s.g === 'bot' ? 'Низ' : s.g === 'dress' ? 'Платье' : 'Товар';
            addToGallery({ id: Date.now().toString(), color: RC[0], date: 'Только что', market: mkL, type: gL, credits: cost });
            showT('✓ 4 варианта готовы! Скачивайте справа →', 'ok');
          }, 380);
          return 96;
        }
        return next;
      });
    }, 160);
  };

  const onDL = (target: number | string) => {
    if (target === 'wb')   { showT('↓ Загрузка для Wildberries (900×1200)...'); setTimeout(() => showT('✓ 4 файла для WB сохранены', 'ok'), 1400); }
    else if (target === 'ozon') { showT('↓ Загрузка для Ozon (1000×1000)...'); setTimeout(() => showT('✓ 4 файла для Ozon сохранены', 'ok'), 1400); }
    else { showT(`↓ Загрузка варианта ${(target as number) + 1}...`); setTimeout(() => showT(`✓ Вариант ${(target as number) + 1} сохранён`, 'ok'), 1100); }
  };

  const onDLAll = () => { showT('Формирование ZIP (4 варианта · 2 формата)...'); setTimeout(() => showT('✓ mode_labs_result.zip сохранён', 'ok'), 2200); };
  const onRegen = () => { setGs('idle'); setProgress(0); setRes([]); };
  const lowCreds = user.credits < 3 && user.credits > 0;
  const noCreds  = user.credits === 0;

  return (
    <div className="ml-fade" style={{ position: 'relative' }}>
      {(lowCreds || noCreds) && (
        <div style={{
          padding: '8px 16px', background: noCreds ? 'rgba(239,68,68,.08)' : 'rgba(245,158,11,.07)',
          borderBottom: `1px solid ${noCreds ? 'rgba(239,68,68,.2)' : 'rgba(245,158,11,.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12,
        }}>
          <span style={{ color: noCreds ? '#EF4444' : '#F59E0B' }}>
            {noCreds ? '⚠ Кредиты закончились' : '⚠ Кредиты заканчиваются'} · осталось {user.credits}
          </span>
          <button onClick={() => onNav('billing')} style={{
            background: 'none', border: `1px solid ${noCreds ? 'rgba(239,68,68,.4)' : 'rgba(245,158,11,.4)'}`,
            color: noCreds ? '#EF4444' : '#F59E0B', cursor: 'pointer', fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 6,
          }}>Пополнить →</button>
        </div>
      )}
      <div style={{ display: 'flex', minHeight: 524 }}>
        <LeftPanel s={s} ss={ss} preview={preview} dragging={drag} onFile={onFile} onDrag={setDrag} onGen={onGen} credits={user.credits} gs={gs} />
        <CenterPanel preview={preview} gs={gs} progress={progress} />
        <RightPanel gs={gs} results={results} mk={s.mk} progress={progress} onDL={onDL} onDLAll={onDLAll} onRegen={onRegen} gallery={gallery} showT={showT} />
      </div>
      {toast && (
        <div className="ml-toast" style={{
          position: 'absolute', bottom: 14, right: 14, background: '#1A1410',
          border: `1px solid ${toast.type === 'ok' ? 'rgba(34,197,94,.45)' : BD}`,
          borderRadius: 9, padding: '10px 14px', fontSize: 12,
          color: toast.type === 'ok' ? '#22C55E' : TX, maxWidth: 270, zIndex: 10, lineHeight: 1.5,
        }}>{toast.msg}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// GALLERY PAGE
// ═══════════════════════════════════════════════════════
function Gallery({ gallery, onNew, showT }: {
  gallery: GalleryItem[]; onNew: () => void; showT: (msg: string, type?: string) => void;
}) {
  const [hov, setHov] = useState<number | null>(null);
  const dl = (g: GalleryItem, fmt: string) => {
    showT(`↓ ${g.market} · ${g.type} (${fmt === 'wb' ? '900×1200' : '1000×1000'})...`);
    setTimeout(() => showT(`✓ Файлы для ${fmt === 'wb' ? 'WB' : 'Ozon'} сохранены`, 'ok'), 1400);
  };
  return (
    <div className="ml-fade" style={{ padding: '24px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.01em' }}>История генераций</div>
          <div style={{ fontSize: 12, color: MU, marginTop: 3 }}>
            {gallery.length} {gallery.length === 1 ? 'сессия' : gallery.length < 5 ? 'сессии' : 'сессий'}
          </div>
        </div>
        <Btn sm onClick={onNew}>+ Новая сессия</Btn>
      </div>
      {gallery.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: DIM }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 13, color: MU, marginBottom: 16 }}>Пока нет генераций</div>
          <Btn sm onClick={onNew}>Создать первую</Btn>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 13 }}>
          {gallery.map((g, i) => (
            <div key={g.id} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              style={{ border: `1px solid ${hov === i ? ORB : BD}`, borderRadius: 11, overflow: 'hidden', transition: 'all .2s', transform: hov === i ? 'translateY(-2px)' : 'none' }}>
              <div style={{ height: 136, background: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <Sil sz={38} />
                <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 4 }}>
                  {['900×1200', '1000×1000'].map(fmt => (
                    <div key={fmt} style={{ background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 8, padding: '2px 5px', borderRadius: 3, fontWeight: 700 }}>{fmt}</div>
                  ))}
                </div>
                <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(34,197,94,.2)', border: '1px solid rgba(34,197,94,.4)', color: '#22C55E', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>✓ ГОТОВО</div>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{g.market} · {g.type}</span>
                  <span style={{ fontSize: 10, color: DIM }}>{g.date}</span>
                </div>
                <div style={{ fontSize: 11, color: DIM, marginBottom: 9 }}>{g.credits} {g.credits === 1 ? 'кредит' : 'кредита'} · 4 варианта</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => dl(g, 'wb')} style={{ flex: 1, padding: '7px 0', background: OR, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>↓ WB</button>
                  <button onClick={() => dl(g, 'ozon')} style={{ flex: 1, padding: '7px 0', background: 'transparent', color: MU, border: `1px solid ${BD}`, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>↓ Ozon</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BILLING PAGE
// ═══════════════════════════════════════════════════════
function Billing({ credits, totalSpent, onBuy, showT }: {
  credits: number; totalSpent: number; onBuy: (cr: number) => void; showT: (msg: string, type?: string) => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const buy = (cr: number, name: string) => {
    setLoading(name);
    setTimeout(() => { onBuy(cr); setLoading(null); showT(`✓ +${cr} кредитов зачислено!`, 'ok'); }, 1700);
  };

  return (
    <div className="ml-fade" style={{ padding: '24px 24px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-.01em', marginBottom: 4 }}>Тарифы и кредиты</div>
        <div style={{ fontSize: 12, color: MU }}>Пополните баланс для создания AI-фотосессий</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13, marginBottom: 22 }}>
        {[
          [credits.toString(), 'Ваш баланс', 'кредитов · Бесплатный тариф'],
          [totalSpent.toString(), 'Потрачено', 'кредитов всего'],
        ].map(([n, label, sub]) => (
          <div key={label} style={{ background: SF, border: `1px solid ${BD}`, borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: DIM, marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}><span style={{ color: label === 'Ваш баланс' ? OR : MU }}>{n}</span></div>
            <div style={{ fontSize: 11, color: MU, marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { n: 'Старт', p: '490', cr: 100, per: '4.9', pop: false },
          { n: 'Про',   p: '1 990', cr: 500, per: '4.0', pop: true },
          { n: 'Бизнес', p: '5 990', cr: 2000, per: '3.0', pop: false },
        ].map(({ n, p, cr, per, pop }) => {
          const isLoad = loading === n;
          return (
            <div key={n} style={{ padding: 20, border: `1px solid ${pop ? OR : BD}`, borderRadius: 10, position: 'relative' }}>
              {pop && <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', background: OR, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>Популярный</div>}
              <div style={{ fontSize: 11, color: MU, marginBottom: 6 }}>{n}</div>
              <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 3 }}>{p} ₽</div>
              <div style={{ fontSize: 11, color: OR, marginBottom: 4 }}>+{cr} кредитов</div>
              <div style={{ fontSize: 10, color: DIM, marginBottom: 18 }}>~{per} ₽ за генерацию</div>
              <button disabled={!!isLoad} onClick={() => buy(cr, n)} style={{
                width: '100%', padding: '9px 0', background: isLoad ? SF2 : pop ? OR : 'transparent',
                color: isLoad ? MU : pop ? '#fff' : MU, border: `1px solid ${isLoad ? BD : pop ? OR : BD}`,
                borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: isLoad ? 'not-allowed' : 'pointer', transition: 'all .2s',
              }}>{isLoad ? '⏳ Оплата...' : 'Пополнить'}</button>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 16, padding: '14px 16px', background: SF, border: `1px solid ${BD}`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 20 }}>🔒</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>Безопасная оплата</div>
          <div style={{ fontSize: 11, color: MU }}>ЮKassa · Рублёвые карты · СБП · Кредиты зачисляются мгновенно</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// ROOT PAGE — wires everything together
// ═══════════════════════════════════════════════════════
export default function Home() {
  const [page, setPage]           = useState<Page>('landing');
  const [user, setUser]           = useState<User | null>(null);
  const [authMode, setAuthMode]   = useState<'login' | 'register'>('login');
  const [gallery, setGallery]     = useState<GalleryItem[]>([
    { id: '1', color: '#EDE5D8', date: '14 июня', market: 'WB',   type: 'Верх',   credits: 3 },
    { id: '2', color: '#D5DCEA', date: '13 июня', market: 'Ozon', type: 'Платье', credits: 3 },
    { id: '3', color: '#D9E8D5', date: '12 июня', market: 'WB',   type: 'Низ',    credits: 1 },
  ]);
  const [totalSpent, setTotalSpent] = useState(7);
  const [appToast, setAppToast]     = useState<Toast | null>(null);
  const atRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAppT = (msg: string, type?: string) => {
    if (atRef.current) clearTimeout(atRef.current);
    setAppToast({ msg, type: type as Toast['type'] });
    atRef.current = setTimeout(() => setAppToast(null), 4500);
  };

  const nav = (p: Page) => {
    if (!user && ['studio', 'gallery', 'billing'].includes(p)) {
      setAuthMode('login'); setPage('auth'); return;
    }
    setPage(p);
  };

  const handleAuth = (u: User) => { setUser(u); setPage('studio'); };
  const handleLogout = () => { setUser(null); setPage('landing'); };

  const addToGallery = (item: GalleryItem) => {
    setGallery(g => [item, ...g]);
    setTotalSpent(t => t + item.credits);
  };

  return (
    <div style={{ background: BG, minHeight: '100vh', color: TX }}>
      <Header user={user} page={page} onNav={nav} onLogout={handleLogout} />

      <main style={{ position: 'relative' }}>
        {page === 'landing' && <Landing onLogin={() => { setAuthMode('login'); setPage('auth'); }} onRegister={() => { setAuthMode('register'); setPage('auth'); }} />}
        {page === 'auth'    && <Auth mode={authMode} onBack={() => setPage('landing')} onSuccess={handleAuth} />}
        {page === 'studio'  && user && <Studio user={user} setUser={setUser} addToGallery={addToGallery} gallery={gallery} onNav={nav} />}
        {page === 'gallery' && user && <Gallery gallery={gallery} onNew={() => setPage('studio')} showT={showAppT} />}
        {page === 'billing' && user && <Billing credits={user.credits} totalSpent={totalSpent} onBuy={cr => setUser(u => u ? { ...u, credits: u.credits + cr } : u)} showT={showAppT} />}
      </main>

      {appToast && (
        <div className="ml-toast" style={{
          position: 'fixed', bottom: 20, right: 20, background: '#1A1410',
          border: `1px solid ${appToast.type === 'ok' ? 'rgba(34,197,94,.45)' : BD}`,
          borderRadius: 9, padding: '10px 14px', fontSize: 12,
          color: appToast.type === 'ok' ? '#22C55E' : TX,
          maxWidth: 280, zIndex: 100, lineHeight: 1.5,
        }}>{appToast.msg}</div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROLE_HOME } from '../../../api/mockData';
import { USE_BACKEND } from '../../../api/beClient';
import { useAuth } from '../../../auth/AuthContext';
import { PATH } from '../../../routers/routerPath';
import { Icon } from '../../../components/ui/Icon';
import { CONTENT, PHOTOS, type Lang } from './content';

const LANG_KEY = 'horsetrack_landing_lang';
const PROMISE_INTERVAL_MS = 7000;
type ServerState = 'checking' | 'ok' | 'down' | 'demo';
const GATEWAY_DOWN = [502, 503, 504];

const readLang = (): Lang => {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'vi';
  } catch {
    return 'vi';
  }
};

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

const useServerState = (): ServerState => {
  const [state, setState] = useState<ServerState>(USE_BACKEND ? 'checking' : 'demo');
  useEffect(() => {
    if (!USE_BACKEND) return;
    let alive = true;
    fetch('/api/v1/tournaments', { method: 'GET', cache: 'no-store' })
      .then((r) => { if (alive) setState(GATEWAY_DOWN.includes(r.status) ? 'down' : 'ok'); }, () => { if (alive) setState('down'); });
    return () => { alive = false; };
  }, []);
  return state;
};

const HR_POINTS = [128, 134, 142, 150, 158, 165, 170, 168, 174, 176, 179, 183, 186, 181];
const HR_MIN = 124;
const HR_MAX = 190;
const HR_LIMIT = 180;
const hrY = (bpm: number) => 120 - ((bpm - HR_MIN) / (HR_MAX - HR_MIN)) * 110;

const HeartRateVisual: React.FC<{ label: string }> = ({ label }) => {
  const step = 560 / (HR_POINTS.length - 1);
  const line = HR_POINTS.map((v, i) => `${(i * step).toFixed(1)},${hrY(v).toFixed(1)}`).join(' ');
  const peak = HR_POINTS.indexOf(Math.max(...HR_POINTS));
  return (
    <div className="ht-landing__hr" aria-hidden="true">
      <svg viewBox="0 0 560 128" preserveAspectRatio="none">
        <defs>
          <linearGradient id="landing-hr-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(27, 67, 50, .2)" />
            <stop offset="1" stopColor="rgba(27, 67, 50, 0)" />
          </linearGradient>
        </defs>
        <polygon points={`0,128 ${line} 560,128`} fill="url(#landing-hr-fill)" />
        <line x1="0" x2="560" y1={hrY(HR_LIMIT)} y2={hrY(HR_LIMIT)} className="ht-landing__hr-limit" />
        <polyline points={line} className="ht-landing__hr-line" />
        <circle cx={peak * step} cy={hrY(HR_POINTS[peak])} r="6" className="ht-landing__hr-peak" />
      </svg>
      <div className="ht-landing__hr-legend"><span>{HR_LIMIT} bpm</span><span>{label}</span></div>
    </div>
  );
};

const Stamp: React.FC<{ text: string }> = ({ text }) => (
  <span className="ht-landing__stamp" aria-hidden="true">
    <svg viewBox="0 0 120 120">
      <defs><path id="landing-stamp-path" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" /></defs>
      <circle cx="60" cy="60" r="56" />
      <text><textPath href="#landing-stamp-path">{text.repeat(2)}</textPath></text>
    </svg>
    <Icon name="shield" size={22} />
  </span>
);

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const [lang, setLang] = useState<Lang>(readLang);
  const [member, setMember] = useState(0);
  const [promise, setPromise] = useState(0);
  const [paused, setPaused] = useState(false);
  const server = useServerState();
  const c = CONTENT[lang];
  const home = user ? ROLE_HOME[user.role] : PATH.login;
  const join = user ? home : PATH.register;
  const activeMember = c.team.tabs[member];
  const promiseCount = c.promises.items.length;

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => {
    if (paused || reducedMotion()) return;
    const timer = window.setInterval(() => setPromise((p) => (p + 1) % promiseCount), PROMISE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, promiseCount]);

  const switchLang = (next: Lang) => {
    setLang(next);
    try { localStorage.setItem(LANG_KEY, next); } catch { return; }
  };
  const onTeamKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = c.team.tabs.length;
    const next = (member + (e.key === 'ArrowRight' ? 1 : n - 1)) % n;
    setMember(next);
    document.getElementById(`landing-team-tab-${c.team.tabs[next].key}`)?.focus();
  };

  return (
    <div className="ht ht-landing">
      <header className="ht-landing__bar">
        <div className="ht-landing__bar-inner">
          <Link className="ht-landing__logo" to={PATH.landing} data-testid="landing-logo">
            <img src="/horsetrack-logo.png" alt="" />
            <span>HorseTrack</span>
          </Link>
          <nav className="ht-landing__nav" aria-label="Mục lục trang">
            <a href="#about" data-testid="landing-nav-about">{c.nav.about}</a>
            <a href="#services" data-testid="landing-nav-services">{c.nav.services}</a>
            <a href="#process" data-testid="landing-nav-process">{c.nav.process}</a>
            <a href="#team" data-testid="landing-nav-team">{c.nav.team}</a>
            <a href="#faq" data-testid="landing-nav-faq">{c.nav.faq}</a>
          </nav>
          <div className="ht-landing__actions">
            <div className="ht-landing__lang" role="group" aria-label={c.nav.langLabel}>
              {(['vi', 'en'] as Lang[]).map((l) => (
                <button key={l} type="button" aria-pressed={lang === l} data-testid={`landing-lang-${l}`} onClick={() => switchLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
            <Link className="ht-landing__signin" to={home} data-testid="landing-login"><Icon name="usercircle" size={22} /><span>{c.nav.login}</span></Link>
            {!user && <Link className="ht-landing__btn ht-landing__btn--solid" to={PATH.register} data-testid="landing-register">{c.nav.register}</Link>}
          </div>
        </div>
      </header>

      <main>
        <section className="ht-landing__hero" style={{ backgroundImage: `url(${PHOTOS.hero})` }} role="img" aria-label={c.hero.photoAlt}>
          <div className="ht-landing__hero-inner">
            <span className="ht-landing__hero-kicker">{c.hero.kicker}</span>
            <hr />
            <h1>{c.hero.title}</h1>
            <hr />
            <p className="ht-landing__tagline">{c.hero.tagline.map((t, i) => <React.Fragment key={t}>{i > 0 && <i aria-hidden="true">/</i>}<span>{t}</span></React.Fragment>)}</p>
            <p className="ht-landing__hero-lead">{c.hero.lead}</p>
            <div className="ht-landing__hero-cta">
              <Link className="ht-landing__btn ht-landing__btn--accent" to={join} data-testid="landing-hero-register">{c.hero.primary}</Link>
              <a className="ht-landing__btn ht-landing__btn--ghost" href="#services" data-testid="landing-hero-services">{c.hero.secondary}</a>
            </div>
          </div>
        </section>

        <section id="about" className="ht-landing__about" aria-label={c.nav.about}>
          <div className="ht-landing__tile ht-landing__tile--photo" style={{ backgroundImage: `url(${PHOTOS.stable})` }} role="img" aria-label={c.about.left.alt}>
            <div className="ht-landing__label">
              <h2>{c.about.left.title}</h2>
              <a href="#services" data-testid="landing-about-services">{c.about.left.link}</a>
            </div>
          </div>
          <div className="ht-landing__tile ht-landing__tile--accent">
            <Stamp text={c.about.middle.stamp} />
            <h2>{c.about.middle.title}</h2>
            <p>{c.about.middle.text}</p>
            <a className="ht-landing__btn ht-landing__btn--dark" href="#service-race" data-testid="landing-about-race">{c.about.middle.button}</a>
          </div>
          <div className="ht-landing__tile ht-landing__tile--photo" style={{ backgroundImage: `url(${PHOTOS.jockey})` }} role="img" aria-label={c.about.right.alt}>
            <div className="ht-landing__label">
              <h2>{c.about.right.title}</h2>
              <a href="#team" data-testid="landing-about-team">{c.about.right.link}</a>
            </div>
          </div>
        </section>

        <section id="services" className="ht-landing__section" aria-labelledby="landing-services-title">
          <div className="ht-landing__inner">
            <div className="ht-landing__heading">
              <span className="ht-landing__kicker">{c.services.kicker}</span>
              <h2 id="landing-services-title">{c.services.title}</h2>
              <p>{c.services.lead}</p>
            </div>
            <div className="ht-landing__bento">
              {c.services.items.map((s) => (
                <article id={s.id} key={s.id} className={`ht-landing__card ht-landing__card--${s.size}`}>
                  <span className="ht-landing__icon"><Icon name={s.icon} size={20} /></span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  {s.size === 'lg' && <HeartRateVisual label={c.services.chart} />}
                  <ul>{s.points.map((p) => <li key={p}><Icon name="check" size={14} />{p}</li>)}</ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="ht-landing__section ht-landing__section--band" aria-labelledby="landing-process-title">
          <div className="ht-landing__inner">
            <div className="ht-landing__heading">
              <span className="ht-landing__kicker">{c.process.kicker}</span>
              <h2 id="landing-process-title">{c.process.title}</h2>
              <p>{c.process.lead}</p>
            </div>
            <ol className="ht-landing__flow">
              {c.process.steps.map((s, i) => (
                <li key={s.title}>
                  <span className="ht-landing__flow-no">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
            <div className="ht-landing__center">
              <Link className="ht-landing__btn ht-landing__btn--solid ht-landing__btn--lg" to={join} data-testid="landing-process-register">{c.process.cta}</Link>
            </div>
          </div>
        </section>

        <section id="team" className="ht-landing__section" aria-labelledby="landing-team-title">
          <div className="ht-landing__inner">
            <div className="ht-landing__heading">
              <span className="ht-landing__kicker">{c.team.kicker}</span>
              <h2 id="landing-team-title">{c.team.title}</h2>
              <p>{c.team.lead}</p>
            </div>
            <div className="ht-landing__roles">
              <div className="ht-landing__role-tabs" role="tablist" aria-label={c.team.kicker} onKeyDown={onTeamKey}>
                {c.team.tabs.map((t, i) => (
                  <button key={t.key} id={`landing-team-tab-${t.key}`} type="button" role="tab" aria-selected={i === member} aria-controls="landing-team-panel" tabIndex={i === member ? 0 : -1}
                    data-testid={`landing-team-${t.key}`} onClick={() => setMember(i)}>
                    <Icon name={t.icon} size={18} /><span>{t.name}</span>
                  </button>
                ))}
              </div>
              <div id="landing-team-panel" className="ht-landing__role-panel" role="tabpanel" aria-labelledby={`landing-team-tab-${activeMember.key}`} key={activeMember.key} data-testid="landing-team-panel">
                <span className="ht-landing__kicker">{activeMember.name}</span>
                <h3>{activeMember.headline}</h3>
                <p>{activeMember.text}</p>
                <div className="ht-landing__role-for">
                  <span className="ht-landing__mini-label">{c.team.forYouLabel}</span>
                  <ul>{activeMember.forYou.map((t) => <li key={t}><Icon name="check" size={14} />{t}</li>)}</ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="ht-landing__section ht-landing__rules" aria-labelledby="landing-promises-title" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="ht-landing__inner ht-landing__rules-inner">
            <img className="ht-landing__rules-mark" src="/horsetrack-logo.png" alt="" />
            <span className="ht-landing__kicker">{c.promises.kicker}</span>
            <h2 id="landing-promises-title">{c.promises.title}</h2>
            <figure className="ht-landing__rule" key={promise} data-testid="landing-promise">
              <blockquote>“{c.promises.items[promise].quote}”</blockquote>
              <figcaption>{c.promises.items[promise].by}</figcaption>
            </figure>
            <div className="ht-landing__dots">
              <button type="button" className="ht-landing__arrow" aria-label={c.promises.prev} data-testid="landing-promise-prev" onClick={() => setPromise((p) => (p + promiseCount - 1) % promiseCount)}><Icon name="back" size={16} /></button>
              {c.promises.items.map((it, i) => (
                <button key={it.by} type="button" aria-label={it.by} aria-current={i === promise} data-testid={`landing-promise-dot-${i}`} onClick={() => setPromise(i)} />
              ))}
              <button type="button" className="ht-landing__arrow" aria-label={c.promises.next} data-testid="landing-promise-next" onClick={() => setPromise((p) => (p + 1) % promiseCount)}><Icon name="arrow" size={16} /></button>
            </div>
          </div>
        </section>

        <section className="ht-landing__section ht-landing__section--tight" aria-labelledby="landing-gallery-title">
          <div className="ht-landing__inner">
            <div className="ht-landing__heading">
              <span className="ht-landing__kicker">{c.gallery.kicker}</span>
              <h2 id="landing-gallery-title">{c.gallery.title}</h2>
            </div>
            <div className="ht-landing__gallery">
              {PHOTOS.gallery.map((src, i) => (
                <figure key={src}>
                  <img src={src} alt={c.gallery.captions[i]} loading="lazy" />
                  <figcaption>{c.gallery.captions[i]}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="ht-landing__section ht-landing__section--band" aria-labelledby="landing-faq-title">
          <div className="ht-landing__inner ht-landing__faq-inner">
            <div className="ht-landing__heading">
              <span className="ht-landing__kicker">{c.faq.kicker}</span>
              <h2 id="landing-faq-title">{c.faq.title}</h2>
            </div>
            <div className="ht-landing__faq">
              {c.faq.items.map((f, i) => (
                <details key={f.q} data-testid={`landing-faq-${i}`} open={i === 0}>
                  <summary>{f.q}<Icon name="down" size={18} /></summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="ht-landing__band">
          <div className="ht-landing__inner ht-landing__band-inner">
            <div>
              <h2>{c.band.title}</h2>
              <p>{c.band.text}</p>
            </div>
            <div className="ht-landing__hero-cta">
              <Link className="ht-landing__btn ht-landing__btn--accent" to={join} data-testid="landing-band-register">{c.band.register}</Link>
              <Link className="ht-landing__btn ht-landing__btn--ghost" to={home} data-testid="landing-band-login">{c.band.login}</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="ht-landing__foot">
        <div className="ht-landing__inner ht-landing__foot-grid">
          <img className="ht-landing__foot-mark" src="/horsetrack-logo.png" alt="HorseTrack" />
          <div className="ht-landing__foot-col">
            <h3>{c.footer.details}</h3>
            {c.footer.detailLines.map((l) => <span key={l}>{l}</span>)}
            <div className={`ht-landing__status ht-landing__status--${server}`} data-testid="landing-status" role="status">
              <i aria-hidden="true" />
              <span>{c.footer.status.label}: {c.footer.status[server]}</span>
            </div>
          </div>
          <nav className="ht-landing__foot-col" aria-label={c.footer.links}>
            <h3>{c.footer.links}</h3>
            {c.footer.linkItems.map((l) => <a key={l.href} href={l.href} data-testid={`footer-link-${l.href.slice(1)}`}>{l.label}</a>)}
          </nav>
          <div className="ht-landing__foot-col">
            <h3>{c.footer.account}</h3>
            <Link to={PATH.login} data-testid="footer-login-link">{c.footer.login}</Link>
            <Link to={PATH.register} data-testid="footer-register-link">{c.footer.register}</Link>
            <Link to={PATH.forgotPassword} data-testid="footer-forgot-link">{c.footer.forgot}</Link>
          </div>
          <div className="ht-landing__foot-col ht-landing__foot-copy">
            <span>© 2026 {c.footer.rights}</span>
            <span>{c.footer.photos}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

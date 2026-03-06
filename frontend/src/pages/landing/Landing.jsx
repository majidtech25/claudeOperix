import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart2, Package, ShoppingCart, Users, CheckCircle2,
  ArrowRight, TrendingUp, Shield, Zap, ChevronDown,
  Star, MapPin, Phone, Mail, Menu, X
} from 'lucide-react'

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

function Counter({ to, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView()
  useEffect(() => {
    if (!inView) return
    let start = 0
    const duration = 1800
    const step = 16
    const inc = to / (duration / step)
    const t = setInterval(() => {
      start += inc
      if (start >= to) { setCount(to); clearInterval(t) }
      else setCount(Math.floor(start))
    }, step)
    return () => clearInterval(t)
  }, [inView, to])
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [heroRef,    heroInView]    = useInView(0.1)
  const [featRef,    featInView]    = useInView(0.1)
  const [howRef,     howInView]     = useInView(0.1)
  const [statsRef,   statsInView]   = useInView(0.1)
  const [pricingRef, pricingInView] = useInView(0.1)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{
      background: '#0a0d14', color: 'white',
      fontFamily: '"Inter", sans-serif',
      minHeight: '100vh', overflowX: 'hidden',
    }}>

      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(110,231,183,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(110,231,183,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '52px 52px',
      }} />

      {/* Glow top-left */}
      <div style={{
        position: 'fixed', top: -200, left: -200,
        width: 700, height: 700, borderRadius: '50%',
        pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle, rgba(110,231,183,0.07) 0%, transparent 65%)',
      }} />

      {/* Glow bottom-right */}
      <div style={{
        position: 'fixed', bottom: -200, right: -200,
        width: 700, height: 700, borderRadius: '50%',
        pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 65%)',
      }} />

      {/* ══════════════ NAVBAR ══════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6%', height: 64,
        background: scrolled ? 'rgba(10,13,20,0.94)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <span style={{
          fontFamily: '"Poppins", sans-serif', fontWeight: 800,
          fontSize: 22, letterSpacing: '-0.03em', userSelect: 'none',
        }}>
          Oper<span style={{ color: '#6ee7b7' }}>ix</span>
        </span>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}
          className="desk-nav">
          {['Features','How It Works','Pricing','Contact'].map(l => (
            <a key={l}
              href={`#${l.toLowerCase().replace(/ /g,'-')}`}
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => e.target.style.color = 'white'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.55)'}
            >{l}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/login" style={{
            fontSize: 13, color: 'rgba(255,255,255,0.65)',
            textDecoration: 'none', padding: '7px 16px',
            border: '1px solid rgba(255,255,255,0.13)', borderRadius: 4,
            transition: 'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)' }}
          >Sign In</Link>

          <Link to="/register" style={{
            fontSize: 13, fontWeight: 700, color: '#0a0d14',
            textDecoration: 'none', padding: '7px 16px',
            background: '#6ee7b7', borderRadius: 4, transition: 'background .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#34d399'}
            onMouseLeave={e => e.currentTarget.style.background = '#6ee7b7'}
          >Start Free</Link>

          <button onClick={() => setMenuOpen(o => !o)}
            className="mob-btn"
            style={{
              display: 'none', background: 'none', border: 'none',
              cursor: 'pointer', color: 'white', padding: 4,
            }}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
          background: 'rgba(10,13,20,0.98)', backdropFilter: 'blur(18px)',
          padding: '20px 6%', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          {['Features','How It Works','Pricing','Contact'].map(l => (
            <a key={l}
              href={`#${l.toLowerCase().replace(/ /g,'-')}`}
              onClick={() => setMenuOpen(false)}
              style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', textDecoration: 'none' }}
            >{l}</a>
          ))}
          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <Link to="/login" onClick={() => setMenuOpen(false)} style={{
              flex: 1, textAlign: 'center', padding: '10px', borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.15)', color: 'white',
              textDecoration: 'none', fontSize: 14,
            }}>Sign In</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} style={{
              flex: 1, textAlign: 'center', padding: '10px', borderRadius: 4,
              background: '#6ee7b7', color: '#0a0d14',
              textDecoration: 'none', fontSize: 14, fontWeight: 700,
            }}>Start Free</Link>
          </div>
        </div>
      )}

      {/* ══════════════ HERO ══════════════ */}
      <section ref={heroRef} style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '120px 6% 80px', textAlign: 'center',
      }}>

        {/* Location badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '5px 14px', borderRadius: 999,
          background: 'rgba(110,231,183,0.08)',
          border: '1px solid rgba(110,231,183,0.2)',
          fontSize: 12, color: '#6ee7b7', marginBottom: 32,
          opacity: heroInView ? 1 : 0,
          transform: heroInView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s ease',
        }}>
          <MapPin size={11} /> Built for Kenyan Retail Businesses
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: '"Poppins", sans-serif', fontWeight: 800,
          fontSize: 'clamp(34px, 6vw, 72px)',
          lineHeight: 1.08, letterSpacing: '-0.035em',
          maxWidth: 820, margin: '0 auto 24px',
          opacity: heroInView ? 1 : 0,
          transform: heroInView ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.7s ease 0.1s',
        }}>
          Run Your Business{' '}
          <span style={{ color: '#6ee7b7', position: 'relative', display: 'inline-block' }}>
            Like a CFO
            <svg style={{
              position: 'absolute', bottom: -8, left: 0, width: '100%',
              opacity: heroInView ? 1 : 0,
              transition: 'opacity 0.6s ease 0.9s',
            }} viewBox="0 0 280 10" fill="none">
              <path d="M2 7 Q70 1 140 7 Q210 13 278 7"
                stroke="#6ee7b7" strokeWidth="2.5"
                strokeLinecap="round" fill="none" />
            </svg>
          </span>
        </h1>

        {/* Sub */}
        <p style={{
          fontSize: 'clamp(15px, 2vw, 19px)',
          color: 'rgba(255,255,255,0.5)', lineHeight: 1.75,
          maxWidth: 560, margin: '0 auto 40px',
          opacity: heroInView ? 1 : 0,
          transform: heroInView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s ease 0.2s',
        }}>
          Operix gives Kenyan shops, supermarkets, and retail businesses
          full control over inventory, daily sales, and staff — all in one place.
          No spreadsheets. No guesswork.
        </p>

        {/* CTA buttons */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 12,
          justifyContent: 'center',
          opacity: heroInView ? 1 : 0,
          transform: heroInView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s ease 0.3s',
        }}>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 5,
            background: '#6ee7b7', color: '#0a0d14',
            fontWeight: 700, fontSize: 15, textDecoration: 'none',
            boxShadow: '0 0 40px rgba(110,231,183,0.22)',
            transition: 'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#34d399'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#6ee7b7'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Start Free — 14 Days <ArrowRight size={16} />
          </Link>
          <a href="#how-it-works" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px', borderRadius: 5,
            background: 'transparent', color: 'rgba(255,255,255,0.7)',
            fontWeight: 500, fontSize: 15, textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.15)',
            transition: 'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
          >
            See How It Works
          </a>
        </div>

        <p style={{
          marginTop: 24, fontSize: 12,
          color: 'rgba(255,255,255,0.28)',
          opacity: heroInView ? 1 : 0,
          transition: 'opacity 0.7s ease 0.5s',
        }}>
          No credit card required · Cancel anytime · Priced in KES
        </p>

        {/* Dashboard mockup */}
        <div style={{
          marginTop: 64, width: '100%', maxWidth: 860,
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 48px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(110,231,183,0.04)',
          opacity: heroInView ? 1 : 0,
          transform: heroInView
            ? 'translateY(0) perspective(1200px) rotateX(0deg)'
            : 'translateY(40px) perspective(1200px) rotateX(5deg)',
          transition: 'all 1s ease 0.4s',
        }}>
          {/* Browser bar */}
          <div style={{
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {['#f87171','#fbbf24','#6ee7b7'].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.65 }} />
            ))}
            <div style={{
              marginLeft: 10, maxWidth: 240, height: 22,
              background: 'rgba(255,255,255,0.05)', borderRadius: 3,
              display: 'flex', alignItems: 'center', paddingLeft: 10,
              fontSize: 10, color: 'rgba(255,255,255,0.28)',
              fontFamily: '"DM Mono", monospace',
            }}>
              app.operix.co.ke/dashboard
            </div>
          </div>

          {/* Mock layout */}
          <div style={{ display: 'flex', gap: 0 }}>
            {/* Sidebar */}
            <div style={{
              width: 48, background: 'rgba(0,0,0,0.2)',
              borderRight: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', padding: '16px 0', gap: 10,
            }}>
              <div style={{
                fontFamily: '"Poppins", sans-serif', fontWeight: 800,
                fontSize: 13, color: '#6ee7b7', letterSpacing: '-0.03em',
                marginBottom: 8,
              }}>Ox</div>
              {[BarChart2, Package, ShoppingCart, Users, TrendingUp].map((Icon, i) => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: i === 0 ? 'rgba(110,231,183,0.15)' : 'rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} color={i === 0 ? '#6ee7b7' : 'rgba(255,255,255,0.25)'} />
                </div>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Open day banner */}
              <div style={{
                padding: '8px 12px',
                background: 'rgba(110,231,183,0.06)',
                border: '1px solid rgba(110,231,183,0.15)',
                borderRadius: 5, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6ee7b7', boxShadow: '0 0 6px #6ee7b7' }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: '"DM Mono", monospace' }}>
                  Sales Day Open — {new Date().toISOString().slice(0,10)}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6ee7b7', fontFamily: '"DM Mono", monospace' }}>
                  KES 48,200 · 37 sales
                </span>
              </div>

              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {[
                  { l: "Today's Sales",  v: 'KES 48,200', accent: true },
                  { l: 'Transactions',   v: '37'                       },
                  { l: 'Low Stock',      v: '3 items'                  },
                  { l: 'Days Recorded',  v: '28'                       },
                ].map((s, i) => (
                  <div key={i} style={{
                    padding: '9px 11px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 5,
                  }}>
                    <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.l}</p>
                    <p style={{ fontSize: 13, fontFamily: '"DM Mono", monospace', margin: 0, color: s.accent ? '#6ee7b7' : 'white' }}>{s.v}</p>
                  </div>
                ))}
              </div>

              {/* Chart + low stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                <div style={{
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 5, height: 72,
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Sales History</p>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                    {[38,55,42,68,74,60,82,65,78,88,70,84,73,95].map((h, i) => (
                      <div key={i} style={{
                        flex: 1, borderRadius: '2px 2px 0 0', height: `${h}%`,
                        background: i === 13
                          ? '#6ee7b7'
                          : `rgba(110,231,183,${0.08 + (h/100)*0.22})`,
                      }} />
                    ))}
                  </div>
                </div>
                <div style={{
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 5,
                }}>
                  <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Low Stock</p>
                  {['Bread (2)','Sugar (1)','Rice (3)'].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>{item.split(' ')[0]}</span>
                      <span style={{ fontSize: 10, color: '#f87171', fontFamily: '"DM Mono", monospace' }}>{item.match(/\((\d+)\)/)?.[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 28, left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          opacity: 0.35, animation: 'bounce 2s infinite',
        }}>
          <span style={{ fontSize: 10, letterSpacing: '0.12em' }}>SCROLL</span>
          <ChevronDown size={13} />
        </div>
      </section>

      {/* ══════════════ STATS BAND ══════════════ */}
      <section ref={statsRef} style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(110,231,183,0.025)',
        padding: '52px 6%',
      }}>
        <div style={{
          maxWidth: 860, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
          gap: 24, textAlign: 'center',
        }}>
          {[
            { to: 500,  suffix: '+',     label: 'Businesses on Operix'    },
            { to: 2,    suffix: 'M+', prefix: 'KES ', label: 'Sales Processed Daily' },
            { to: 99,   suffix: '%',     label: 'Uptime Guaranteed'        },
            { to: 14,   suffix: ' Days', label: 'Free Trial, No Card'      },
          ].map((s, i) => (
            <div key={i} style={{
              opacity: statsInView ? 1 : 0,
              transform: statsInView ? 'translateY(0)' : 'translateY(20px)',
              transition: `all 0.6s ease ${i * 0.1}s`,
            }}>
              <p style={{
                fontFamily: '"Poppins", sans-serif', fontWeight: 800,
                fontSize: 'clamp(22px, 3vw, 36px)',
                color: '#6ee7b7', margin: '0 0 6px',
              }}>
                <Counter to={s.to} suffix={s.suffix} prefix={s.prefix ?? ''} />
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section id="features" ref={featRef} style={{
        position: 'relative', zIndex: 1,
        padding: '100px 6%',
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{
            textAlign: 'center', marginBottom: 60,
            opacity: featInView ? 1 : 0,
            transform: featInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease',
          }}>
            <p style={{ fontSize: 11, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>
              Everything You Need
            </p>
            <h2 style={{
              fontFamily: '"Poppins", sans-serif', fontWeight: 800,
              fontSize: 'clamp(26px, 4vw, 44px)', letterSpacing: '-0.025em',
              margin: '0 0 16px',
            }}>
              Built for How Kenyans<br />Actually Do Business
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 500, margin: '0 auto' }}>
              From Nairobi CBD shops to Mombasa wholesale stores — Operix adapts to your workflow.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 14 }}>
            {[
              {
                icon: ShoppingCart, delay: 0,
                title: 'Point of Sale (POS)',
                desc: 'Record sales in seconds. Accept cash, M-Pesa, or card. Every transaction is tracked and receipted automatically.',
              },
              {
                icon: Package, delay: 0.08,
                title: 'Inventory Control',
                desc: "Know exactly what's in stock at all times. Get low-stock alerts before you run out. Track every unit in and out.",
              },
              {
                icon: BarChart2, delay: 0.16,
                title: 'Daily Sales Reports',
                desc: 'Open and close your business day with full accountability. See which products sell most and which staff perform best.',
              },
              {
                icon: Users, delay: 0.24,
                title: 'Team Management',
                desc: 'Add employees, assign roles, and track individual performance. Every sale is linked to the staff member who made it.',
              },
              {
                icon: TrendingUp, delay: 0.32,
                title: 'Revenue Analytics',
                desc: 'Visualise your sales trends over days, weeks, and months. Make stocking decisions backed by real data.',
              },
              {
                icon: Shield, delay: 0.40,
                title: 'Secure & Reliable',
                desc: 'Your business data is encrypted and backed up automatically. Role-based access means staff only see what they need to.',
              },
            ].map((f, i) => (
              <div key={i} style={{
                padding: '26px 24px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8,
                opacity: featInView ? 1 : 0,
                transform: featInView ? 'translateY(0)' : 'translateY(28px)',
                transition: `opacity 0.6s ease ${f.delay}s, transform 0.6s ease ${f.delay}s, border-color 0.25s, background 0.25s, box-shadow 0.25s`,
                cursor: 'default',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(110,231,183,0.28)'
                  e.currentTarget.style.background  = 'rgba(110,231,183,0.04)'
                  e.currentTarget.style.boxShadow   = '0 8px 32px rgba(110,231,183,0.06)'
                  e.currentTarget.style.transform   = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                  e.currentTarget.style.background  = 'rgba(255,255,255,0.025)'
                  e.currentTarget.style.boxShadow   = 'none'
                  e.currentTarget.style.transform   = 'translateY(0)'
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 8, marginBottom: 16,
                  background: 'rgba(110,231,183,0.1)',
                  border: '1px solid rgba(110,231,183,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={18} color="#6ee7b7" />
                </div>
                <h3 style={{
                  fontFamily: '"Poppins", sans-serif', fontWeight: 700,
                  fontSize: 15, margin: '0 0 9px',
                }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.72, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section id="how-it-works" ref={howRef} style={{
        position: 'relative', zIndex: 1,
        padding: '100px 6%',
        background: 'rgba(255,255,255,0.015)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{
            textAlign: 'center', marginBottom: 60,
            opacity: howInView ? 1 : 0,
            transform: howInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease',
          }}>
            <p style={{ fontSize: 11, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>
              Simple Setup
            </p>
            <h2 style={{
              fontFamily: '"Poppins", sans-serif', fontWeight: 800,
              fontSize: 'clamp(26px, 4vw, 44px)', letterSpacing: '-0.025em', margin: 0,
            }}>
              Up and Running in 5 Minutes
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 40 }}>
            {[
              {
                step: '01',
                title: 'Register Your Business',
                desc: 'Create your Operix account with your business name and owner details. Takes under 2 minutes. No card needed.',
              },
              {
                step: '02',
                title: 'Add Your Products',
                desc: 'Enter your product catalogue with prices and stock levels. Add categories, set reorder alerts, track costs.',
              },
              {
                step: '03',
                title: 'Open & Start Selling',
                desc: 'Open a sales day each morning, record every sale through the POS, then close at end of day for a full report.',
              },
            ].map((s, i) => (
              <div key={i} style={{
                opacity: howInView ? 1 : 0,
                transform: howInView ? 'translateY(0)' : 'translateY(28px)',
                transition: `all 0.6s ease ${i * 0.15}s`,
              }}>
                <div style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: 52, fontWeight: 500,
                  color: 'rgba(110,231,183,0.14)',
                  lineHeight: 1, marginBottom: 18,
                }}>{s.step}</div>
                <h3 style={{
                  fontFamily: '"Poppins", sans-serif', fontWeight: 700,
                  fontSize: 17, margin: '0 0 12px',
                }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.48)', lineHeight: 1.72, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ PRICING ══════════════ */}
      <section id="pricing" ref={pricingRef} style={{
        position: 'relative', zIndex: 1,
        padding: '100px 6%',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{
            textAlign: 'center', marginBottom: 56,
            opacity: pricingInView ? 1 : 0,
            transform: pricingInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease',
          }}>
            <p style={{ fontSize: 11, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>
              Transparent Pricing
            </p>
            <h2 style={{
              fontFamily: '"Poppins", sans-serif', fontWeight: 800,
              fontSize: 'clamp(26px, 4vw, 44px)', letterSpacing: '-0.025em', margin: '0 0 12px',
            }}>
              Affordable for Every Business Size
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              All prices in Kenyan Shillings. No hidden charges. No surprises.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              {
                name: 'Trial', price: 'Free', period: '14 days',
                desc: 'Try everything with no commitment',
                features: ['1 user account','All core features','Up to 50 products','Email support'],
                cta: 'Start Free Trial', featured: false, delay: 0,
              },
              {
                name: 'Basic', price: 'KES 2,500', period: 'per month',
                desc: 'Perfect for small shops and kiosks',
                features: ['Up to 3 users','Unlimited products','Full POS & inventory','Sales reports','WhatsApp support'],
                cta: 'Get Started', featured: true, delay: 0.1,
              },
              {
                name: 'Pro', price: 'KES 6,500', period: 'per month',
                desc: 'For growing businesses with teams',
                features: ['Unlimited users','Multi-branch ready','Advanced analytics','Priority support','Custom onboarding'],
                cta: 'Go Pro', featured: false, delay: 0.2,
              },
            ].map((p, i) => (
              <div key={i} style={{
                padding: '32px 26px', borderRadius: 10, position: 'relative',
                background: p.featured ? 'rgba(110,231,183,0.06)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${p.featured ? 'rgba(110,231,183,0.3)' : 'rgba(255,255,255,0.08)'}`,
                opacity: pricingInView ? 1 : 0,
                transform: pricingInView ? 'translateY(0)' : 'translateY(28px)',
                transition: `all 0.6s ease ${p.delay}s`,
              }}>
                {p.featured && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#6ee7b7', color: '#0a0d14',
                    fontSize: 10, fontWeight: 800,
                    padding: '3px 14px', borderRadius: 999,
                    letterSpacing: '0.08em', whiteSpace: 'nowrap',
                  }}>MOST POPULAR</div>
                )}
                <p style={{
                  fontFamily: '"Poppins", sans-serif', fontWeight: 700,
                  fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: p.featured ? '#6ee7b7' : 'rgba(255,255,255,0.45)',
                  margin: '0 0 10px',
                }}>{p.name}</p>
                <p style={{
                  fontFamily: '"Poppins", sans-serif', fontWeight: 800,
                  fontSize: 32, letterSpacing: '-0.025em', margin: '0 0 3px',
                }}>{p.price}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', margin: '0 0 8px' }}>{p.period}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', margin: '0 0 24px' }}>{p.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <CheckCircle2 size={13} color="#6ee7b7" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to="/register" style={{
                  display: 'block', textAlign: 'center',
                  padding: '11px 20px', borderRadius: 5,
                  background: p.featured ? '#6ee7b7' : 'transparent',
                  color: p.featured ? '#0a0d14' : 'rgba(255,255,255,0.65)',
                  border: p.featured ? 'none' : '1px solid rgba(255,255,255,0.18)',
                  fontWeight: 600, fontSize: 14, textDecoration: 'none',
                  transition: 'all .2s',
                }}
                  onMouseEnter={e => {
                    if (p.featured) e.currentTarget.style.background = '#34d399'
                    else { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.38)' }
                  }}
                  onMouseLeave={e => {
                    if (p.featured) e.currentTarget.style.background = '#6ee7b7'
                    else { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }
                  }}
                >{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '80px 6%',
        background: 'rgba(255,255,255,0.015)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{
            textAlign: 'center', fontSize: 11, color: '#6ee7b7',
            textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 40,
          }}>
            Trusted by Kenyan Retailers
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {[
              {
                quote: "Operix changed how I run my shop in Westlands. I now know exactly what's selling and what's just sitting on my shelves.",
                name: 'Amina Wanjiku',
                role: 'Owner, Amina General Store — Nairobi',
              },
              {
                quote: "Before Operix, my staff would write sales in a book and I'd never know if the numbers matched. Now everything is tracked automatically.",
                name: 'Brian Otieno',
                role: 'Manager, Otieno Supermarket — Kisumu',
              },
              {
                quote: "The daily reports show me which products move fast. I've cut waste by 40% and my staff are more accountable.",
                name: 'Fatuma Hassan',
                role: 'Director, Hassan Wholesale — Mombasa',
              },
            ].map((t, i) => (
              <div key={i} style={{
                padding: '24px 22px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8,
              }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                  {Array(5).fill(0).map((_, j) => (
                    <Star key={j} size={12} fill="#6ee7b7" color="#6ee7b7" />
                  ))}
                </div>
                <p style={{
                  fontSize: 14, color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.72, margin: '0 0 20px', fontStyle: 'italic',
                }}>"{t.quote}"</p>
                <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 3px', color: 'white' }}>{t.name}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', margin: 0 }}>{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA BAND ══════════════ */}
      <section style={{
        position: 'relative', zIndex: 1,
        padding: '100px 6%', textAlign: 'center',
      }}>
        <div style={{
          maxWidth: 600, margin: '0 auto',
          padding: '56px 40px',
          background: 'rgba(110,231,183,0.05)',
          border: '1px solid rgba(110,231,183,0.15)',
          borderRadius: 16,
          boxShadow: '0 0 80px rgba(110,231,183,0.05)',
        }}>
          <h2 style={{
            fontFamily: '"Poppins", sans-serif', fontWeight: 800,
            fontSize: 'clamp(22px, 3.5vw, 36px)', letterSpacing: '-0.025em',
            margin: '0 0 16px',
          }}>
            Ready to Take Control<br />of Your Business?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', margin: '0 0 32px', lineHeight: 1.7 }}>
            Join hundreds of Kenyan retailers already running smarter with Operix.
            14-day free trial, no credit card needed.
          </p>
          <Link to="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 30px', borderRadius: 5,
            background: '#6ee7b7', color: '#0a0d14',
            fontWeight: 700, fontSize: 15, textDecoration: 'none',
            boxShadow: '0 0 40px rgba(110,231,183,0.18)',
            transition: 'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#34d399'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#6ee7b7'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Create Free Account <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer id="contact" style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '52px 6% 32px',
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 40, marginBottom: 48,
          }}>
            <div>
              <span style={{
                fontFamily: '"Poppins", sans-serif', fontWeight: 800,
                fontSize: 22, letterSpacing: '-0.03em',
                display: 'block', marginBottom: 12,
              }}>
                Oper<span style={{ color: '#6ee7b7' }}>ix</span>
              </span>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.72, margin: 0 }}>
                Retail management software built for Kenyan businesses.
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>Product</p>
              {['Features','Pricing','How It Works','Sign In'].map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.48)', textDecoration: 'none', marginBottom: 9 }}
                  onMouseEnter={e => e.target.style.color = 'white'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.48)'}
                >{l}</a>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>Company</p>
              {['About','Blog','Careers','Privacy Policy'].map(l => (
                <a key={l} href="#" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.48)', textDecoration: 'none', marginBottom: 9 }}
                  onMouseEnter={e => e.target.style.color = 'white'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.48)'}
                >{l}</a>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px' }}>Contact</p>
              {[
                { Icon: Mail,   text: 'hello@operix.co.ke'  },
                { Icon: Phone,  text: '+254 700 000 000'    },
                { Icon: MapPin, text: 'Nairobi, Kenya'      },
              ].map(({ Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                  <Icon size={12} color="rgba(255,255,255,0.28)" />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: 24,
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 10,
          }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', margin: 0 }}>
              © {new Date().getFullYear()} Operix. All rights reserved.
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', margin: 0 }}>
              Retail Management Software Kenya · POS System Kenya · Inventory Control
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0);  }
          50%       { transform: translateX(-50%) translateY(7px); }
        }
        @media (max-width: 640px) {
          .desk-nav  { display: none !important; }
          .mob-btn   { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
// ╔══════════════════════════════════════════════════════════╗
// ║   LIVRE DO CLUBO v4.5                                    ║
// ║   Firebase Firestore — dados compartilhados em tempo real║
// ╚══════════════════════════════════════════════════════════╝
//
// ARQUIVOS NECESSÁRIOS:
//   src/App.jsx        ← este arquivo
//   src/firebase.js    ← seu arquivo de configuração Firebase
//   src/main.jsx       ← não mexer
//   src/index.css      ← deixar vazio
//
// NOVIDADES v4.5:
//   ✅ Fonte display Bold (Bebas Neue) nos títulos
//   ✅ Bot de cobrança: quem não eliminou + data próxima
//   ✅ Botão de mês no header — navega histórico de sugestões
//   ✅ Inclusão manual de livros/notas antigas direto na pág. Livros
//   ✅ Perfil visível — aba dedicada com foto, stats e código

import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
  query, serverTimestamp, writeBatch
} from "firebase/firestore";

// ─── ESTILOS ─────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Figtree:wght@400;600;800&family=Lora:wght@600;700&display=swap');

:root {
  --bg:       #FFF0F5;
  --card:     #FFFFFF;
  --navy:     #1A1A2E;
  --pink:     #FF3F8E;
  --red:      #E8272A;
  --yellow:   #FFD600;
  --green:    #2DAB6F;
  --blue:     #1E6FD9;
  --orange:   #FF6B2B;
  --purple:   #8B2FC9;
  --teal:     #00B4A6;
  --cream:    #FFF0D0;
  --soft-pink:#FFD6E8;
  --soft-yel: #FFF8C2;
  --soft-grn: #C8F5E0;
  --soft-blu: #D0E8FF;
  --soft-org: #FFE0CC;
  --soft-pur: #EDD5FF;
  --r:16px; --r-lg:22px; --r-xl:30px;
  --shadow:0 2px 16px rgba(26,26,46,.08);
  --shadow-lg:0 8px 32px rgba(26,26,46,.15);
  --fd:'Bebas Neue',sans-serif;
  --fb:'Figtree',sans-serif;
  --fs:'Lora',serif;
}

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-tap-highlight-color:transparent;scroll-behavior:smooth}
body{font-family:var(--fb);background:var(--bg);color:var(--navy);min-height:100svh;overflow-x:hidden}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:rgba(255,63,142,.3);border-radius:99px}

.app-bg{
  min-height:100svh;background:var(--bg);
  background-image:
    radial-gradient(circle at 20% 10%,rgba(255,214,0,.18) 0%,transparent 40%),
    radial-gradient(circle at 80% 90%,rgba(255,63,142,.14) 0%,transparent 40%),
    radial-gradient(circle at 60% 40%,rgba(45,171,111,.08) 0%,transparent 35%);
}

/* ── HEADER ── */
.app-header{
  position:sticky;top:0;z-index:50;
  background:var(--navy);border-bottom:3px solid var(--yellow);
  display:flex;align-items:center;justify-content:space-between;
  padding:0 1rem;height:60px;gap:.5rem;
}
.logo-text{
  font-family:var(--fd);font-size:1.6rem;letter-spacing:3px;
  color:var(--yellow);text-shadow:2px 2px 0 var(--pink);
  white-space:nowrap;flex-shrink:0;
}
.month-switcher{
  display:flex;align-items:center;gap:4px;
  background:rgba(255,214,0,.15);border:1.5px solid rgba(255,214,0,.4);
  color:var(--yellow);border-radius:99px;padding:4px 10px;
  cursor:pointer;transition:background .18s;flex-shrink:0;
}
.month-switcher:hover{background:rgba(255,214,0,.25)}
.month-switcher span{font-size:.68rem;font-weight:800;letter-spacing:.5px;text-transform:uppercase;white-space:nowrap}
.month-nav-btn{background:transparent;border:none;color:var(--yellow);font-size:1rem;cursor:pointer;padding:0 2px;line-height:1;font-weight:900}
.header-right{display:flex;align-items:center;gap:.4rem;flex-shrink:0}
.header-avatar-btn{
  display:flex;align-items:center;gap:.4rem;
  background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.2);
  border-radius:99px;padding:4px 10px 4px 4px;
  cursor:pointer;color:white;font-size:.72rem;font-weight:800;
  transition:background .2s;font-family:var(--fb);
}
.header-avatar-btn:hover{background:rgba(255,255,255,.18)}
.sync-dot{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:pulse-sync 2s infinite;flex-shrink:0}
.sync-dot.off{background:var(--orange);animation:none}
@keyframes pulse-sync{0%,100%{opacity:1}50%{opacity:.4}}

/* ── BOTTOM NAV ── */
.bottom-nav{
  position:fixed;bottom:0;left:0;right:0;z-index:50;
  background:var(--navy);border-top:3px solid var(--yellow);
  display:flex;padding-bottom:env(safe-area-inset-bottom);
}
.nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 2px 6px;background:transparent;border:none;cursor:pointer;color:rgba(255,255,255,.4);font-family:var(--fb);font-size:.55rem;font-weight:800;letter-spacing:.3px;text-transform:uppercase;transition:color .15s}
.nav-btn.active{color:var(--yellow)}
.nav-btn .ico{font-size:1.15rem;line-height:1}

/* ── SIDEBAR DESKTOP ── */
@media(min-width:768px){
  .bottom-nav{display:none}
  .app-layout{display:flex;min-height:calc(100svh - 60px)}
  .sidebar{width:200px;min-width:200px;background:var(--navy);padding:1.25rem .65rem;display:flex;flex-direction:column;gap:.15rem;border-right:2px solid rgba(255,214,0,.3);position:sticky;top:60px;height:calc(100svh - 60px);overflow-y:auto}
  .sidebar-btn{display:flex;align-items:center;gap:.6rem;padding:.6rem .8rem;border-radius:10px;border:none;background:transparent;color:rgba(255,255,255,.45);font-family:var(--fb);font-size:.82rem;font-weight:700;cursor:pointer;width:100%;text-align:left;transition:all .15s}
  .sidebar-btn:hover{background:rgba(255,255,255,.08);color:white}
  .sidebar-btn.active{background:var(--pink);color:white}
  .app-header{display:none}
  .desktop-header{display:flex!important;position:sticky;top:0;z-index:50;background:var(--navy);border-bottom:3px solid var(--yellow);padding:0 1.5rem;height:60px;align-items:center;justify-content:space-between}
  .desktop-main{flex:1;min-width:0}
}
@media(max-width:767px){.sidebar{display:none!important}.desktop-header{display:none!important}.desktop-main{width:100%}}

/* ── MAIN ── */
.main{padding:1.25rem 1rem 6.5rem;max-width:880px;margin:0 auto}
@media(min-width:768px){.main{padding:1.75rem 2rem 2.5rem}}

/* ── PAGE TITLE (Bebas Neue) ── */
.page-title{font-family:var(--fd);font-size:3rem;letter-spacing:4px;line-height:1;margin-bottom:.2rem}
.page-title .hi{color:var(--pink)}
.page-title .accent{color:var(--red)}
.section-title{font-family:var(--fd);font-size:1.5rem;letter-spacing:3px}
.page-sub{font-size:.85rem;color:rgba(26,26,46,.5);font-weight:600;margin-bottom:1.4rem}

/* ── CARDS ── */
.card{background:var(--card);border-radius:var(--r-lg);padding:1.2rem;box-shadow:var(--shadow);border:2px solid transparent;position:relative;overflow:hidden;transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .22s}
.card:hover{transform:translateY(-3px);box-shadow:var(--shadow-lg)}
.card.no-hover:hover{transform:none;box-shadow:var(--shadow)}
.card.c-pink{border-color:var(--pink);background:rgba(255,63,142,.04)}
.card.c-yellow{border-color:var(--yellow);background:rgba(255,214,0,.06)}
.card.c-green{border-color:var(--green);background:rgba(45,171,111,.06)}
.card.c-blue{border-color:var(--blue);background:rgba(30,111,217,.06)}
.card.c-orange{border-color:var(--orange);background:rgba(255,107,43,.06)}
.card.c-red{border-color:var(--red);background:rgba(232,39,42,.04)}
.card.c-purple{border-color:var(--purple);background:rgba(139,47,201,.05)}
.card.c-teal{border-color:var(--teal);background:rgba(0,180,166,.06)}
.card-stripe::before{content:'';position:absolute;top:0;left:0;right:0;height:4px}
.cs-pink::before{background:var(--pink)}.cs-yellow::before{background:var(--yellow)}.cs-green::before{background:var(--green)}.cs-blue::before{background:var(--blue)}.cs-orange::before{background:var(--orange)}.cs-red::before{background:var(--red)}.cs-multi::before{background:linear-gradient(90deg,var(--pink),var(--yellow),var(--green),var(--blue))}

/* ── BLOCK CARDS ── */
.block-card{border-radius:var(--r-lg);padding:1.2rem;font-family:var(--fb);position:relative;overflow:hidden}
.block-pink{background:var(--pink);color:white}.block-yellow{background:var(--yellow);color:var(--navy)}.block-green{background:var(--green);color:white}.block-blue{background:var(--blue);color:white}.block-orange{background:var(--orange);color:white}.block-red{background:var(--red);color:white}.block-navy{background:var(--navy);color:white}.block-teal{background:var(--teal);color:var(--navy)}.block-cream{background:var(--cream);color:var(--navy)}

/* ── BUTTONS ── */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.45rem;padding:.65rem 1.3rem;border-radius:10px;border:none;cursor:pointer;font-family:var(--fb);font-size:.82rem;font-weight:800;transition:all .18s cubic-bezier(.34,1.56,.64,1);text-transform:uppercase;letter-spacing:.4px}
.btn:active{transform:scale(.95)}.btn:disabled{opacity:.45;cursor:not-allowed;transform:none!important}
.btn-pink{background:var(--pink);color:white;box-shadow:0 3px 12px rgba(255,63,142,.35)}.btn-pink:hover:not(:disabled){background:#e0006e;transform:translateY(-2px)}
.btn-yellow{background:var(--yellow);color:var(--navy);box-shadow:0 3px 12px rgba(255,214,0,.35)}.btn-yellow:hover:not(:disabled){transform:translateY(-2px)}
.btn-green{background:var(--green);color:white;box-shadow:0 3px 12px rgba(45,171,111,.3)}.btn-green:hover:not(:disabled){transform:translateY(-2px)}
.btn-blue{background:var(--blue);color:white;box-shadow:0 3px 12px rgba(30,111,217,.3)}.btn-blue:hover:not(:disabled){transform:translateY(-2px)}
.btn-orange{background:var(--orange);color:white;box-shadow:0 3px 12px rgba(255,107,43,.3)}.btn-orange:hover:not(:disabled){transform:translateY(-2px)}
.btn-red{background:var(--red);color:white;box-shadow:0 3px 12px rgba(232,39,42,.3)}.btn-red:hover:not(:disabled){transform:translateY(-2px)}
.btn-navy{background:var(--navy);color:var(--yellow)}.btn-navy:hover:not(:disabled){transform:translateY(-2px)}
.btn-outline{background:transparent;border:2px solid var(--pink);color:var(--pink)}.btn-outline:hover:not(:disabled){background:var(--pink);color:white}
.btn-ghost{background:rgba(26,26,46,.07);color:var(--navy);border:1.5px solid transparent}.btn-ghost:hover:not(:disabled){border-color:var(--navy)}
.btn-danger{background:rgba(232,39,42,.1);color:var(--red);border:1.5px solid transparent}.btn-danger:hover:not(:disabled){background:var(--red);color:white}
.btn-full{width:100%}.btn-sm{padding:.35rem .8rem;font-size:.72rem}.btn-lg{padding:.85rem 1.7rem;font-size:.92rem}
.btn-raffle{background:linear-gradient(135deg,var(--yellow),var(--orange));color:var(--navy);font-size:.95rem;padding:.95rem 2rem;border-radius:14px;box-shadow:0 6px 20px rgba(255,107,43,.4);animation:pulse-raffle 2.5s infinite}
@keyframes pulse-raffle{0%,100%{box-shadow:0 6px 20px rgba(255,107,43,.4)}50%{box-shadow:0 8px 32px rgba(255,107,43,.7),0 0 0 10px rgba(255,214,0,.15)}}

/* ── FORMS ── */
.form-group{margin-bottom:.85rem}
.form-label{display:block;font-family:var(--fd);font-size:.82rem;letter-spacing:1.5px;color:var(--navy);opacity:.55;margin-bottom:5px}
.form-input,.form-select,.form-textarea{width:100%;padding:.65rem 1rem;border:2px solid rgba(26,26,46,.12);border-radius:10px;font-family:var(--fb);font-size:.88rem;background:white;color:var(--navy);outline:none;transition:border-color .18s,box-shadow .18s}
.form-input:focus,.form-select:focus,.form-textarea:focus{border-color:var(--pink);box-shadow:0 0 0 3px rgba(255,63,142,.12)}
.form-textarea{resize:vertical;min-height:90px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}

/* ── UPLOAD ── */
.upload-zone{border:2px dashed rgba(26,26,46,.2);border-radius:12px;padding:1.1rem;text-align:center;cursor:pointer;transition:all .18s;background:rgba(255,214,0,.04)}
.upload-zone:hover{border-color:var(--pink);background:rgba(255,63,142,.04)}

/* ── TAGS ── */
.tag{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:99px;font-size:.68rem;font-weight:800;letter-spacing:.2px}
.tag-pink{background:var(--soft-pink);color:var(--pink)}.tag-yellow{background:var(--soft-yel);color:#7A5800}.tag-green{background:var(--soft-grn);color:#0D6B3F}.tag-blue{background:var(--soft-blu);color:#0A4A9E}.tag-orange{background:var(--soft-org);color:#A83800}.tag-purple{background:var(--soft-pur);color:var(--purple)}.tag-navy{background:rgba(26,26,46,.08);color:var(--navy)}.tag-red{background:rgba(232,39,42,.1);color:var(--red)}.tag-teal{background:rgba(0,180,166,.12);color:#007068}

/* ── MODAL ── */
.modal-overlay{position:fixed;inset:0;z-index:200;background:rgba(26,26,46,.6);backdrop-filter:blur(4px);display:flex;align-items:flex-end;animation:fadeIn .2s}
@media(min-width:640px){.modal-overlay{align-items:center;justify-content:center}.modal{border-radius:var(--r-xl)!important;max-width:540px}}
@keyframes fadeIn{from{opacity:0}}
@keyframes slideUp{from{transform:translateY(50px);opacity:0}}
.modal{background:var(--bg);width:100%;max-height:93svh;overflow-y:auto;border-radius:var(--r-xl) var(--r-xl) 0 0;padding:1.4rem;animation:slideUp .28s cubic-bezier(.34,1.56,.64,1);position:relative}
.modal-handle{width:42px;height:4px;background:rgba(26,26,46,.15);border-radius:99px;margin:0 auto 1.2rem}
.modal-title{font-family:var(--fd);font-size:2rem;letter-spacing:3px;margin-bottom:1.1rem}
.modal-close{position:absolute;top:.9rem;right:.9rem;width:30px;height:30px;border-radius:50%;border:1.5px solid rgba(26,26,46,.15);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:.85rem;transition:all .18s;color:var(--navy)}
.modal-close:hover{background:var(--red);color:white;border-color:var(--red)}

/* ── STATS ── */
.stats-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.65rem;margin-bottom:1.4rem}
@media(min-width:520px){.stats-grid{grid-template-columns:repeat(4,1fr)}}
.stat-card{border-radius:var(--r-lg);padding:1rem;text-align:center;position:relative;overflow:hidden}
.stat-num{font-family:var(--fd);font-size:2.2rem;letter-spacing:2px;line-height:1}
.stat-label{font-size:.62rem;font-weight:800;text-transform:uppercase;letter-spacing:.8px;opacity:.75;margin-top:4px}

/* ── AVATAR ── */
.avatar{border-radius:50%;object-fit:cover;flex-shrink:0}
.avatar-ph{border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;flex-shrink:0;font-family:var(--fd);letter-spacing:1px}

/* ── BOOK ── */
.book-cover{width:64px;min-width:64px;height:96px;border-radius:8px;object-fit:cover;box-shadow:3px 4px 12px rgba(0,0,0,.2)}
.book-cover-ph{width:64px;min-width:64px;height:96px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;box-shadow:3px 4px 12px rgba(0,0,0,.12);flex-shrink:0}
.book-title{font-family:var(--fs);font-weight:700;font-size:.98rem;line-height:1.2;margin-bottom:2px}
.book-author{font-size:.78rem;color:var(--blue);font-weight:700;margin-bottom:5px}

/* ── RATING ── */
.rating-num-btn{width:32px;height:32px;border-radius:8px;border:2px solid rgba(26,26,46,.15);background:transparent;font-size:.8rem;font-weight:800;cursor:pointer;transition:all .14s;color:var(--navy);font-family:var(--fb)}
.rating-num-btn:hover,.rating-num-btn.sel{background:var(--pink);border-color:var(--pink);color:white;transform:scale(1.12)}

/* ── ALERT ── */
.alert{border-radius:10px;padding:.7rem 1rem;display:flex;gap:.5rem;align-items:flex-start;font-size:.8rem;font-weight:700;margin-bottom:.65rem}
.alert-warn{background:rgba(255,214,0,.18);border:2px solid var(--yellow);color:#6B4A00}
.alert-error{background:rgba(232,39,42,.08);border:2px solid var(--red);color:var(--red)}
.alert-ok{background:rgba(45,171,111,.1);border:2px solid var(--green);color:#0A5C35}
.alert-info{background:rgba(30,111,217,.08);border:2px solid var(--blue);color:var(--blue)}

/* ── MISC ── */
.divider{height:2px;background:rgba(26,26,46,.06);margin:1rem 0;border-radius:99px}
.section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:.85rem}
.badge{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;border-radius:99px;padding:0 5px;font-size:.65rem;font-weight:800}
.badge-pink{background:var(--pink);color:white}.badge-yellow{background:var(--yellow);color:var(--navy)}.badge-green{background:var(--green);color:white}.badge-navy{background:var(--navy);color:var(--yellow)}
.toast{position:fixed;bottom:5rem;left:50%;transform:translateX(-50%);background:var(--navy);color:white;padding:.6rem 1.4rem;border-radius:99px;font-size:.82rem;font-weight:800;z-index:500;white-space:nowrap;border:2.5px solid var(--yellow);animation:toastIn .28s cubic-bezier(.34,1.56,.64,1);max-width:92vw}
@media(min-width:768px){.toast{bottom:2rem}}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(14px) scale(.9)}}
.filter-bar{display:flex;gap:.35rem;overflow-x:auto;padding-bottom:.2rem;margin-bottom:1rem;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.filter-bar::-webkit-scrollbar{display:none}
.chip{padding:5px 13px;border-radius:99px;border:2px solid rgba(26,26,46,.14);background:white;font-size:.75rem;font-weight:800;cursor:pointer;white-space:nowrap;transition:all .15s;color:var(--navy);font-family:var(--fb)}
.chip.active{background:var(--navy);color:var(--yellow);border-color:var(--navy)}
.empty{text-align:center;padding:3rem 1rem}
.empty .ico{font-size:3.5rem;margin-bottom:.75rem}
.empty .ttl{font-family:var(--fd);font-size:2rem;letter-spacing:3px;color:rgba(26,26,46,.4);margin-bottom:.4rem}
.empty .txt{font-size:.85rem;color:rgba(26,26,46,.4);font-weight:600}
.toggle{position:relative;display:inline-flex;align-items:center;cursor:pointer;gap:.5rem}
.toggle input{position:absolute;opacity:0;width:0;height:0}
.toggle-track{width:40px;height:22px;background:rgba(26,26,46,.15);border-radius:99px;transition:background .18s;position:relative;flex-shrink:0}
.toggle input:checked+.toggle-track{background:var(--pink)}
.toggle-thumb{position:absolute;top:3px;left:3px;width:16px;height:16px;background:white;border-radius:50%;transition:transform .18s;box-shadow:0 1px 4px rgba(0,0,0,.2)}
.toggle input:checked+.toggle-track+.toggle-thumb{transform:translateX(18px)}
.progress-bar{height:6px;background:rgba(26,26,46,.1);border-radius:99px;overflow:hidden;margin-top:4px}
.progress-fill{height:100%;border-radius:99px;transition:width .4s}
.tab-bar{display:flex;background:rgba(26,26,46,.06);border-radius:12px;padding:3px;margin-bottom:1rem;gap:3px}
.tab-btn{flex:1;padding:.48rem;border:none;border-radius:9px;background:transparent;font-family:var(--fb);font-size:.78rem;font-weight:800;cursor:pointer;color:rgba(26,26,46,.45);transition:all .15s}
.tab-btn.active{background:white;color:var(--navy);box-shadow:0 2px 8px rgba(0,0,0,.1)}
.loading-screen{min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--navy);gap:1rem}
.loading-logo{font-family:var(--fd);font-size:3rem;letter-spacing:6px;color:var(--yellow);text-shadow:3px 3px 0 var(--pink);animation:pulse-logo 1.5s infinite}
@keyframes pulse-logo{0%,100%{opacity:1}50%{opacity:.7}}
.spinner{width:30px;height:30px;border:3px solid rgba(255,214,0,.2);border-top-color:var(--yellow);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.login-screen{min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;background:var(--navy);position:relative;overflow:hidden}
.login-bg-el{position:absolute;border-radius:50%;pointer-events:none}
.login-card{background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:var(--r-xl);padding:1.8rem;width:100%;max-width:400px;backdrop-filter:blur(12px);position:relative}
.confetti-text{font-family:var(--fd);font-size:2.2rem;letter-spacing:4px;text-align:center;background:linear-gradient(135deg,var(--pink),var(--orange),var(--yellow));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;background-size:200%;animation:shimmer 2s infinite}
@keyframes shimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes popIn{from{transform:scale(.5);opacity:0}}
.pop-in{animation:popIn .38s cubic-bezier(.34,1.56,.64,1)}
.rank-row{display:flex;align-items:center;gap:.8rem;padding:.8rem;background:white;border-radius:12px;border:2px solid rgba(26,26,46,.07);margin-bottom:.5rem}
.rank-num{font-family:var(--fd);font-size:2rem;letter-spacing:2px;min-width:36px;text-align:center}
.gender-badge{font-size:.65rem;font-weight:800;padding:2px 8px;border-radius:99px}
.gender-f{background:var(--soft-pink);color:var(--pink)}.gender-m{background:var(--soft-blu);color:var(--blue)}
.elim-card{display:flex;align-items:center;gap:.8rem;padding:.8rem;background:white;border-radius:12px;border:2px solid rgba(26,26,46,.08);margin-bottom:.5rem;transition:all .18s}
.elim-card.eliminated{opacity:.45;background:rgba(26,26,46,.04);border-style:dashed;text-decoration:line-through}
.elim-card.voted{border-color:var(--pink);background:rgba(255,63,142,.05)}
.ticker-wrap{overflow:hidden;background:var(--yellow);padding:6px 0;border-radius:99px;margin-bottom:1rem}
.ticker{display:flex;gap:2rem;animation:ticker 20s linear infinite;width:max-content}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.ticker-item{font-family:var(--fd);font-size:.75rem;letter-spacing:2px;color:var(--navy);white-space:nowrap}
.flow-bar{display:flex;align-items:center;background:white;border-radius:12px;padding:.45rem;border:2px solid rgba(26,26,46,.08);margin-bottom:1.25rem;overflow-x:auto;scrollbar-width:none}
.flow-bar::-webkit-scrollbar{display:none}
.flow-step{display:flex;align-items:center;gap:.3rem;white-space:nowrap;padding:.3rem .55rem;border-radius:8px;font-family:var(--fd);font-size:.75rem;letter-spacing:1px;color:rgba(26,26,46,.3)}
.flow-step.active{background:var(--pink);color:white}
.flow-step.done{color:var(--green)}
.flow-arrow{color:rgba(26,26,46,.18);font-size:.65rem;flex-shrink:0;margin:0 1px}
.adm-crown{color:var(--yellow)}
.locked-overlay{position:absolute;inset:0;background:rgba(255,255,255,.85);backdrop-filter:blur(2px);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:inherit;z-index:5;gap:.5rem}
.locked-overlay .lock-ico{font-size:2rem}
.locked-overlay .lock-txt{font-size:.82rem;font-weight:700;color:rgba(26,26,46,.5);text-align:center}
/* Profile page */
.profile-cover{height:100px;border-radius:var(--r-lg) var(--r-lg) 0 0;display:flex;align-items:center;justify-content:center;font-size:3rem;position:relative}
.profile-avatar-wrap{position:absolute;bottom:-28px;left:1.2rem;border:4px solid white;border-radius:50%;box-shadow:var(--shadow)}
.viewing-month-banner{background:var(--orange);color:white;text-align:center;padding:5px;font-size:.72rem;font-weight:800;letter-spacing:.5px}
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const getInitials = (n="") => n.trim().split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const currentMonthKey = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const formatMonthYear = (k) => { if(!k)return""; const[y,m]=k.split("-"); return `${MONTHS[parseInt(m)-1]} ${y}`; };
const formatMonthShort = (k) => { if(!k)return""; const[y,m]=k.split("-"); return `${MONTHS[parseInt(m)-1].slice(0,3)} ${y}`; };
const starsFrom = (r) => "★".repeat(Math.round(r/2))+"☆".repeat(5-Math.round(r/2));
// Formata média/nota no padrão brasileiro (vírgula), ex: 7,5 — aceita number ou null
const fmtNota = (n) => (n===null||n===undefined||isNaN(n)) ? "" : n.toFixed(1).replace(".",",");
const checkPageLimit = (pages,mk) => { if(!pages||!mk)return null; const m=parseInt(mk.split("-")[1]); const limit=[11,12,1,2].includes(m)?450:350; return pages>limit?`⚠️ ${pages}p excede o limite de ${limit}p para este mês.`:null; };
const AVATAR_COLORS = ["#FF3F8E","#E8272A","#FFD600","#2DAB6F","#1E6FD9","#FF6B2B","#8B2FC9","#00B4A6"];
// Alguns clubes acabaram com membros duplicados no Firestore (mesmo nome, docs diferentes).
// Usado só nos seletores de "quem sugeriu" pra não repetir nomes na lista — não afeta o
// Painel → Membros, que continua mostrando todos os documentos (é lá que se apaga o duplicado).
const dedupeMembers = (list) => { const seen=new Set(); return list.filter(m=>{const k=(m.name||"").trim().toLowerCase();if(seen.has(k))return false;seen.add(k);return true;}); };

const addMonths = (k, n) => {
  const [y,m] = k.split("-").map(Number);
  const d = new Date(y, m-1+n, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
};

// ─── PODERES — ciclo de 14 meses, igual para todo o clube ─────────────────────
const CYCLE_LEN = 14;
const monthDiff = (a,b) => { const[ay,am]=a.split("-").map(Number);const[by,bm]=b.split("-").map(Number); return (ay*12+am)-(by*12+bm); };
const cycleIndexFor = (month, start) => Math.floor(monthDiff(month, start||"2025-01") / CYCLE_LEN);
const cycleRangeFor = (cycle, start) => { const s=addMonths(start||"2025-01", cycle*CYCLE_LEN); const e=addMonths(s, CYCLE_LEN-1); return [s,e]; };

const POWERS = [
  {id:"resorteio",     label:"Resorteio",                  ico:"🔄", when:"post", desc:"Sorteia de novo entre os mesmos concorrentes do mês (o livro atual também pode saltar de novo)."},
  {id:"resorteio_sem", label:"Resorteio sem o livro atual", ico:"🔁", when:"post", desc:"Sorteia de novo, excluindo o livro que já tinha saído."},
  {id:"ressuscitar",   label:"Ressuscitar eliminado",      ico:"📗", when:"pre",  desc:"Escolha 1 livro eliminado este mês e devolva ele para a disputa."},
  {id:"remover",       label:"Tirar um livro do sorteio",  ico:"🗑️", when:"pre",  desc:"Escolha 1 livro entre os concorrentes e remova ele da disputa."},
  {id:"escolher",      label:"Escolher o livro do mês",    ico:"👉", when:"pre",  desc:"Escolha direto o livro do mês, sem depender do sorteio."},
  {id:"delegar",       label:"Delegar a escolha",          ico:"🎯", when:"pre",  desc:"Escolha uma pessoa para decidir o livro do mês entre os concorrentes."},
  {id:"trocar2",       label:"Trocar 2 livros",            ico:"🔀", when:"pre",  desc:"Retire 2 livros da disputa e devolva 2 livros eliminados."},
  {id:"trocar1",       label:"Trocar 1 livro",             ico:"🔀", when:"pre",  desc:"Retire 1 livro da disputa e devolva 1 livro eliminado."},
];
const powerLabel = (id) => POWERS.find(p=>p.id===id)?.label || id;

// ─── DEFAULT MEMBERS ──────────────────────────────────────────────────────────
const DEFAULT_MEMBERS = [
  {id:"m1",  name:"Nath",    code:"nath123",  gender:"f",photo:"",isAdmin:false,color:"#FF3F8E"},
  {id:"m2",  name:"Gabriel", code:"gab123",   gender:"m",photo:"",isAdmin:false,color:"#1E6FD9"},
  {id:"m3",  name:"Gabi",    code:"gabi123",  gender:"f",photo:"",isAdmin:false,color:"#E8272A"},
  {id:"m4",  name:"Fábia",   code:"fabia123", gender:"f",photo:"",isAdmin:false,color:"#2DAB6F"},
  {id:"m5",  name:"Laísa",   code:"laisa123", gender:"f",photo:"",isAdmin:false,color:"#FF6B2B"},
  {id:"m6",  name:"Mika",    code:"mika123",  gender:"f",photo:"",isAdmin:false,color:"#8B2FC9"},
  {id:"m7",  name:"Carol",   code:"carol123", gender:"f",photo:"",isAdmin:false,color:"#00B4A6"},
  {id:"adm", name:"Admin",   code:"admin123", gender:"m",photo:"",isAdmin:true, color:"#FFD600"},
];

// ─── FIRESTORE ────────────────────────────────────────────────────────────────
const FS = {
  set: (col,id,data) => setDoc(doc(db,col,id),{...data,_upd:serverTimestamp()},{merge:true}),
  del: (col,id) => deleteDoc(doc(db,col,id)),
};

function useCol(name) {
  const [data,setData]=useState([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const unsub=onSnapshot(query(collection(db,name)),(snap)=>{setData(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false);},(err)=>{console.error(name,err);setLoading(false);});
    return()=>unsub();
  },[name]);
  return{data,loading};
}

function useDocFS(col,docId) {
  const [data,setData]=useState({}); const [loading,setLoading]=useState(true);
  useEffect(()=>{
    if(!docId)return;
    const unsub=onSnapshot(doc(db,col,docId),(snap)=>{setData(snap.exists()?snap.data():{});setLoading(false);});
    return()=>unsub();
  },[col,docId]);
  return{data,loading};
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser,setCurrentUser]=useState(null);
  const [page,setPage]=useState("home");
  const [toast,setToast]=useState(null);
  const [toastTimer,setToastTimer]=useState(null);
  const [online,setOnline]=useState(true);
  const [seeded,setSeeded]=useState(false);
  // viewMonth: mês sendo visualizado (pode diferir do mês real)
  const [viewMonth,setViewMonth]=useState(currentMonthKey());
  const calendarMonth = currentMonthKey();

  const {data:members,loading:lM}=useCol("members");
  const {data:books,loading:lB}=useCol("books");
  const {data:suggestions,loading:lS}=useCol("suggestions");
  const {data:ratings,loading:lR}=useCol("ratings");
  const {data:reviews}=useCol("reviews");
  const {data:progressComments}=useCol("progressComments");
  const {data:configDoc} =useDocFS("config","general");

  const config   = {powerCycleStart:"2025-01",...configDoc};
  const setConfig= (v)=>FS.set("config","general",v);
  // "Adiantar mês" (admin): trata o mês escolhido como se fosse o mês atual em todo o app,
  // pra dar pra fazer eliminação/votação/sorteio do mês seguinte antes do calendário virar.
  // Some sozinho quando o calendário real alcança o mês adiantado.
  const realMonth = config.monthOverride || calendarMonth;
  const isMonthAdvanced = !!config.monthOverride && config.monthOverride!==calendarMonth;
  const isViewingCurrent = viewMonth === realMonth;
  const isViewingFuture = viewMonth > realMonth;
  // navegação pro futuro é limitada a 1 mês (pra dar pra planejar o tema com antecedência)
  const maxViewMonth = addMonths(realMonth,1);

  // Sempre que o mês "atual" muda (calendário real ou mês adiantado pelo admin), acompanha ele por padrão
  useEffect(()=>{setViewMonth(realMonth)},[realMonth]);

  const {data:rulesDoc}  =useDocFS("monthRules",realMonth);
  const {data:viewRulesDoc}=useDocFS("monthRules",viewMonth);
  const {data:votesDoc}  =useDocFS("votes",realMonth);
  const {data:elimDoc}   =useDocFS("indivElim",realMonth);
  const {data:permsDoc}  =useDocFS("monthPerms",realMonth);
  const {data:phaseDoc}  =useDocFS("monthPhase",realMonth);
  const {data:delegateDoc}=useDocFS("raffleDelegate",realMonth);
  const {data:powerUses} =useCol("powerUses");
  const {data:themeOffers}=useCol("themeOffers");

  const rules  = {suggLimit:2,hasTheme:false,theme:"",maxElimVotes:2,meetingDay:"",meetingTime:"",meetingLocal:"",...rulesDoc};
  const viewRules = {suggLimit:2,hasTheme:false,theme:"",maxElimVotes:2,meetingDay:"",meetingTime:"",meetingLocal:"",...viewRulesDoc};
  const curVotes = votesDoc||{};
  const curElim  = elimDoc||{};
  const perms    = permsDoc||{};
  const phase    = phaseDoc?.phase||"suggest";
  const powerCycle = cycleIndexFor(realMonth, config.powerCycleStart);
  const viewPowerCycle = cycleIndexFor(viewMonth, config.powerCycleStart);

  useEffect(()=>{const on=()=>setOnline(true);const off=()=>setOnline(false);window.addEventListener("online",on);window.addEventListener("offline",off);return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};},[]);

  useEffect(()=>{
    if(lM||seeded||members.length>0)return;
    setSeeded(true);
    const batch=writeBatch(db);
    DEFAULT_MEMBERS.forEach(m=>batch.set(doc(db,"members",m.id),m));
    batch.commit().catch(console.error);
  },[lM,members,seeded]);

  const showToast=(msg,ms=2800)=>{if(toastTimer)clearTimeout(toastTimer);setToast(msg);const t=setTimeout(()=>setToast(null),ms);setToastTimer(t);};
  const loading=lM||lB||lS||lR;

  const voteCounts={};
  Object.values(curVotes).flat().forEach(id=>{voteCounts[id]=(voteCounts[id]||0)+1;});

  // sugestões do mês VISUALIZADO (para navegação de histórico)
  const viewMonthSugg = suggestions.filter(s=>s.month===viewMonth);
  // sugestões do mês REAL (para bot, fase, etc.)
  const realMonthSugg = suggestions.filter(s=>s.month===realMonth);

  const getBookRatings=(bid)=>ratings.filter(r=>r.bookId===bid);
  const getBookAvg=(bid)=>{const br=getBookRatings(bid);if(!br.length)return null;return br.reduce((s,r)=>s+r.value,0)/br.length;};

  const setPhase=(p)=>FS.set("monthPhase",realMonth,{phase:p});
  const setVotes=(v)=>FS.set("votes",realMonth,v);
  const setElim=(v)=>FS.set("indivElim",realMonth,v);
  const setPerms=(v)=>FS.set("monthPerms",realMonth,v);
  const setRules=(v)=>FS.set("monthRules",realMonth,v);
  const setViewRules=(v)=>FS.set("monthRules",viewMonth,v);

  const canDo=(memberId,action)=>{
    // Admin participa normalmente — sem restrições de fase ou permissão individual
    if(currentUser?.isAdmin)return true;
    const mp=perms[memberId]||{};
    if(action==="suggest")return phase==="suggest"&&mp.canSuggest!==false;
    if(action==="vote")   return phase==="vote"&&mp.canVote!==false;
    if(action==="elim")   return(phase==="suggest"||phase==="vote")&&mp.canElim!==false;
    return true;
  };

  // Auto-unlock vote phase
  useEffect(()=>{
    if(phase!=="suggest")return;
    const sugIds=[...new Set(realMonthSugg.filter(s=>!s.eliminated&&!s.raffled).map(s=>s.suggestedBy))];
    // Usa id!=="adm" para não excluir membros que viraram admin via painel
    const normal=members.filter(m=>m.id!=="adm");
    if(normal.length>0&&normal.every(m=>sugIds.includes(m.id))&&realMonthSugg.length>0)setPhase("vote");
  },[realMonthSugg,members,phase]);

  const nav=[
    {id:"home",   ico:"🏠",label:"Início"},
    {id:"suggest",ico:"💡",label:"Sugestões"},
    {id:"elim",   ico:"❌",label:"Eliminação"},
    {id:"books",  ico:"📚",label:"Livros"},
    {id:"ranking",ico:"🏆",label:"Ranking"},
    {id:"profile",ico:"👤",label:"Perfil"},
    {id:"admin",  ico:"⚙️",label:"Painel"},
  ];

  if(loading)return(
    <><style>{STYLES}</style>
    <div className="loading-screen">
      <div className="loading-logo">LIVRE DO CLUBO</div>
      <div className="spinner"/>
      <div style={{color:"rgba(255,255,255,.4)",fontSize:".78rem",fontWeight:700}}>Conectando ao clube...</div>
    </div></>
  );

  if(!currentUser)return(
    <><style>{STYLES}</style>
    <LoginScreen members={members} onLogin={setCurrentUser} showToast={showToast} toast={toast}/></>
  );

  const sharedProps={members,books,suggestions,ratings,reviews,progressComments,currentUser,realMonth,viewMonth,rules,phase,curVotes,curElim,perms,voteCounts,getBookRatings,getBookAvg,setPhase,setVotes,setElim,setRules,setPerms,canDo,showToast,setPage,isViewingCurrent,isViewingFuture,
    viewRules,setViewRules,viewPowerCycle,calendarMonth,isMonthAdvanced,
    powerUses,powerCycle,config,setConfig,delegateDoc,themeOffers,
    // aliases usados pelo EliminationPage
    indivElim:curElim, setIndivElim:setElim,
  };

  const pages={
    home:    <HomePage {...sharedProps} realMonthSugg={realMonthSugg} viewMonthSugg={viewMonthSugg}/>,
    suggest: <SuggestPage {...sharedProps} viewMonthSugg={viewMonthSugg} realMonthSugg={realMonthSugg}/>,
    elim:    <EliminationPage {...sharedProps} monthSugg={realMonthSugg}/>,
    books:   <BooksPage {...sharedProps}/>,
    ranking: <RankingPage {...sharedProps}/>,
    profile: <ProfilePage {...sharedProps}/>,
    admin:   <AdminPage {...sharedProps} realMonthSugg={realMonthSugg}/>,
  };

  return(
    <><style>{STYLES}</style>
    <div className="app-bg">
      {/* viewing month banner */}
      {!isViewingCurrent&&(
        <div className="viewing-month-banner">
          👁️ Visualizando {formatMonthYear(viewMonth)} — <button onClick={()=>setViewMonth(realMonth)} style={{background:"none",border:"none",color:"white",fontWeight:900,cursor:"pointer",textDecoration:"underline",fontSize:".72rem"}}>voltar ao mês atual</button>
        </div>
      )}

      <header className="app-header">
        <div className="logo-text">LIVRE DO CLUBO</div>

        {/* Month switcher */}
        <div className="month-switcher">
          <button className="month-nav-btn" onClick={()=>setViewMonth(m=>addMonths(m,-1))}>‹</button>
          <span>{formatMonthShort(viewMonth)}</span>
          <button className="month-nav-btn" onClick={()=>setViewMonth(m=>addMonths(m,1))} disabled={viewMonth>=maxViewMonth}>›</button>
        </div>

        <div className="header-right">
          <div className={`sync-dot${online?"":" off"}`} title={online?"Online":"Offline"}/>
          <button className="header-avatar-btn" onClick={()=>setPage("profile")}>
            <MemberAvatar member={currentUser} size={28}/>
            {currentUser.name.split(" ")[0]}
            {currentUser.isAdmin&&<span className="adm-crown">👑</span>}
          </button>
        </div>
      </header>

      <div className="desktop-header">
        <div className="logo-text" style={{fontSize:"1.4rem",letterSpacing:"3px"}}>LIVRE DO CLUBO</div>
        <div style={{display:"flex",alignItems:"center",gap:".75rem"}}>
          <div className="month-switcher">
            <button className="month-nav-btn" onClick={()=>setViewMonth(m=>addMonths(m,-1))}>‹</button>
            <span>{formatMonthShort(viewMonth)}</span>
            <button className="month-nav-btn" onClick={()=>setViewMonth(m=>addMonths(m,1))} disabled={viewMonth>=maxViewMonth}>›</button>
          </div>
          <div className={`sync-dot${online?"":" off"}`}/>
          <button className="header-avatar-btn" onClick={()=>setCurrentUser(null)}>
            <MemberAvatar member={currentUser} size={28}/>
            {currentUser.name} {currentUser.isAdmin&&<span className="adm-crown">👑</span>}
            <span style={{opacity:.45,fontSize:".72rem"}}>Sair</span>
          </button>
        </div>
      </div>

      <div className="app-layout">
        <nav className="sidebar">
          {nav.map(n=>(
            <button key={n.id} className={`sidebar-btn${page===n.id?" active":""}`} onClick={()=>setPage(n.id)}>
              <span style={{fontSize:"1rem"}}>{n.ico}</span>{n.label}
            </button>
          ))}
          <div style={{marginTop:"auto"}}>
            <div className="divider"/>
            <button className="sidebar-btn" onClick={()=>setCurrentUser(null)}>🚪 Sair</button>
          </div>
        </nav>
        <div className="desktop-main">
          <main className="main">{pages[page]||pages.home}</main>
        </div>
      </div>

      <nav className="bottom-nav">
        {nav.map(n=>(
          <button key={n.id} className={`nav-btn${page===n.id?" active":""}`} onClick={()=>setPage(n.id)}>
            <span className="ico">{n.ico}</span>{n.label}
          </button>
        ))}
      </nav>

      {toast&&<div className="toast">{toast}</div>}
    </div></>
  );
}

// ─── MEMBER AVATAR ────────────────────────────────────────────────────────────
function MemberAvatar({member,size=46}) {
  if(!member)return null;
  const s={width:size,height:size,fontSize:size*.36};
  if(member.photo)return<img src={member.photo} className="avatar" style={{...s,border:`2px solid ${member.color||"#FFD600"}`}} alt=""/>;
  return<div className="avatar-ph" style={{...s,background:member.color||"#FF3F8E",border:`2px solid rgba(255,255,255,.25)`}}>{getInitials(member.name)}</div>;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({members,onLogin,showToast,toast}) {
  const [code,setCode]=useState("");
  const [shake,setShake]=useState(false);
  const handleSubmit=()=>{
    const m=members.find(m=>m.code===code.trim());
    if(!m){setShake(true);setTimeout(()=>setShake(false),500);showToast("Código inválido! 🔐");setCode("");return;}
    onLogin(m);
  };
  return(
    <div className="login-screen">
      <div className="login-bg-el" style={{width:380,height:380,background:"var(--pink)",top:-140,right:-100,opacity:.12}}/>
      <div className="login-bg-el" style={{width:280,height:280,background:"var(--yellow)",bottom:-80,left:-80,opacity:.14}}/>
      <div className="login-bg-el" style={{width:200,height:200,background:"var(--green)",top:"35%",left:"8%",opacity:.08}}/>

      <div style={{fontFamily:"var(--fd)",fontSize:"3rem",letterSpacing:"6px",color:"var(--yellow)",textShadow:"3px 3px 0 var(--pink)",textAlign:"center",marginBottom:".3rem",position:"relative"}}>
        LIVRE DO CLUBO
      </div>
      <div style={{color:"rgba(255,255,255,.4)",fontSize:".82rem",fontWeight:800,letterSpacing:"2px",textTransform:"uppercase",textAlign:"center",marginBottom:"2rem",position:"relative"}}>
        ✦ Clube do Livro ✦
      </div>

      <div className="login-card" style={shake?{animation:"shake .35s"}:{}}>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}`}</style>
        <div style={{fontFamily:"var(--fd)",fontSize:"1.1rem",letterSpacing:"3px",color:"white",textAlign:"center",marginBottom:"1.1rem"}}>INSIRA SEU CÓDIGO</div>
        <input
          type="password"
          className="form-input"
          placeholder="••••••••"
          value={code}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          onChange={e=>setCode(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
          style={{background:"rgba(255,255,255,.08)",color:"white",borderColor:"rgba(255,255,255,.2)",textAlign:"center",fontSize:"1.2rem",letterSpacing:"4px",marginBottom:"1rem"}}
          autoFocus
        />
        <button className="btn btn-yellow btn-full btn-lg" onClick={handleSubmit}>ENTRAR 🔓</button>
        <div className="divider" style={{background:"rgba(255,255,255,.08)"}}/>
        <div style={{textAlign:"center",fontSize:".72rem",color:"rgba(255,255,255,.3)",lineHeight:1.5}}>
          Cada membro tem um código único.<br/>Peça ao admin caso esqueça o seu.
        </div>
      </div>
      {toast&&<div className="toast">{toast}</div>}
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────────────────────────
function ProfilePage({currentUser, members, books, ratings, reviews, suggestions, setPage, showToast, viewedMember: externalMember}) {
  const [editModal, setEditModal] = useState(false);
  const [browsedMember, setBrowsedMember] = useState(null);

  // priority: browsed > external (from admin panel) > own
  const member = browsedMember || externalMember || currentUser;
  const isOwnProfile = member.id === currentUser.id;

  const myBooks        = books.filter(b => b.suggestedBy === member.id);
  const myRatings      = ratings.filter(r => r.userId === member.id);
  const myReviews      = (reviews||[]).filter(r => r.userId === member.id);
  const avgGiven       = myRatings.length ? (myRatings.reduce((s,r)=>s+r.value,0)/myRatings.length).toFixed(1) : null;
  const eliminatedByMe = suggestions.filter(s => s.elimBy === member.id && s.eliminated);

  const saveProfile = async (updated) => {
    await FS.set("members", updated.id, updated);
    showToast("Perfil atualizado! ✅");
    setEditModal(false);
  };

  const color = member.color || "#FF3F8E";

  return (
    <div>
      {/* Member selector strip — always visible, highlights current */}
      {!externalMember && (
        <div style={{display:"flex",gap:".5rem",overflowX:"auto",paddingBottom:".5rem",marginBottom:"1rem",scrollbarWidth:"none"}}>
          {members.filter(m=>m.id!=="adm").map(m=>(
            <div key={m.id}
              onClick={()=>setBrowsedMember(m.id===currentUser.id?null:m)}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",minWidth:52,opacity:member.id===m.id?1:.5,transition:"opacity .15s"}}
            >
              <div style={{borderRadius:"50%",padding:2,border:`2.5px solid ${member.id===m.id?m.color||"var(--pink)":"transparent"}`,transition:"border .15s"}}>
                <MemberAvatar member={m} size={40}/>
              </div>
              <span style={{fontSize:".6rem",fontWeight:800,textAlign:"center",maxWidth:52,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Back button when coming from external (admin panel) */}
      {externalMember && !isOwnProfile && (
        <button className="btn btn-ghost btn-sm" style={{marginBottom:"1rem"}} onClick={()=>{}}>
          ← {externalMember.name}
        </button>
      )}

      {/* Profile Card */}
      <div className="card no-hover" style={{marginBottom:"1rem",padding:0,overflow:"hidden"}}>
        <div className="profile-cover" style={{background:`linear-gradient(135deg,${color},${color}99)`}}>
          <div style={{fontFamily:"var(--fd)",fontSize:"4rem",letterSpacing:"4px",color:"rgba(255,255,255,.2)"}}>
            {getInitials(member.name)}
          </div>
          <div className="profile-avatar-wrap">
            <MemberAvatar member={member} size={72}/>
          </div>
        </div>
        <div style={{padding:"1.2rem",marginTop:"2rem"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
            <div>
              <div style={{fontFamily:"var(--fd)",fontSize:"1.8rem",letterSpacing:"3px"}}>{member.name.toUpperCase()}</div>
              <div style={{display:"flex",gap:".5rem",marginTop:".4rem",flexWrap:"wrap"}}>
                <span className={`gender-badge ${member.gender==="f"?"gender-f":"gender-m"}`}>{member.gender==="f"?"Leitora":"Leitor"}</span>
                {member.isAdmin&&<span className="tag tag-yellow">👑 Admin</span>}
                {/* Código: visível apenas no próprio perfil ou para admin */}
                {(isOwnProfile || currentUser.isAdmin) && (
                  <span className="tag tag-navy" style={{fontFamily:"var(--fd)",letterSpacing:"1px",fontSize:".65rem"}}>🔐 {member.code}</span>
                )}
              </div>
            </div>
            {isOwnProfile && (
              <button className="btn btn-ghost btn-sm" onClick={()=>setEditModal(true)}>✏️ Editar</button>
            )}
          </div>

          <div className="divider"/>

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:".4rem",textAlign:"center"}}>
            {[
              ["📚", myBooks.length,        "Sugeridos"],
              ["❌", eliminatedByMe.length,  "Eliminados"],
              ["⭐", myRatings.length,       "Votos"],
              ["✍️", myReviews.length,       "Reviews"],
            ].map(([ico,val,lbl])=>(
              <div key={lbl} style={{background:`${color}18`,borderRadius:12,padding:".65rem .3rem",border:`1.5px solid ${color}30`}}>
                <div style={{fontSize:"1rem",marginBottom:2}}>{ico}</div>
                <div style={{fontFamily:"var(--fd)",fontSize:"1.4rem",letterSpacing:"1px",color}}>{val}</div>
                <div style={{fontSize:".58rem",fontWeight:800,color:"rgba(26,26,46,.45)"}}>{lbl}</div>
              </div>
            ))}
          </div>

          {avgGiven && (
            <div style={{marginTop:".75rem",padding:".7rem 1rem",background:"rgba(255,214,0,.1)",borderRadius:10,border:"1.5px solid rgba(255,214,0,.3)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:".82rem",fontWeight:700}}>Nota média que dá</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{color:"var(--yellow)",fontSize:".9rem"}}>{starsFrom(parseFloat(avgGiven))}</span>
                <span style={{fontFamily:"var(--fd)",fontSize:"1.4rem",color:"var(--pink)",letterSpacing:"2px"}}>{avgGiven}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Livros sugeridos */}
      {myBooks.length > 0 && (
        <>
          <div className="section-header" style={{marginTop:".5rem"}}>
            <div className="section-title">📚 LIVROS SUGERIDOS</div>
            <span className="badge badge-navy">{myBooks.length}</span>
          </div>
          {myBooks.map(b => (
            <ProfileBookRow key={b.id} book={b} color={color} ratings={ratings}/>
          ))}
        </>
      )}

      {/* Livros eliminados */}
      {eliminatedByMe.length > 0 && (
        <>
          <div className="section-header" style={{marginTop:".5rem"}}>
            <div className="section-title">❌ LIVROS ELIMINADOS</div>
            <span className="badge badge-pink">{eliminatedByMe.length}</span>
          </div>
          {eliminatedByMe.map(s => (
            <div key={s.id} style={{display:"flex",gap:".75rem",alignItems:"center",padding:".75rem",background:"white",borderRadius:12,marginBottom:".5rem",border:"1.5px solid rgba(232,39,42,.12)",opacity:.8}}>
              {s.cover
                ? <img src={s.cover} alt="" style={{width:36,height:52,borderRadius:6,objectFit:"cover",flexShrink:0}}/>
                : <div style={{width:36,height:52,borderRadius:6,background:"linear-gradient(135deg,#E8272A,#FF6B2B)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".9rem",flexShrink:0}}>📖</div>
              }
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"var(--fs)",fontWeight:700,fontSize:".85rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",textDecoration:"line-through",color:"rgba(26,26,46,.5)"}}>{s.title}</div>
                {s.author && <div style={{fontSize:".72rem",color:"var(--blue)",fontWeight:600}}>{s.author}</div>}
                {s.month && <span className="tag tag-yellow" style={{marginTop:3,display:"inline-block"}}>{formatMonthYear(s.month)}</span>}
              </div>
              <span className="tag tag-red">❌ {s.elimType==="vote"?"Votação":"Individual"}</span>
            </div>
          ))}
        </>
      )}

      {myBooks.length === 0 && eliminatedByMe.length === 0 && (
        <div className="empty" style={{paddingTop:"1.5rem"}}>
          <div className="ico">📖</div>
          <div className="ttl">SEM REGISTROS</div>
          <div className="txt">Ainda não participou de nenhum sorteio.</div>
        </div>
      )}

      {editModal && <MemberFormModal member={currentUser} onClose={()=>setEditModal(false)} onSave={saveProfile}/>}
    </div>
  );
}

function ProfileBookRow({book, color, ratings}) {
  const avg = getBookAvgFromRatings(book.id, ratings);
  return (
    <div style={{display:"flex",gap:".75rem",alignItems:"center",padding:".75rem",background:"white",borderRadius:12,marginBottom:".5rem",border:"1.5px solid rgba(26,26,46,.07)"}}>
      {book.cover
        ? <img src={book.cover} alt="" style={{width:40,height:58,borderRadius:6,objectFit:"cover",flexShrink:0}}/>
        : <div style={{width:40,height:58,borderRadius:6,background:`linear-gradient(135deg,${color},${color}88)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0}}>📖</div>
      }
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:"var(--fs)",fontWeight:700,fontSize:".88rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{book.title}</div>
        <div style={{fontSize:".75rem",color:"var(--blue)",fontWeight:600}}>{book.author}</div>
        {book.date && <span className="tag tag-yellow" style={{marginTop:3,display:"inline-block"}}>{formatMonthYear(book.date?.slice(0,7))}</span>}
      </div>
      {avg!==null && <div style={{fontFamily:"var(--fd)",fontSize:"1.4rem",color:"var(--pink)",letterSpacing:"1px",flexShrink:0}}>{fmtNota(avg)}</div>}
    </div>
  );
}

function getBookAvgFromRatings(bookId,ratings){
  const br=ratings.filter(r=>r.bookId===bookId);
  if(!br.length)return null;
  return br.reduce((s,r)=>s+r.value,0)/br.length;
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomePage({books,members,realMonthSugg,viewMonthSugg,ratings,progressComments,getBookAvg,realMonth,viewMonth,currentUser,rules,phase,setPage,isViewingCurrent,curElim,curVotes,canDo}) {
  const [progressText,setProgressText]=useState("");
  const [savingProgress,setSavingProgress]=useState(false);

  const thisYear=new Date().getFullYear().toString();
  const thisYearBooks=books.filter(b=>b.date?.startsWith(thisYear));
  const totalPages=books.reduce((s,b)=>s+(parseInt(b.pages)||0),0);
  const raffledBook=books.find(b=>b.date?.slice(0,7)===realMonth&&b.isRaffled);
  const prevBook=[...books].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).find(b=>b.date?.slice(0,7)!==realMonth);
  const pending=realMonthSugg.filter(s=>!s.eliminated&&!s.raffled);
  const monthProgress=(progressComments||[]).filter(c=>c.month===realMonth).sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||""));

  const hasSugg=realMonthSugg.length>0;
  const hasRaffled=!!raffledBook;
  const hasRating=books.some(b=>getBookAvg(b.id)!==null&&b.date?.slice(0,7)===realMonth);

  // ── Próxima ação: o que ESTE usuário precisa fazer agora, pra deixar o fluxo mais direto ──
  const mySuggCount=realMonthSugg.filter(s=>s.suggestedBy===currentUser.id).length;
  const myElim=curElim?.[currentUser.id];
  const myVotes=curVotes?.[currentUser.id]||[];
  let nextAction=null;
  if(isViewingCurrent){
    if(phase==="suggest"&&mySuggCount===0&&canDo(currentUser.id,"suggest"))
      nextAction={ico:"💡",text:"Sua vez de sugerir um livro este mês.",cta:"SUGERIR",page:"suggest"};
    else if(phase==="vote"&&!myElim&&canDo(currentUser.id,"elim"))
      nextAction={ico:"❌",text:"Elimine 1 livro da lista deste mês.",cta:"ELIMINAR",page:"elim"};
    else if(phase==="vote"&&myVotes.length===0&&canDo(currentUser.id,"vote"))
      nextAction={ico:"🗳️",text:"Vote na eliminação coletiva do mês.",cta:"VOTAR",page:"elim"};
    else if(phase==="raffle"&&!hasRaffled)
      nextAction={ico:"🎲",text:"Eliminações concluídas — falta sortear o livro do mês!",cta:"SORTEAR",page:"elim"};
  }

  const getNextMeeting=()=>{
    if(!rules.meetingDay)return null;
    const dayNames=["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
    const targetDay=dayNames.indexOf(rules.meetingDay.toLowerCase());
    if(targetDay<0)return null;
    const now=new Date();
    const diff=(targetDay-now.getDay()+7)%7||7;
    const next=new Date(now);next.setDate(now.getDate()+diff);return next;
  };
  const nextMeeting=getNextMeeting();
  const daysUntil=nextMeeting?Math.ceil((nextMeeting-new Date())/(1000*60*60*24)):null;

  const addProgress=async()=>{
    if(!progressText.trim())return;
    setSavingProgress(true);
    await FS.set("progressComments",uid(),{text:progressText.trim(),userId:currentUser.id,month:realMonth,createdAt:new Date().toISOString()});
    setProgressText("");setSavingProgress(false);showToast("Progresso registrado! 📖");
  };
  function showToast(){}// placeholder, passed via props in real use

  return(
    <div>
      <div className="page-title">OLÁ, <span className="hi">{currentUser.name.split(" ")[0].toUpperCase()}</span>!</div>
      <div className="page-sub">{currentUser.gender==="f"?"Bem-vinda":"Bem-vindo"}, {currentUser.gender==="f"?"Leitora":"Leitor"} ✨</div>

      <div className="ticker-wrap">
        <div className="ticker">
          {["📚 LIVRE DO CLUBO","💡 SUGESTÕES ABERTAS","🎲 SORTEIO EM BREVE","⭐ AVALIE O LIVRO","📅 PRÓXIMO ENCONTRO","📚 LIVRE DO CLUBO","💡 SUGESTÕES ABERTAS","🎲 SORTEIO EM BREVE","⭐ AVALIE O LIVRO","📅 PRÓXIMO ENCONTRO"].map((t,i)=>(
            <span key={i} className="ticker-item">• {t} </span>
          ))}
        </div>
      </div>

      <div className="flow-bar">
        {[
          {label:"SUGESTÃO",done:hasSugg,active:phase==="suggest"},
          {label:"ELIMINAÇÃO",done:phase==="raffle"||phase==="reading"||phase==="done",active:phase==="vote"},
          {label:"SORTEIO",done:hasRaffled,active:phase==="raffle"},
          {label:"LEITURA",done:hasRating,active:phase==="reading"},
          {label:"AVALIAÇÃO",done:phase==="done",active:hasRating&&phase!=="done"},
        ].map((s,i,arr)=>(
          <span key={s.label} style={{display:"flex",alignItems:"center"}}>
            <div className={`flow-step${s.active?" active":s.done?" done":""}`}>{s.done?"✓ ":""}{s.label}</div>
            {i<arr.length-1&&<div className="flow-arrow">›</div>}
          </span>
        ))}
      </div>

      <div className="stats-grid">
        <div className="stat-card block-pink"><div className="stat-num" style={{color:"white"}}>{books.length}</div><div className="stat-label" style={{color:"rgba(255,255,255,.75)"}}>Lidos</div></div>
        <div className="stat-card block-yellow"><div className="stat-num">{thisYearBooks.length}</div><div className="stat-label">{thisYear}</div></div>
        <div className="stat-card block-green"><div className="stat-num" style={{color:"white"}}>{totalPages>999?(totalPages/1000).toFixed(1)+"k":totalPages}</div><div className="stat-label" style={{color:"rgba(255,255,255,.75)"}}>Páginas</div></div>
        <div className="stat-card block-blue"><div className="stat-num" style={{color:"white"}}>{realMonthSugg.length}</div><div className="stat-label" style={{color:"rgba(255,255,255,.75)"}}>Sugest.</div></div>
      </div>

      {nextAction&&(
        <div className="card c-pink no-hover" style={{marginBottom:"1rem",display:"flex",alignItems:"center",gap:".85rem"}} onClick={()=>setPage(nextAction.page)}>
          <div style={{fontSize:"1.7rem"}}>{nextAction.ico}</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"var(--fd)",fontSize:".7rem",letterSpacing:"2px",color:"var(--pink)"}}>SUA VEZ</div>
            <div style={{fontSize:".85rem",fontWeight:700}}>{nextAction.text}</div>
          </div>
          <button className="btn btn-pink btn-sm">{nextAction.cta}</button>
        </div>
      )}

      {daysUntil!==null&&(
        <div className="block-card block-navy" style={{marginBottom:"1rem",display:"flex",alignItems:"center",gap:"1rem"}}>
          <div style={{fontSize:"2.2rem"}}>📅</div>
          <div>
            <div style={{fontFamily:"var(--fd)",fontSize:".85rem",letterSpacing:"2px",color:"rgba(255,255,255,.5)",marginBottom:2}}>PRÓXIMO ENCONTRO</div>
            <div style={{fontFamily:"var(--fd)",fontSize:"1.3rem",letterSpacing:"2px",color:"var(--yellow)"}}>
              {daysUntil===0?"HOJE!":daysUntil===1?"AMANHÃ!":`EM ${daysUntil} DIAS`}
            </div>
            {rules.meetingLocal&&<div style={{fontSize:".75rem",color:"rgba(255,255,255,.5)",marginTop:2}}>📍 {rules.meetingLocal}</div>}
          </div>
        </div>
      )}

      {rules.hasTheme&&(
        <div className="card c-yellow no-hover card-stripe cs-yellow" style={{marginBottom:"1rem"}}>
          <div style={{fontFamily:"var(--fd)",fontSize:".8rem",letterSpacing:"2px",color:"#7A5800",marginBottom:".3rem"}}>TEMA DO MÊS</div>
          <div style={{fontFamily:"var(--fd)",fontSize:"1.8rem",letterSpacing:"3px"}}>{rules.theme||"—"}</div>
        </div>
      )}

      {raffledBook?(
        <div style={{marginBottom:"1.5rem"}}>
          <div className="section-header"><div className="section-title">📖 LIVRO DO MÊS</div></div>
          <div className="card c-pink no-hover card-stripe cs-pink">
            <div style={{display:"flex",gap:"1rem",alignItems:"flex-start",marginBottom:"1rem"}}>
              {raffledBook.cover?<img src={raffledBook.cover} className="book-cover" alt=""/>:<div className="book-cover-ph" style={{background:"linear-gradient(135deg,var(--pink),var(--red))"}}>📖</div>}
              <div style={{flex:1,minWidth:0}}>
                <div className="book-title">{raffledBook.title}</div>
                <div className="book-author">{raffledBook.author}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4,margin:".35rem 0"}}>
                  {raffledBook.theme&&<span className="tag tag-pink">#{raffledBook.theme}</span>}
                  {raffledBook.pages&&<span className="tag tag-blue">📄{raffledBook.pages}p</span>}
                </div>
                {getBookAvg(raffledBook.id)!==null&&<div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:"var(--yellow)",fontSize:".85rem"}}>{starsFrom(getBookAvg(raffledBook.id))}</span><span style={{fontFamily:"var(--fd)",fontSize:"1.4rem",color:"var(--pink)",letterSpacing:"2px"}}>{fmtNota(getBookAvg(raffledBook.id))}</span></div>}
              </div>
            </div>
            <div style={{fontFamily:"var(--fd)",fontSize:".75rem",letterSpacing:"2px",color:"rgba(26,26,46,.5)",marginBottom:".6rem"}}>PROGRESSO DO GRUPO</div>
            {monthProgress.length===0&&<div style={{fontSize:".8rem",color:"rgba(26,26,46,.4)",fontWeight:600,marginBottom:".7rem"}}>Ninguém postou ainda. Seja o primeiro! 📖</div>}
            {monthProgress.slice(0,5).map(c=>{
              const u=members.find(m=>m.id===c.userId);
              return(
                <div key={c.id} style={{background:"white",borderRadius:12,padding:".8rem",marginBottom:".45rem",border:"1.5px solid rgba(26,26,46,.07)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:".5rem",marginBottom:".3rem"}}>
                    <MemberAvatar member={u} size={24}/>
                    <span style={{fontWeight:800,fontSize:".78rem"}}>{u?.name||"?"}</span>
                    <span style={{fontSize:".68rem",color:"rgba(26,26,46,.35)",marginLeft:"auto"}}>{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <div style={{fontSize:".83rem",lineHeight:1.5}}>{c.text}</div>
                </div>
              );
            })}
            <div style={{display:"flex",gap:".5rem",marginTop:".65rem"}}>
              <input className="form-input" placeholder="Em que página você está? 📖" value={progressText} onChange={e=>setProgressText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addProgress()} style={{flex:1}}/>
              <button className="btn btn-pink btn-sm" onClick={addProgress} disabled={savingProgress||!progressText.trim()}>Postar</button>
            </div>
          </div>
        </div>
      ):prevBook&&(
        <div style={{marginBottom:"1.5rem"}}>
          <div className="section-header"><div className="section-title">📖 ÚLTIMA LEITURA</div></div>
          <div className="card no-hover card-stripe cs-yellow">
            <div style={{display:"flex",gap:"1rem",alignItems:"flex-start"}}>
              {prevBook.cover?<img src={prevBook.cover} className="book-cover" alt=""/>:<div className="book-cover-ph" style={{background:"linear-gradient(135deg,var(--yellow),var(--orange))"}}>📖</div>}
              <div style={{flex:1,minWidth:0}}>
                <div className="book-title">{prevBook.title}</div>
                <div className="book-author">{prevBook.author}</div>
                {getBookAvg(prevBook.id)!==null&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}><span style={{color:"var(--yellow)"}}>{starsFrom(getBookAvg(prevBook.id))}</span><span style={{fontFamily:"var(--fd)",fontSize:"1.4rem",color:"var(--pink)",letterSpacing:"2px"}}>{fmtNota(getBookAvg(prevBook.id))}</span></div>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="section-header"><div className="section-title">MEMBROS</div><span className="badge badge-navy">{members.filter(m=>m.id!=="adm").length}</span></div>
      <div style={{display:"flex",gap:".65rem",overflowX:"auto",paddingBottom:".5rem",scrollbarWidth:"none"}}>
        {members.filter(m=>m.id!=="adm").map(m=>(
          <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,minWidth:56}}>
            <MemberAvatar member={m} size={46}/>
            <span style={{fontSize:".62rem",fontWeight:800,textAlign:"center",maxWidth:56,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SUGGEST ──────────────────────────────────────────────────────────────────
function SuggestPage({suggestions,books,members,currentUser,realMonth,viewMonth,rules,setRules,phase,canDo,showToast,isViewingCurrent,isViewingFuture,viewMonthSugg,realMonthSugg,powerCycle,config,themeOffers,viewRules,setViewRules,viewPowerCycle}) {
  const [tab,setTab]=useState("add");
  const [form,setForm]=useState({title:"",author:"",theme:"",pages:"",link:"",suggestedBy:currentUser.id});
  const [coverFile,setCoverFile]=useState("");
  const [saving,setSaving]=useState(false);
  const [themeInput,setThemeInput]=useState("");
  const [savingTheme,setSavingTheme]=useState(false);
  const [viewThemeInput,setViewThemeInput]=useState("");
  const [savingViewTheme,setSavingViewTheme]=useState(false);
  const fileRef=useRef();
  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));

  // Mês pro qual a sugestão é salva: o mês real, exceto quando se está planejando o mês seguinte com antecedência
  const targetMonth=isViewingFuture?viewMonth:realMonth;
  const targetMonthSugg=isViewingFuture?viewMonthSugg:realMonthSugg;
  const activeRules=isViewingFuture?viewRules:rules;
  const mySuggCount=targetMonthSugg.filter(s=>s.suggestedBy===currentUser.id).length;

  // Bloqueio de mês livre: quem já teve livro sorteado em mês livre neste ciclo não sugere de novo em mês livre
  const myFreeWin=(!activeRules.hasTheme)?books.find(b=>b.suggestedBy===currentUser.id&&b.wasThemed===false&&b.date&&cycleIndexFor(b.date.slice(0,7),config.powerCycleStart)===(isViewingFuture?viewPowerCycle:powerCycle)):null;
  const freeMonthBlocked=!currentUser.isAdmin&&!!myFreeWin;

  // Admin pode sempre sugerir (canDo retorna true para admin); outros seguem regras normais.
  // Pro mês seguinte (planejamento com antecedência) não existe fase ainda, então só valem limite e bloqueio de mês livre.
  const canSuggest=(isViewingFuture?true:canDo(currentUser.id,"suggest"))&&mySuggCount<activeRules.suggLimit&&!freeMonthBlocked;
  const pageWarn=form.pages?checkPageLimit(parseInt(form.pages),targetMonth):null;

  // Tema do mês — 1 pessoa por ciclo de 14 meses pode oferecer 1 tema (mesmo ciclo dos poderes)
  const myThemeUse=themeOffers.find(t=>t.memberId===currentUser.id&&t.cycle===powerCycle);
  const canOfferTheme=currentUser.id!=="adm"&&!myThemeUse&&!rules.theme;
  const themeOfferedBy=members.find(m=>m.id===rules.themeBy);
  const offerTheme=async()=>{
    if(!themeInput.trim())return;
    setSavingTheme(true);
    await setRules({...rules,theme:themeInput.trim(),themeBy:currentUser.id});
    await FS.set("themeOffers",`${currentUser.id}_${powerCycle}`,{memberId:currentUser.id,cycle:powerCycle,month:realMonth,theme:themeInput.trim(),ts:new Date().toISOString()});
    setSavingTheme(false);setThemeInput("");showToast("🏷️ Tema oferecido!");
  };

  // Tema do mês seguinte (planejado com antecedência, via seletor de mês no cabeçalho)
  const myViewThemeUse=themeOffers.find(t=>t.memberId===currentUser.id&&t.cycle===viewPowerCycle);
  const canOfferViewTheme=currentUser.id!=="adm"&&!myViewThemeUse&&!viewRules.theme;
  const viewThemeOfferedBy=members.find(m=>m.id===viewRules.themeBy);
  const offerViewTheme=async()=>{
    if(!viewThemeInput.trim())return;
    setSavingViewTheme(true);
    await setViewRules({...viewRules,theme:viewThemeInput.trim(),themeBy:currentUser.id});
    await FS.set("themeOffers",`${currentUser.id}_${viewPowerCycle}`,{memberId:currentUser.id,cycle:viewPowerCycle,month:viewMonth,theme:viewThemeInput.trim(),ts:new Date().toISOString()});
    setSavingViewTheme(false);setViewThemeInput("");showToast(`🏷️ Tema de ${formatMonthYear(viewMonth)} oferecido!`);
  };

  // Bot: só avisa sobre membros não-admin que não sugeriram
  const normalMembers=members.filter(m=>m.id!=="adm");
  const suggestedIds=[...new Set(realMonthSugg.map(s=>s.suggestedBy))];
  const notSuggested=normalMembers.filter(m=>!suggestedIds.includes(m.id));

  // Próxima data
  const getDaysUntilMeeting=()=>{
    if(!rules.meetingDay)return null;
    const dayNames=["domingo","segunda","terça","quarta","quinta","sexta","sábado"];
    const targetDay=dayNames.indexOf(rules.meetingDay.toLowerCase());
    if(targetDay<0)return null;
    const now=new Date();
    const diff=(targetDay-now.getDay()+7)%7||7;
    return diff;
  };
  const daysUntil=getDaysUntilMeeting();

  const generateBotMsg=(type)=>{
    if(type==="suggest"){
      if(notSuggested.length===0)return"✅ Todas já sugeriram! Hora de sortear 🎲";
      const names=notSuggested.map(m=>m.name).join(", ");
      return`📚 *Livre do Clubo — ${formatMonthYear(realMonth)}*\n\n⏰ Hora de sugerir seu livro do mês!\n\nAinda não sugeriram: *${names}*\n\nAbre o app e manda sua sugestão! 💡\nhttps://clube-do-livro-df494.web.app`;
    }
    if(type==="meeting"){
      return`📅 *Livre do Clubo — Encontro se aproximando!*\n\n${daysUntil===1?"Amanhã é nosso encontro! 🎉":`Faltam ${daysUntil} dias para o nosso encontro!`}\n\n${rules.meetingLocal?`📍 Local: ${rules.meetingLocal}\n`:""}${rules.meetingTime?`🕐 Horário: ${rules.meetingTime}\n`:""}\nNão esquece de terminar o livro! 📖`;
    }
    return"";
  };

  const copyBot=(type)=>{
    const msg=generateBotMsg(type);
    navigator.clipboard?.writeText(msg).then(()=>showToast("Copiado! Cole no WhatsApp 📱"));
  };

  const handleFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setCoverFile(ev.target.result);r.readAsDataURL(f);};

  const handleAdd=async()=>{
    if(!form.title.trim())return showToast("Informe o título 📖");
    if(!canSuggest)return showToast(mySuggCount>=activeRules.suggLimit?`Limite de ${activeRules.suggLimit} sugestão(ões)!`:"Sugestões desabilitadas para você.");
    const dup=books.find(b=>b.title.trim().toLowerCase()===form.title.trim().toLowerCase());
    if(dup)return showToast(`"${form.title}" já foi lido! ⚠️`);
    const dupS=targetMonthSugg.find(s=>s.title.trim().toLowerCase()===form.title.trim().toLowerCase());
    if(dupS)return showToast("Esse livro já foi sugerido este mês!");
    setSaving(true);
    const id=uid();
    await FS.set("suggestions",id,{id,...form,cover:coverFile,month:targetMonth,addedAt:new Date().toISOString(),eliminated:false,raffled:false});
    setForm({title:"",author:"",theme:"",pages:"",link:"",suggestedBy:currentUser.id});
    setCoverFile("");
    showToast(pageWarn?pageWarn:`Sugestão adicionada para ${formatMonthYear(targetMonth)}! 💡`);
    setTab("list");setSaving(false);
  };

  const handleDelete=async(id)=>{
    const s=suggestions.find(s=>s.id===id);
    if(!s)return;
    if(s.suggestedBy!==currentUser.id&&!currentUser.isAdmin)return showToast("Só você pode remover sua sugestão!");
    await FS.del("suggestions",id);showToast("Sugestão removida.");
  };

  const addFromHistory=async(book)=>{
    const dupS=targetMonthSugg.find(s=>s.title.trim().toLowerCase()===book.title.trim().toLowerCase());
    if(dupS)return showToast("Esse livro já está nas sugestões!");
    if(!canSuggest)return showToast("Você não pode mais sugerir este mês.");
    const id=uid();
    await FS.set("suggestions",id,{id,title:book.title,author:book.author,theme:book.theme,pages:book.pages,cover:book.cover||"",link:book.link||"",suggestedBy:currentUser.id,month:targetMonth,addedAt:new Date().toISOString(),eliminated:false,raffled:false,fromHistory:true});
    showToast(`Adicionado em ${formatMonthYear(targetMonth)}! 📚`);setTab("list");
  };

  // histórico: todas as sugestões não lidas (não estão nos livros)
  const readTitles=new Set(books.map(b=>b.title.trim().toLowerCase()));
  const historyAll=[...new Set(suggestions.map(s=>s.title))].filter(t=>!readTitles.has(t.trim().toLowerCase())).map(t=>suggestions.find(s=>s.title===t)).filter(Boolean);
  const displaySugg=isViewingCurrent?realMonthSugg:viewMonthSugg;

  return(
    <div>
      <div className="page-title">SUGES<span className="hi">TÕES</span></div>
      <div className="page-sub">Proponha o próximo livro do clube 💡</div>

      {/* Bot cards */}
      <div style={{display:"grid",gap:".6rem",marginBottom:"1rem"}}>
        <div className="card c-orange no-hover card-stripe cs-orange">
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".5rem"}}>
            <div style={{fontFamily:"var(--fd)",fontSize:".85rem",letterSpacing:"2px"}}>🤖 BOT: SUGESTÕES</div>
            <span className="badge badge-pink">{notSuggested.length} faltando</span>
          </div>
          <div style={{fontSize:".78rem",color:"rgba(26,26,46,.6)",marginBottom:".6rem"}}>
            {notSuggested.length===0?"✅ Todos sugeriram!":notSuggested.map(m=>m.name).join(", ")+" ainda não sugeriram."}
          </div>
          <button className="btn btn-orange btn-sm btn-full" onClick={()=>copyBot("suggest")}>📋 Copiar mensagem WhatsApp</button>
        </div>
        {daysUntil!==null&&daysUntil<=5&&(
          <div className="card c-red no-hover card-stripe cs-red">
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".5rem"}}>
              <div style={{fontFamily:"var(--fd)",fontSize:".85rem",letterSpacing:"2px"}}>📅 BOT: ENCONTRO</div>
              <span className="badge badge-yellow">{daysUntil===1?"AMANHÃ":`${daysUntil} DIAS`}</span>
            </div>
            <div style={{fontSize:".78rem",color:"rgba(26,26,46,.6)",marginBottom:".6rem"}}>
              {daysUntil===1?"O encontro é amanhã!":daysUntil===0?"O encontro é HOJE! 🎉":`Faltam ${daysUntil} dias para o encontro.`}
              {rules.meetingLocal&&` Local: ${rules.meetingLocal}.`}
            </div>
            <button className="btn btn-red btn-sm btn-full" onClick={()=>copyBot("meeting")}>📋 Copiar lembrete WhatsApp</button>
          </div>
        )}
      </div>

      {phase==="vote"&&<div className="alert alert-info">🗳️ Fase de votação em andamento. Vá para Eliminação.</div>}

      {rules.hasTheme&&(
        <div className="card c-purple no-hover" style={{marginBottom:"1rem"}}>
          <div style={{fontFamily:"var(--fd)",fontSize:".8rem",letterSpacing:"2px",color:"var(--purple)",marginBottom:".4rem"}}>🏷️ TEMA DO MÊS</div>
          {rules.theme?(
            <div style={{fontSize:".85rem",fontWeight:700}}>{rules.theme}{themeOfferedBy&&<span style={{color:"rgba(26,26,46,.45)",fontWeight:600}}> — oferecido por {themeOfferedBy.name}</span>}</div>
          ):canOfferTheme?(
            <>
              <div style={{fontSize:".78rem",color:"rgba(26,26,46,.55)",fontWeight:600,marginBottom:".5rem"}}>Este mês tem tema, mas ainda não foi definido. Você pode oferecer 1 tema por ciclo de 14 meses.</div>
              <div style={{display:"flex",gap:".5rem"}}>
                <input className="form-input" placeholder="Ex: literatura latino-americana" value={themeInput} onChange={e=>setThemeInput(e.target.value)}/>
                <button className="btn btn-pink btn-sm" disabled={!themeInput.trim()||savingTheme} onClick={offerTheme}>{savingTheme?"...":"Oferecer"}</button>
              </div>
            </>
          ):currentUser.id!=="adm"?(
            <div style={{fontSize:".78rem",color:"rgba(26,26,46,.5)",fontWeight:600}}>Você já ofereceu um tema neste ciclo. Aguardando outra pessoa definir o tema deste mês.</div>
          ):(
            <div style={{fontSize:".78rem",color:"rgba(26,26,46,.5)",fontWeight:600}}>Aguardando algum membro oferecer o tema deste mês (ou defina em Painel → Regras).</div>
          )}
        </div>
      )}

      {isViewingFuture&&(
        <div className="card c-purple no-hover" style={{marginBottom:"1rem",border:"2px dashed var(--purple)"}}>
          <div style={{fontFamily:"var(--fd)",fontSize:".8rem",letterSpacing:"2px",color:"var(--purple)",marginBottom:".4rem"}}>🔮 TEMA DE {formatMonthYear(viewMonth).toUpperCase()}</div>
          {!viewRules.hasTheme?(
            <div style={{fontSize:".78rem",color:"rgba(26,26,46,.5)",fontWeight:600}}>Este mês ainda não tem tema obrigatório ativado. Ative em Painel → Regras (visualizando este mês) para poder planejar o tema com antecedência.</div>
          ):viewRules.theme?(
            <div style={{fontSize:".85rem",fontWeight:700}}>{viewRules.theme}{viewThemeOfferedBy&&<span style={{color:"rgba(26,26,46,.45)",fontWeight:600}}> — oferecido por {viewThemeOfferedBy.name}</span>}</div>
          ):canOfferViewTheme?(
            <>
              <div style={{fontSize:".78rem",color:"rgba(26,26,46,.55)",fontWeight:600,marginBottom:".5rem"}}>Você pode oferecer o tema deste mês futuro com antecedência (1 tema por ciclo de 14 meses).</div>
              <div style={{display:"flex",gap:".5rem"}}>
                <input className="form-input" placeholder="Ex: literatura latino-americana" value={viewThemeInput} onChange={e=>setViewThemeInput(e.target.value)}/>
                <button className="btn btn-pink btn-sm" disabled={!viewThemeInput.trim()||savingViewTheme} onClick={offerViewTheme}>{savingViewTheme?"...":"Oferecer"}</button>
              </div>
            </>
          ):currentUser.id!=="adm"?(
            <div style={{fontSize:".78rem",color:"rgba(26,26,46,.5)",fontWeight:600}}>Você já ofereceu um tema neste ciclo. Aguardando outra pessoa definir o tema deste mês.</div>
          ):(
            <div style={{fontSize:".78rem",color:"rgba(26,26,46,.5)",fontWeight:600}}>Aguardando algum membro oferecer o tema deste mês (ou defina em Painel → Regras).</div>
          )}
        </div>
      )}

      {freeMonthBlocked&&(
        <div className="alert alert-warn" style={{marginBottom:"1rem"}}>
          🚫 Você já teve <strong>"{myFreeWin.title}"</strong> sorteado em mês livre neste ciclo ({formatMonthShort(myFreeWin.date?.slice(0,7))}). Em meses livres, você só pode sugerir de novo no próximo ciclo (14 meses). Isso não afeta meses com tema.
        </div>
      )}

      <div className="tab-bar">
        <button className={`tab-btn${tab==="add"?" active":""}`} onClick={()=>setTab("add")}>+ SUGERIR</button>
        <button className={`tab-btn${tab==="list"?" active":""}`} onClick={()=>setTab("list")}>MÊS <span className="badge badge-pink" style={{marginLeft:3}}>{displaySugg.length}</span></button>
        <button className={`tab-btn${tab==="history"?" active":""}`} onClick={()=>setTab("history")}>NÃO LIDOS</button>
      </div>

      {tab==="add"&&(
        <div className="card c-green no-hover card-stripe cs-green" style={{position:"relative"}}>
          {isViewingFuture&&(
            <div className="alert alert-info" style={{marginBottom:".85rem"}}>🔮 Sugerindo para <strong>{formatMonthYear(targetMonth)}</strong> (mês seguinte).</div>
          )}
          {!canSuggest&&(
            <div className="locked-overlay">
              <div className="lock-ico">🔒</div>
              <div className="lock-txt">
                {!isViewingFuture&&phase!=="suggest"&&!currentUser.isAdmin
                  ?"Fase de sugestões encerrada"
                  :freeMonthBlocked
                  ?"Bloqueado(a) em mês livre neste ciclo"
                  :`Limite de ${activeRules.suggLimit} sugestão(ões) atingido`}
              </div>
            </div>
          )}
          {pageWarn&&<div className="alert alert-warn">{pageWarn}</div>}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
            <div style={{fontFamily:"var(--fd)",fontSize:"1.1rem",letterSpacing:"2px"}}>NOVO LIVRO</div>
            <div className="tag tag-green">{mySuggCount}/{activeRules.suggLimit} usadas</div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">SUGESTÃO DE</label>
              <select className="form-select" value={form.suggestedBy} onChange={e=>setF("suggestedBy",e.target.value)}>
                {dedupeMembers(members).map(m=><option key={m.id} value={m.id}>{m.name}{m.isAdmin?" 👑":""}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">PÁGINAS</label><input className="form-input" type="number" placeholder="350" value={form.pages} onChange={e=>setF("pages",e.target.value)}/></div>
          </div>
          <div className="form-group"><label className="form-label">TÍTULO *</label><input className="form-input" placeholder="Nome do livro" value={form.title} onChange={e=>setF("title",e.target.value)}/></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">AUTOR</label><input className="form-input" placeholder="Autor/a" value={form.author} onChange={e=>setF("author",e.target.value)}/></div>
            <div className="form-group"><label className="form-label">TEMA</label><input className="form-input" placeholder={activeRules.hasTheme?activeRules.theme:"Ex: romance"} value={form.theme} onChange={e=>setF("theme",e.target.value)}/></div>
          </div>
          <div className="form-group"><label className="form-label">LINK EXTERNO</label><input className="form-input" placeholder="https://..." value={form.link} onChange={e=>setF("link",e.target.value)}/></div>
          <div className="form-group">
            <label className="form-label">CAPA (OPCIONAL)</label>
            <div className="upload-zone" onClick={()=>fileRef.current?.click()}>
              <input type="file" ref={fileRef} accept="image/*" onChange={handleFile} style={{display:"none"}}/>
              {coverFile?<img src={coverFile} alt="" style={{height:60,borderRadius:6,margin:"0 auto",display:"block"}}/>:<div style={{fontSize:".78rem",color:"rgba(26,26,46,.4)",fontWeight:700}}>📷 Clique para adicionar capa</div>}
            </div>
          </div>
          <button className="btn btn-green btn-full" onClick={handleAdd} disabled={!canSuggest||saving}>{saving?"Salvando...":"ADICIONAR SUGESTÃO 💡"}</button>
        </div>
      )}

      {tab==="list"&&(
        <div>
          {!isViewingCurrent&&<div className="alert alert-info">👁️ Visualizando sugestões de {formatMonthYear(viewMonth)}</div>}
          {displaySugg.length===0?<div className="empty"><div className="ico">💭</div><div className="ttl">SEM SUGESTÕES</div><div className="txt">Seja o primeiro a sugerir!</div></div>
          :displaySugg.map((s,i)=><SuggCard key={s.id} s={s} i={i} members={members} currentUser={currentUser} onDelete={(isViewingCurrent||isViewingFuture)?()=>handleDelete(s.id):null} books={books}/>)}
        </div>
      )}

      {tab==="history"&&(
        <div>
          <div className="page-sub" style={{marginBottom:".75rem"}}>Livros sugeridos que ainda não foram lidos ({historyAll.length})</div>
          {historyAll.length===0?<div className="empty"><div className="ico">📜</div><div className="ttl">NENHUM</div><div className="txt">Todos os sugeridos já foram lidos!</div></div>
          :historyAll.map((s,i)=><SuggCard key={s.id} s={s} i={i} members={members} currentUser={currentUser} onDelete={null} books={books} showMonth onAddToMonth={()=>addFromHistory(s)}/>)}
        </div>
      )}
    </div>
  );
}

function SuggCard({s,i,members,currentUser,onDelete,books,showMonth,onAddToMonth}) {
  const suggester=members.find(m=>m.id===s.suggestedBy);
  const alreadyRead=books.find(b=>b.title.trim().toLowerCase()===s.title.trim().toLowerCase());
  const warn=s.pages?checkPageLimit(parseInt(s.pages),s.month):null;
  return(
    <div className="card no-hover" style={{marginBottom:".6rem",opacity:s.eliminated?.5:1}}>
      <div style={{display:"flex",gap:".85rem",alignItems:"flex-start"}}>
        {s.cover?<img src={s.cover} className="book-cover" alt=""/>:<div className="book-cover-ph" style={{width:52,minWidth:52,height:76,fontSize:"1.1rem",background:"linear-gradient(135deg,var(--green),var(--teal))"}}>📖</div>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:".4rem"}}>
            <div>
              <div className="book-title" style={{fontSize:".9rem"}}>{s.title}</div>
              {s.author&&<div className="book-author" style={{fontSize:".75rem"}}>{s.author}</div>}
            </div>
            <div style={{fontFamily:"var(--fd)",fontSize:"1.6rem",color:"rgba(26,26,46,.08)",flexShrink:0,letterSpacing:"1px"}}>0{i+1}</div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,margin:".25rem 0"}}>
            {showMonth&&s.month&&<span className="tag tag-yellow">📅{formatMonthYear(s.month)}</span>}
            {s.theme&&<span className="tag tag-purple">#{s.theme}</span>}
            {s.pages&&<span className={`tag ${warn?"tag-red":"tag-blue"}`}>📄{s.pages}p</span>}
            {suggester&&<span className="tag tag-pink">👤{suggester.name}</span>}
            {s.eliminated&&<span className="tag tag-navy">❌ Eliminado</span>}
            {s.raffled&&<span className="tag tag-green">🎲 Sorteado</span>}
          </div>
          {warn&&!s.eliminated&&<div style={{fontSize:".7rem",color:"var(--orange)",fontWeight:700}}>{warn}</div>}
          {alreadyRead&&<div style={{fontSize:".7rem",color:"var(--red)",fontWeight:700}}>⚠️ Já lido em {formatMonthYear(alreadyRead.date?.slice(0,7))}</div>}
          {s.link&&<a href={s.link} target="_blank" rel="noreferrer" style={{fontSize:".7rem",color:"var(--blue)",fontWeight:700,textDecoration:"none"}}>🔗 Ver livro</a>}
        </div>
      </div>
      <div style={{display:"flex",gap:".4rem",flexWrap:"wrap",marginTop:".6rem"}}>
        {onAddToMonth&&!s.raffled&&<button className="btn btn-blue btn-sm" onClick={onAddToMonth}>+ Sugerir este mês</button>}
        {onDelete&&(s.suggestedBy===currentUser.id||currentUser.isAdmin)&&!s.eliminated&&!s.raffled&&<button className="btn btn-danger btn-sm" onClick={onDelete}>Remover</button>}
      </div>
    </div>
  );
}

// ─── ELIMINATION ──────────────────────────────────────────────────────────────
function EliminationPage({monthSugg,curVotes,setVotes,curElim,setElim,members,currentUser,books,realMonth,rules,phase,setPhase,canDo,showToast,voteCounts,powerUses,powerCycle,delegateDoc,perms}) {
  const [tab,setTab]=useState(()=>phase==="vote"?"vote":(phase==="raffle"||phase==="reading"||phase==="done")?"raffle":"indiv");
  const [raffleResult,setRaffleResult]=useState(null);
  const [spinning,setSpinning]=useState(false);
  const [saving,setSaving]=useState(false);

  const MIN_POOL=3;
  const active=monthSugg.filter(s=>!s.eliminated&&!s.raffled);
  const eliminated=monthSugg.filter(s=>s.eliminated);
  const myElim=curElim[currentUser.id];
  const myVotes=curVotes[currentUser.id]||[];
  const afterElim=monthSugg.filter(s=>!s.eliminated&&!s.raffled);
  const raffledBook=books.find(b=>b.date?.slice(0,7)===realMonth&&b.isRaffled);
  const showVoteDetails=phase==="raffle"||phase==="reading"||phase==="done"||currentUser.isAdmin;

  // Quem realmente precisa eliminar (respeita permissão individual do mês, não o bypass de admin-viewer)
  const eligibleElimMembers=members.filter(m=>m.id!=="adm"&&perms[m.id]?.canElim!==false);
  const missingElim=eligibleElimMembers.filter(m=>!curElim[m.id]);

  const handleIndivElim=async(sugId)=>{
    if(myElim&&!currentUser.isAdmin)return showToast("Você já eliminou um livro este mês!");
    if(!canDo(currentUser.id,"elim"))return showToast("Eliminação desabilitada.");
    setSaving(true);
    await FS.set("suggestions",sugId,{eliminated:true,elimType:"individual",elimBy:currentUser.id});
    await setElim({...curElim,[currentUser.id]:sugId});
    setSaving(false);showToast("Livro eliminado! ❌");
  };

  const undoIndivElim=async()=>{
    if(!currentUser.isAdmin)return showToast("Apenas admin pode desfazer!");
    const ne={...curElim};delete ne[currentUser.id];
    await FS.set("suggestions",myElim,{eliminated:false,elimType:null,elimBy:null});
    await setElim(ne);showToast("Eliminação desfeita.");
  };

  const toggleVote=async(sugId)=>{
    if(!canDo(currentUser.id,"vote"))return showToast("Votação desabilitada.");
    if(phase!=="vote"&&!currentUser.isAdmin)return showToast("Votação ainda não liberada!");
    const newVotes=myVotes.includes(sugId)?{...curVotes,[currentUser.id]:myVotes.filter(v=>v!==sugId)}:(myVotes.length>=(rules.maxElimVotes||2)?null:{...curVotes,[currentUser.id]:[...myVotes,sugId]});
    if(!newVotes)return showToast(`Máximo de ${rules.maxElimVotes||2} votos!`);
    await setVotes(newVotes);
  };

  const closeVotesAndElim=async()=>{
    if(!currentUser.isAdmin)return showToast("Apenas admin pode fechar!");
    if(missingElim.length>0)return showToast(`Falta eliminação de: ${missingElim.map(m=>m.name).join(", ")}`,4200);
    const vals=Object.values(voteCounts);
    const maxV=vals.length>0?Math.max(...vals):0;
    if(maxV===0)return showToast("Nenhum voto registrado.");
    const toElim=Object.entries(voteCounts).filter(([,v])=>v===maxV).map(([id])=>id);
    if(active.length-toElim.length<MIN_POOL)return showToast(`Isso deixaria só ${active.length-toElim.length} livro(s) — precisamos de pelo menos ${MIN_POOL} pro sorteio. Ajuste os votos.`,4200);
    await Promise.all(toElim.map(id=>FS.set("suggestions",id,{eliminated:true,elimType:"vote"})));
    await setPhase("raffle");showToast(`${toElim.length} eliminado(s)! Sorteio liberado.`);
  };

  const handleRaffle=()=>{if(afterElim.length<MIN_POOL)return showToast(`Precisamos de pelo menos ${MIN_POOL} livros concorrendo pro sorteio!`);setSpinning(true);setRaffleResult(null);setTimeout(()=>{setRaffleResult(afterElim[Math.floor(Math.random()*afterElim.length)]);setSpinning(false);},1800);};

  const confirmRaffle=async()=>{
    if(!raffleResult)return;
    const bookId=uid();
    await FS.set("books",bookId,{id:bookId,title:raffleResult.title,author:raffleResult.author,theme:raffleResult.theme,pages:raffleResult.pages,cover:raffleResult.cover||"",link:raffleResult.link||"",suggestedBy:raffleResult.suggestedBy,date:realMonth,summary:"",notes:"",isRaffled:true,wasThemed:rules.hasTheme});
    await FS.set("suggestions",raffleResult.id,{raffled:true});
    await setPhase("reading");showToast("🎉 Livro do mês definido!");setRaffleResult(null);
  };

  const delegate=members.find(m=>m.id===delegateDoc?.delegateId);
  const canActAsDelegate=delegateDoc?.delegateId&&(currentUser.id===delegateDoc.delegateId||currentUser.isAdmin);
  const confirmDelegateChoice=async(sugId)=>{
    const s=afterElim.find(x=>x.id===sugId);if(!s)return;
    const bookId=uid();
    await FS.set("books",bookId,{id:bookId,title:s.title,author:s.author,theme:s.theme,pages:s.pages,cover:s.cover||"",link:s.link||"",suggestedBy:s.suggestedBy,date:realMonth,summary:"",notes:"",isRaffled:true,wasThemed:rules.hasTheme});
    await FS.set("suggestions",s.id,{raffled:true});
    await FS.set("raffleDelegate",realMonth,{delegateId:null});
    await setPhase("reading");showToast("🎯 Livro do mês escolhido!");
  };

  return(
    <div>
      <div className="page-title">ELIMI<span className="accent">NAÇÃO</span></div>
      <div className="page-sub">Filtre e sorteia o livro do mês</div>
      <div className="tab-bar" style={{flexWrap:"wrap"}}>
        <button className={`tab-btn${tab==="indiv"?" active":""}`} onClick={()=>setTab("indiv")}>ELIMINAÇÃO</button>
        <button className={`tab-btn${tab==="vote"?" active":""}`} onClick={()=>setTab("vote")}>VOTAÇÃO {phase==="suggest"&&<span className="badge badge-pink" style={{marginLeft:3}}>🔒</span>}</button>
        <button className={`tab-btn${tab==="raffle"?" active":""}`} onClick={()=>setTab("raffle")}>SORTEIO</button>
        {currentUser.id!=="adm"&&<button className={`tab-btn${tab==="power"?" active":""}`} onClick={()=>setTab("power")}>⚡ PODER</button>}
      </div>

      {tab==="indiv"&&(
        <div>
          <div className="card c-orange no-hover card-stripe cs-orange" style={{marginBottom:"1rem"}}>
            <div style={{fontFamily:"var(--fd)",fontSize:".8rem",letterSpacing:"2px",color:"var(--orange)",marginBottom:".4rem"}}>REGRA</div>
            <div style={{fontSize:".85rem",fontWeight:700}}>Cada membro pode eliminar 1 livro por mês.</div>
            {myElim?<div className="alert alert-warn" style={{marginTop:".6rem"}}>Você já eliminou um livro. {currentUser.isAdmin&&<button className="btn btn-sm btn-danger" style={{marginLeft:".5rem"}} onClick={undoIndivElim}>Desfazer</button>}</div>
            :<div className="alert alert-ok" style={{marginTop:".6rem"}}>Você ainda não eliminou nenhum livro.</div>}
            <div style={{fontSize:".72rem",color:"rgba(26,26,46,.45)",fontWeight:700,marginTop:".5rem"}}>{eligibleElimMembers.length-missingElim.length}/{eligibleElimMembers.length} já eliminaram este mês{missingElim.length>0&&` — faltam: ${missingElim.map(m=>m.name).join(", ")}`}.</div>
          </div>
          {active.length===0?<div className="empty"><div className="ico">✅</div><div className="ttl">LISTA VAZIA</div></div>
          :active.map(s=>{const suggester=members.find(m=>m.id===s.suggestedBy);return(
            <div key={s.id} className={`elim-card${myElim===s.id?" voted":""}`}>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:".88rem"}}>{s.title}</div>
                {s.author&&<div style={{fontSize:".75rem",color:"var(--blue)",fontWeight:700}}>{s.author}</div>}
                <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:4}}>
                  {s.pages&&<span className="tag tag-blue">📄{s.pages}p</span>}
                  {suggester&&<span className="tag tag-pink">👤{suggester.name}</span>}
                </div>
              </div>
              {!myElim&&!s.eliminated&&canDo(currentUser.id,"elim")&&<button className="btn btn-red btn-sm" onClick={()=>handleIndivElim(s.id)} disabled={saving}>❌</button>}
              {myElim===s.id&&<span className="tag tag-orange">Minha eliminação</span>}
            </div>
          );})}
          {eliminated.length>0&&(<>
            <div className="divider"/>
            <div style={{fontFamily:"var(--fd)",fontSize:".75rem",letterSpacing:"2px",color:"rgba(26,26,46,.35)",marginBottom:".45rem"}}>ELIMINADOS</div>
            {eliminated.map(s=><div key={s.id} className="elim-card eliminated"><div style={{flex:1,fontSize:".82rem",fontWeight:700}}>{s.title}</div><span className="tag tag-navy">{s.elimType==="vote"?"Votação":"Individual"}</span></div>)}
          </>)}
        </div>
      )}

      {tab==="vote"&&(
        <div>
          {phase==="suggest"&&!currentUser.isAdmin&&<div className="alert alert-info">🔒 Votação liberada automaticamente quando todos sugerirem!</div>}
          <div className="card no-hover" style={{marginBottom:"1rem"}}>
            <div style={{fontFamily:"var(--fd)",fontSize:".8rem",letterSpacing:"2px",color:"var(--purple)",marginBottom:".4rem"}}>VOTAÇÃO</div>
            <div style={{fontSize:".85rem",fontWeight:700,marginBottom:".4rem"}}>Vote em até {rules.maxElimVotes||2} livro(s). Os mais votados são eliminados.</div>
            <div style={{fontSize:".75rem",color:"rgba(26,26,46,.5)"}}>Seus votos: {myVotes.length}/{rules.maxElimVotes||2}</div>
            {!showVoteDetails&&<div style={{fontSize:".72rem",color:"rgba(26,26,46,.4)",fontWeight:700,marginTop:4}}>🔒 Contagem visível após o admin fechar a votação.</div>}
          </div>
          {active.length===0?<div className="empty"><div className="ico">✅</div><div className="ttl">SEM LIVROS</div></div>
          :active.map(s=>{
            const vCount=voteCounts[s.id]||0;const isMyVote=myVotes.includes(s.id);const suggester=members.find(m=>m.id===s.suggestedBy);
            return(
              <div key={s.id} className={`elim-card${isMyVote?" voted":""}`}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:".88rem"}}>{s.title}</div>
                  {suggester&&<div style={{fontSize:".72rem",color:"var(--blue)",fontWeight:700}}>{suggester.name}</div>}
                  {showVoteDetails&&<><div className="progress-bar" style={{marginTop:5}}><div className="progress-fill" style={{width:`${(vCount/Math.max(1,members.filter(m=>m.id!=="adm").length))*100}%`,background:"var(--pink)"}}/></div><div style={{fontSize:".7rem",fontWeight:800,color:"rgba(26,26,46,.45)",marginTop:2}}>{vCount} voto{vCount!==1?"s":""}</div></>}
                  {!showVoteDetails&&isMyVote&&<div style={{fontSize:".7rem",fontWeight:800,color:"var(--pink)",marginTop:3}}>Seu voto ✓</div>}
                </div>
                <button className={`btn btn-sm ${isMyVote?"btn-danger":"btn-ghost"}`} onClick={()=>toggleVote(s.id)}>{isMyVote?"❌":"🗳️"}</button>
              </div>
            );
          })}
          {currentUser.isAdmin&&(
            <div style={{marginTop:"1rem"}}>
              <div className="divider"/>
              {missingElim.length>0&&<div className="alert alert-warn" style={{marginBottom:".6rem"}}>Falta eliminação individual de: {missingElim.map(m=>m.name).join(", ")}.</div>}
              <button className="btn btn-red btn-full" disabled={missingElim.length>0} onClick={closeVotesAndElim}>👑 Fechar votação e eliminar mais votados</button>
              <div style={{fontSize:".7rem",color:"rgba(26,26,46,.45)",fontWeight:700,marginTop:".4rem",textAlign:"center"}}>Precisa sobrar pelo menos {MIN_POOL} livros pro sorteio.</div>
            </div>
          )}
        </div>
      )}

      {tab==="raffle"&&(
        <div>
          {raffledBook?(
            <div className="card c-green no-hover" style={{textAlign:"center",padding:"2rem"}}>
              <div className="confetti-text" style={{marginBottom:"1rem"}}>JÁ SORTEADO!</div>
              <div className="book-title" style={{textAlign:"center"}}>{raffledBook.title}</div>
              <div className="book-author" style={{textAlign:"center"}}>{raffledBook.author}</div>
            </div>
          ):delegateDoc?.delegateId?(
            <>
              <div className="card c-purple no-hover" style={{marginBottom:"1rem"}}>
                <div style={{fontFamily:"var(--fd)",fontSize:".8rem",letterSpacing:"2px",color:"var(--purple)",marginBottom:".4rem"}}>🎯 ESCOLHA DELEGADA</div>
                <div style={{fontSize:".85rem",fontWeight:700}}>{canActAsDelegate?`É a sua vez! Escolha o livro do mês entre os concorrentes:`:`${delegate?.name||"Alguém"} foi escolhido(a) para decidir o livro do mês. Aguarde a decisão.`}</div>
              </div>
              {canActAsDelegate&&(afterElim.length===0?<div className="empty"><div className="ico">✅</div><div className="ttl">LISTA VAZIA</div></div>
              :afterElim.map(s=>(
                <div key={s.id} className="elim-card">
                  <div style={{flex:1}}><div style={{fontWeight:800,fontSize:".88rem"}}>{s.title}</div>{s.author&&<div style={{fontSize:".75rem",color:"var(--blue)",fontWeight:700}}>{s.author}</div>}</div>
                  <button className="btn btn-green btn-sm" onClick={()=>confirmDelegateChoice(s.id)}>👉 Escolher</button>
                </div>
              )))}
            </>
          ):(
            <>
              <div className="card no-hover" style={{marginBottom:"1rem"}}>
                <div style={{fontSize:".78rem",fontWeight:700,color:"rgba(26,26,46,.5)"}}>{afterElim.length} livro{afterElim.length!==1?"s":""} restante{afterElim.length!==1?"s":""}:</div>
                {afterElim.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:".5rem",padding:".55rem 0",borderBottom:"1px solid rgba(26,26,46,.06)"}}><span style={{fontSize:".85rem",fontWeight:700}}>{s.title}</span>{s.pages&&<span className="tag tag-blue">📄{s.pages}p</span>}</div>)}
              </div>
              {afterElim.length<MIN_POOL&&<div className="alert alert-warn" style={{marginBottom:"1rem"}}>Precisamos de pelo menos {MIN_POOL} livros concorrendo pro sorteio. Volte pra Individual/Votação e libere mais sugestões.</div>}
              {spinning?<div style={{textAlign:"center",padding:"2rem",fontSize:"3.5rem"}}><span style={{display:"inline-block",animation:"spin .4s linear infinite"}}>📚</span><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>
              :raffleResult?<div className="pop-in">
                <div className="confetti-text" style={{marginBottom:"1rem"}}>SORTEADO!</div>
                <div className="card c-yellow no-hover" style={{marginBottom:"1rem",textAlign:"center"}}>
                  {raffleResult.cover&&<img src={raffleResult.cover} alt="" style={{height:100,borderRadius:8,margin:"0 auto .75rem",display:"block",objectFit:"cover"}}/>}
                  <div className="book-title">{raffleResult.title}</div>
                  {raffleResult.author&&<div className="book-author">{raffleResult.author}</div>}
                  {raffleResult.pages&&<span className="tag tag-blue" style={{marginTop:8,display:"inline-block"}}>📄 {raffleResult.pages}p</span>}
                </div>
                <div style={{display:"flex",gap:".6rem"}}>
                  <button className="btn btn-outline btn-full" onClick={()=>setRaffleResult(null)}>Sortear novamente</button>
                  <button className="btn btn-green btn-full" onClick={confirmRaffle}>CONFIRMAR! 🎊</button>
                </div>
              </div>
              :<button className="btn btn-raffle btn-full" disabled={afterElim.length<MIN_POOL} onClick={handleRaffle}>🎲 SORTEAR LIVRO DO MÊS</button>}
            </>
          )}
        </div>
      )}

      {tab==="power"&&currentUser.id!=="adm"&&(
        <PowerPanel members={members} currentUser={currentUser} monthSugg={monthSugg} books={books} realMonth={realMonth} phase={phase} powerUses={powerUses} powerCycle={powerCycle} raffledBook={raffledBook} setPhase={setPhase} showToast={showToast} rules={rules}/>
      )}
    </div>
  );
}

// ─── PODER DO CICLO ────────────────────────────────────────────────────────────
function PowerPanel({members,currentUser,monthSugg,books,realMonth,phase,powerUses,powerCycle,raffledBook,setPhase,showToast,rules}) {
  const [open,setOpen]=useState(null);
  const [picks,setPicks]=useState([]);
  const [picksBack,setPicksBack]=useState([]);
  const [saving,setSaving]=useState(false);

  const pool=monthSugg.filter(s=>!s.eliminated&&!s.raffled);
  const elimPool=monthSugg.filter(s=>s.eliminated);
  const myUse=powerUses.find(p=>p.memberId===currentUser.id&&p.cycle===powerCycle);
  const available=!myUse;

  const reset=()=>{setOpen(null);setPicks([]);setPicksBack([]);setSaving(false);};

  const record=async(power,details)=>{
    await FS.set("powerUses",`${currentUser.id}_${powerCycle}`,{memberId:currentUser.id,cycle:powerCycle,power,month:realMonth,details:details||{},ts:new Date().toISOString()});
  };

  const doResorteio=async(excludeCurrent)=>{
    if(!raffledBook){showToast("Ainda não há livro sorteado este mês!");return;}
    setSaving(true);
    const currentSugg=monthSugg.find(s=>s.raffled);
    const candidates=monthSugg.filter(s=>!s.eliminated&&(!excludeCurrent||s.id!==currentSugg?.id));
    if(candidates.length===0){showToast("Não há livros suficientes pra resortear!");setSaving(false);return;}
    const winner=candidates[Math.floor(Math.random()*candidates.length)];
    await FS.del("books",raffledBook.id);
    if(currentSugg)await FS.set("suggestions",currentSugg.id,{raffled:false});
    const bookId=uid();
    await FS.set("books",bookId,{id:bookId,title:winner.title,author:winner.author,theme:winner.theme,pages:winner.pages,cover:winner.cover||"",link:winner.link||"",suggestedBy:winner.suggestedBy,date:realMonth,summary:"",notes:"",isRaffled:true,wasThemed:rules.hasTheme});
    await FS.set("suggestions",winner.id,{raffled:true});
    await record(excludeCurrent?"resorteio_sem":"resorteio",{novoLivro:winner.title});
    showToast(`🔄 Novo livro do mês: ${winner.title}!`);reset();
  };

  const doRessuscitar=async(sugId)=>{
    const s=elimPool.find(x=>x.id===sugId);if(!s)return;
    setSaving(true);
    await FS.set("suggestions",sugId,{eliminated:false,elimType:null,elimBy:null});
    await record("ressuscitar",{livro:s.title});
    showToast(`📗 "${s.title}" voltou pra disputa!`);reset();
  };

  const doRemover=async(sugId)=>{
    const s=pool.find(x=>x.id===sugId);if(!s)return;
    setSaving(true);
    await FS.set("suggestions",sugId,{eliminated:true,elimType:"power",elimBy:currentUser.id});
    await record("remover",{livro:s.title});
    showToast(`🗑️ "${s.title}" saiu do sorteio!`);reset();
  };

  const doEscolher=async(sugId)=>{
    const s=pool.find(x=>x.id===sugId);if(!s)return;
    setSaving(true);
    const bookId=uid();
    await FS.set("books",bookId,{id:bookId,title:s.title,author:s.author,theme:s.theme,pages:s.pages,cover:s.cover||"",link:s.link||"",suggestedBy:s.suggestedBy,date:realMonth,summary:"",notes:"",isRaffled:true,wasThemed:rules.hasTheme});
    await FS.set("suggestions",s.id,{raffled:true});
    await setPhase("reading");
    await record("escolher",{livro:s.title});
    showToast(`👉 "${s.title}" é o livro do mês!`);reset();
  };

  const doDelegar=async(memberId)=>{
    const m=members.find(x=>x.id===memberId);if(!m)return;
    setSaving(true);
    await FS.set("raffleDelegate",realMonth,{delegateId:memberId,byMemberId:currentUser.id,ts:new Date().toISOString()});
    await record("delegar",{para:m.name});
    showToast(`🎯 ${m.name} vai escolher o livro do mês!`);reset();
  };

  const doTrocar=async(n)=>{
    if(picks.length!==n||picksBack.length!==n)return showToast(`Escolha ${n} livro(s) de cada lado!`);
    setSaving(true);
    await Promise.all(picks.map(id=>FS.set("suggestions",id,{eliminated:true,elimType:"power",elimBy:currentUser.id})));
    await Promise.all(picksBack.map(id=>FS.set("suggestions",id,{eliminated:false,elimType:null,elimBy:null})));
    await record(n===2?"trocar2":"trocar1",{saem:picks.length,entram:picksBack.length});
    showToast("🔀 Livros trocados!");reset();
  };

  const togglePick=(id,list,setList,max)=>setList(l=>l.includes(id)?l.filter(x=>x!==id):(l.length>=max?l:[...l,id]));

  const power=POWERS.find(p=>p.id===open);
  const disabledReason=(p)=>{
    if(p.when==="post"&&!raffledBook)return "Só disponível depois que o livro do mês já tiver sido sorteado.";
    if(p.when==="pre"&&raffledBook)return "Só disponível antes do sorteio do mês ser confirmado.";
    if((p.id==="ressuscitar")&&elimPool.length===0)return "Não há livros eliminados este mês.";
    if((p.id==="remover"||p.id==="escolher"||p.id==="delegar"||p.id==="trocar1")&&pool.length===0)return "Não há livros concorrendo este mês.";
    if(p.id==="trocar2"&&pool.length<2)return "É preciso ao menos 2 livros concorrendo.";
    if(p.id==="trocar1"&&elimPool.length===0)return "Não há livros eliminados pra devolver.";
    if(p.id==="trocar2"&&elimPool.length<2)return "É preciso ao menos 2 livros eliminados pra devolver.";
    if(p.id==="delegar"&&members.filter(m=>m.id!==currentUser.id&&m.id!=="adm").length===0)return "Não há outro membro pra delegar.";
    return null;
  };

  return(
    <div>
      <div className={`card no-hover ${available?"c-green":"c-orange"}`} style={{marginBottom:"1rem"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:".8rem",letterSpacing:"2px",color:available?"var(--green)":"var(--orange)",marginBottom:".4rem"}}>SEU PODER</div>
        {available
          ?<div style={{fontSize:".85rem",fontWeight:700}}>Disponível neste ciclo. Você pode usar 1 poder — depois disso, só no próximo ciclo (14 meses).</div>
          :<div style={{fontSize:".85rem",fontWeight:700}}>Já usado neste ciclo: <strong>{powerLabel(myUse.power)}</strong> em {formatMonthYear(myUse.month)}. Você poderá usar de novo apenas no próximo ciclo.</div>}
      </div>

      {available&&!open&&(
        <div style={{display:"flex",flexDirection:"column",gap:".55rem"}}>
          {POWERS.map(p=>{
            const reason=disabledReason(p);
            return(
              <div key={p.id} className="card no-hover" style={{padding:".8rem .9rem",opacity:reason?.55:1}}>
                <div style={{display:"flex",alignItems:"center",gap:".7rem"}}>
                  <span style={{fontSize:"1.3rem"}}>{p.ico}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:".85rem"}}>{p.label}</div>
                    <div style={{fontSize:".72rem",color:"rgba(26,26,46,.5)",fontWeight:600}}>{reason||p.desc}</div>
                  </div>
                  <button className="btn btn-pink btn-sm" disabled={!!reason} onClick={()=>setOpen(p.id)}>Usar</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {available&&open&&(
        <div className="card no-hover">
          <div style={{fontFamily:"var(--fd)",fontSize:".9rem",letterSpacing:"2px",marginBottom:".3rem"}}>{power.ico} {power.label.toUpperCase()}</div>
          <div style={{fontSize:".78rem",color:"rgba(26,26,46,.55)",fontWeight:600,marginBottom:".85rem"}}>{power.desc}</div>

          {(open==="resorteio"||open==="resorteio_sem")&&(
            <button className="btn btn-raffle btn-full" disabled={saving} onClick={()=>doResorteio(open==="resorteio_sem")}>{saving?"Sorteando...":"🎲 CONFIRMAR RESORTEIO"}</button>
          )}

          {open==="ressuscitar"&&(
            <>
              {elimPool.map(s=><div key={s.id} className="elim-card"><div style={{flex:1,fontSize:".85rem",fontWeight:700}}>{s.title}</div><button className="btn btn-green btn-sm" disabled={saving} onClick={()=>doRessuscitar(s.id)}>📗 Devolver</button></div>)}
            </>
          )}

          {open==="remover"&&(
            <>
              {pool.map(s=><div key={s.id} className="elim-card"><div style={{flex:1,fontSize:".85rem",fontWeight:700}}>{s.title}</div><button className="btn btn-danger btn-sm" disabled={saving} onClick={()=>doRemover(s.id)}>🗑️ Remover</button></div>)}
            </>
          )}

          {open==="escolher"&&(
            <>
              {pool.map(s=><div key={s.id} className="elim-card"><div style={{flex:1,fontSize:".85rem",fontWeight:700}}>{s.title}</div><button className="btn btn-green btn-sm" disabled={saving} onClick={()=>doEscolher(s.id)}>👉 Escolher</button></div>)}
            </>
          )}

          {open==="delegar"&&(
            <>
              {members.filter(m=>m.id!==currentUser.id&&m.id!=="adm").map(m=><div key={m.id} className="elim-card"><div style={{flex:1,display:"flex",alignItems:"center",gap:".5rem"}}><MemberAvatar member={m} size={30}/><span style={{fontSize:".85rem",fontWeight:700}}>{m.name}</span></div><button className="btn btn-pink btn-sm" disabled={saving} onClick={()=>doDelegar(m.id)}>🎯 Delegar</button></div>)}
            </>
          )}

          {(open==="trocar1"||open==="trocar2")&&(
            <>
              <div style={{fontSize:".75rem",fontWeight:800,color:"rgba(26,26,46,.5)",marginBottom:".4rem"}}>SAEM DO SORTEIO ({picks.length}/{open==="trocar2"?2:1})</div>
              {pool.map(s=>(
                <div key={s.id} className={`elim-card${picks.includes(s.id)?" voted":""}`} onClick={()=>togglePick(s.id,picks,setPicks,open==="trocar2"?2:1)} style={{cursor:"pointer"}}>
                  <div style={{flex:1,fontSize:".85rem",fontWeight:700}}>{s.title}</div>{picks.includes(s.id)&&<span className="tag tag-orange">Selecionado</span>}
                </div>
              ))}
              <div style={{fontSize:".75rem",fontWeight:800,color:"rgba(26,26,46,.5)",margin:".8rem 0 .4rem"}}>ENTRAM NO SORTEIO ({picksBack.length}/{open==="trocar2"?2:1})</div>
              {elimPool.map(s=>(
                <div key={s.id} className={`elim-card${picksBack.includes(s.id)?" voted":""}`} onClick={()=>togglePick(s.id,picksBack,setPicksBack,open==="trocar2"?2:1)} style={{cursor:"pointer"}}>
                  <div style={{flex:1,fontSize:".85rem",fontWeight:700}}>{s.title}</div>{picksBack.includes(s.id)&&<span className="tag tag-green">Selecionado</span>}
                </div>
              ))}
              <button className="btn btn-pink btn-full" style={{marginTop:".85rem"}} disabled={saving} onClick={()=>doTrocar(open==="trocar2"?2:1)}>{saving?"Trocando...":"🔀 CONFIRMAR TROCA"}</button>
            </>
          )}

          <button className="btn btn-outline btn-full" style={{marginTop:".7rem"}} onClick={reset}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

// ─── BOOKS ────────────────────────────────────────────────────────────────────
function BooksPage({books,members,ratings,reviews,currentUser,showToast,getBookAvg,getBookRatings}) {
  const [modal,setModal]=useState(null);
  const [rateModal,setRateModal]=useState(null);
  const [reviewModal,setReviewModal]=useState(null);
  const [manualModal,setManualModal]=useState(false); // inclusão manual
  const [filterYear,setFilterYear]=useState("all");
  const [filterTheme,setFilterTheme]=useState("all");

  const years=[...new Set(books.map(b=>b.date?.split("-")[0]).filter(Boolean))].sort().reverse();
  const themes=[...new Set(books.map(b=>b.theme).filter(Boolean))];
  const filtered=books.filter(b=>{
    if(filterYear!=="all"&&!b.date?.startsWith(filterYear))return false;
    if(filterTheme!=="all"&&b.theme!==filterTheme)return false;
    return true;
  }).sort((a,b)=>(b.date||"").localeCompare(a.date||""));

  const handleSave=async(book)=>{await FS.set("books",book.id,book);setModal(null);showToast("Livro salvo! 📚");};
  const handleDelete=async(id)=>{if(!currentUser.isAdmin)return showToast("Apenas admin!");await FS.del("books",id);await Promise.all(ratings.filter(r=>r.bookId===id).map(r=>FS.del("ratings",r.id)));showToast("Livro removido.");};
  const handleRate=async(r)=>{await FS.set("ratings",r.id,r);setRateModal(null);showToast("Nota registrada! ⭐");};
  const handleReview=async(bookId,text)=>{const id=`${bookId}_${currentUser.id}`;await FS.set("reviews",id,{id,bookId,userId:currentUser.id,text,updatedAt:new Date().toISOString()});setReviewModal(null);showToast("Review salva! ✍️");};

  // Inclusão manual: salva livro + notas em lote
  const handleManualSave=async(data)=>{
    const bookId=data.book.id||uid();
    await FS.set("books",bookId,{...data.book,id:bookId,isRaffled:false});
    if(data.generalAvg!=null && data.generalAvg!==""){
      // Save a single general rating
      await FS.set("ratings",`${bookId}__general`,{id:`${bookId}__general`,bookId,userId:"_general",value:Number(data.generalAvg)});
    } else {
      for(const r of data.ratings||[]){
        if(r.value!==""&&r.value!==null&&r.value!==undefined){
          await FS.set("ratings",`${bookId}_${r.userId}`,{id:`${bookId}_${r.userId}`,bookId,userId:r.userId,value:Number(r.value)});
        }
      }
    }
    setManualModal(false);showToast("Livro adicionado! 📚⭐");
  };

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".2rem"}}>
        <div className="page-title">LI<span className="hi">VROS</span></div>
        <div style={{display:"flex",gap:".4rem"}}>
          <button className="btn btn-orange btn-sm" onClick={()=>setManualModal(true)} title="Inclusão manual de livro antigo">📥 Manual</button>
          {currentUser.isAdmin&&<button className="btn btn-pink btn-sm" onClick={()=>setModal({})}>+ Novo</button>}
        </div>
      </div>
      <div className="page-sub">{books.length} livro{books.length!==1?"s":""} no histórico</div>
      <div className="filter-bar">{["all",...years].map(y=><button key={y} className={`chip${filterYear===y?" active":""}`} onClick={()=>setFilterYear(y)}>{y==="all"?"TODOS":y}</button>)}</div>
      {themes.length>0&&<div className="filter-bar">{["all",...themes].map(t=><button key={t} className={`chip${filterTheme===t?" active":""}`} onClick={()=>setFilterTheme(t)}>{t==="all"?"# TODOS":`# ${t}`}</button>)}</div>}
      {filtered.length===0?<div className="empty"><div className="ico">📚</div><div className="ttl">NENHUM LIVRO</div></div>
      :<div style={{display:"grid",gap:".65rem"}}>{filtered.map(book=>(
        <BookCard key={book.id} book={book} members={members} avg={getBookAvg(book.id)} ratings={getBookRatings(book.id)} reviews={(reviews||[]).filter(r=>r.bookId===book.id)} currentUser={currentUser} onEdit={()=>setModal(book)} onDelete={()=>handleDelete(book.id)} onRate={()=>setRateModal(book)} onReview={()=>setReviewModal(book)}/>
      ))}</div>}
      {modal!==null&&<BookFormModal book={modal.id?modal:null} books={books} members={members} onClose={()=>setModal(null)} onSave={handleSave}/>}
      {rateModal&&<RateModal book={rateModal} currentUser={currentUser} existingRatings={getBookRatings(rateModal.id)} onClose={()=>setRateModal(null)} onSave={handleRate}/>}
      {reviewModal&&<ReviewModal book={reviewModal} currentUser={currentUser} existingReview={(reviews||[]).find(r=>r.bookId===reviewModal.id&&r.userId===currentUser.id)} onClose={()=>setReviewModal(null)} onSave={handleReview}/>}
      {manualModal&&<ManualEntryModal members={members} books={books} onClose={()=>setManualModal(false)} onSave={handleManualSave}/>}
    </div>
  );
}

// ── MANUAL ENTRY MODAL ────────────────────────────────────────────────────────
function ManualEntryModal({members,books,onClose,onSave}) {
  const [form,setForm]=useState({id:uid(),title:"",author:"",theme:"",pages:"",date:"",cover:"",suggestedBy:"",summary:"",notes:"",link:""});
  const [ratingMode,setRatingMode]=useState("individual"); // "individual" | "general"
  const [generalAvg,setGeneralAvg]=useState(""); // média geral única
  const [memberRatings,setMemberRatings]=useState(members.filter(m=>m.id!=="adm").map(m=>({userId:m.id,value:""})));
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const setRating=(userId,value)=>setMemberRatings(mr=>mr.map(r=>r.userId===userId?{...r,value}:r));
  const fileRef=useRef();
  const handleFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>set("cover",ev.target.result);r.readAsDataURL(f);};
  const dup=books.find(b=>b.title.trim().toLowerCase()===form.title.trim().toLowerCase());

  const handleSave = async () => {
    if(!form.title||!form.date||!!dup)return;
    setSaving(true);
    // Build ratings array depending on mode
    let ratingsToSave = [];
    if(ratingMode==="individual"){
      ratingsToSave = memberRatings.filter(r=>r.value!==""&&r.value!==null&&r.value!==undefined);
    } else if(ratingMode==="general" && generalAvg!==""){
      // Save as a single "general" rating with a synthetic userId
      ratingsToSave = [{userId:"_general",value:Number(generalAvg)}];
    }
    await onSave({book:form, ratings:ratingsToSave, generalAvg: ratingMode==="general"?generalAvg:null});
    setSaving(false);
  };

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/><button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">📥 INCLUSÃO MANUAL</div>
        <div className="alert alert-info" style={{marginBottom:"1rem"}}>Use para adicionar livros lidos em datas anteriores.</div>
        {dup&&<div className="alert alert-error">⚠️ "{form.title}" já está no histórico!</div>}
        <div className="form-group"><label className="form-label">TÍTULO *</label><input className="form-input" value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Nome do livro"/></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">AUTOR</label><input className="form-input" value={form.author} onChange={e=>set("author",e.target.value)} placeholder="Autor/a"/></div>
          <div className="form-group"><label className="form-label">TEMA</label><input className="form-input" value={form.theme} onChange={e=>set("theme",e.target.value)} placeholder="Ex: romance"/></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">MÊS/ANO *</label><input className="form-input" type="month" value={form.date} onChange={e=>set("date",e.target.value)}/></div>
          <div className="form-group"><label className="form-label">PÁGINAS</label><input className="form-input" type="number" value={form.pages} onChange={e=>set("pages",e.target.value)} placeholder="350"/></div>
        </div>
        <div className="form-group"><label className="form-label">SUGESTÃO DE</label><select className="form-select" value={form.suggestedBy} onChange={e=>set("suggestedBy",e.target.value)}><option value="">— Selecione —</option>{dedupeMembers(members.filter(m=>m.id!=="adm")).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <div className="form-group"><label className="form-label">LINK</label><input className="form-input" value={form.link||""} onChange={e=>set("link",e.target.value)} placeholder="https://..."/></div>
        <div className="form-group">
          <label className="form-label">CAPA</label>
          <div className="upload-zone" onClick={()=>fileRef.current?.click()}>
            <input type="file" ref={fileRef} accept="image/*" onChange={handleFile} style={{display:"none"}}/>
            {form.cover?<img src={form.cover} alt="" style={{height:60,borderRadius:6,margin:"0 auto",display:"block",objectFit:"cover"}}/>:<div style={{fontSize:".78rem",color:"rgba(26,26,46,.4)",fontWeight:700}}>📷 Upload</div>}
          </div>
        </div>

        <div className="divider"/>

        {/* Rating mode selector */}
        <div style={{fontFamily:"var(--fd)",fontSize:".9rem",letterSpacing:"2px",marginBottom:".75rem"}}>NOTAS</div>
        <div className="tab-bar" style={{marginBottom:"1rem"}}>
          <button className={`tab-btn${ratingMode==="individual"?" active":""}`} onClick={()=>setRatingMode("individual")}>Individuais</button>
          <button className={`tab-btn${ratingMode==="general"?" active":""}`} onClick={()=>setRatingMode("general")}>Média geral</button>
          <button className={`tab-btn${ratingMode==="none"?" active":""}`} onClick={()=>setRatingMode("none")}>Sem nota</button>
        </div>

        {ratingMode==="individual" && (
          <div style={{display:"grid",gap:".5rem"}}>
            {members.filter(m=>m.id!=="adm").map(m=>{
              const r=memberRatings.find(r=>r.userId===m.id);
              return(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:".75rem",padding:".6rem .8rem",background:"white",borderRadius:10,border:"1.5px solid rgba(26,26,46,.08)"}}>
                  <MemberAvatar member={m} size={32}/>
                  <span style={{fontWeight:800,fontSize:".85rem",flex:1}}>{m.name}</span>
                  <div style={{display:"flex",gap:3,flexWrap:"wrap",justifyContent:"flex-end"}}>
                    {[0,1,2,3,4,5,6,7,8,9,10].map(n=>(
                      <button key={n} className={`rating-num-btn${r?.value===n?" sel":""}`} onClick={()=>setRating(m.id,n)} style={{width:26,height:26,fontSize:".7rem"}}>{n}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {ratingMode==="general" && (
          <div>
            <div style={{fontSize:".82rem",fontWeight:600,color:"rgba(26,26,46,.5)",marginBottom:".65rem"}}>
              Insira a média geral do grupo (0–10). Ela será exibida como nota do livro.
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:".5rem"}}>
              {[0,1,2,3,4,5,6,7,8,9,10].map(n=>(
                <button key={n} className={`rating-num-btn${Number(generalAvg)===n&&generalAvg!==""?" sel":""}`} onClick={()=>setGeneralAvg(String(n))} style={{width:34,height:34,fontSize:".82rem"}}>{n}</button>
              ))}
            </div>
            {generalAvg!==""&&(
              <div style={{display:"flex",alignItems:"center",gap:8,padding:".65rem",background:"rgba(255,214,0,.1)",borderRadius:10,border:"1.5px solid rgba(255,214,0,.3)"}}>
                <span style={{color:"var(--yellow)",fontSize:"1.1rem"}}>{starsFrom(parseFloat(generalAvg))}</span>
                <span style={{fontFamily:"var(--fd)",fontSize:"1.6rem",color:"var(--pink)",letterSpacing:"2px"}}>{generalAvg}</span>
                <span style={{fontSize:".75rem",fontWeight:600,color:"rgba(26,26,46,.4)"}}>média geral</span>
              </div>
            )}
          </div>
        )}

        {ratingMode==="none" && (
          <div className="alert alert-warn">O livro será salvo sem nenhuma nota.</div>
        )}

        <div className="form-group" style={{marginTop:"1rem"}}>
          <label className="form-label">RESUMO (OPCIONAL)</label>
          <textarea className="form-textarea" value={form.summary} onChange={e=>set("summary",e.target.value)} placeholder="O que o grupo achou..." style={{minHeight:70}}/>
        </div>
        <div style={{display:"flex",gap:".6rem",marginTop:".5rem"}}>
          <button className="btn btn-outline btn-full" onClick={onClose}>Cancelar</button>
          <button className="btn btn-orange btn-full" disabled={!form.title||!form.date||saving||!!dup} onClick={handleSave}>{saving?"Salvando...":"SALVAR TUDO 💾"}</button>
        </div>
      </div>
    </div>
  );
}

function BookCard({book,members,avg,ratings,reviews,currentUser,onEdit,onDelete,onRate,onReview}) {
  const [open,setOpen]=useState(false);
  const suggester=members.find(m=>m.id===book.suggestedBy);
  const myRating=ratings.find(r=>r.userId===currentUser.id);
  const myReview=reviews?.find(r=>r.userId===currentUser.id);
  return(
    <div className="card no-hover card-stripe cs-multi">
      <div style={{display:"flex",gap:".85rem",alignItems:"flex-start",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        {book.cover?<img src={book.cover} className="book-cover" alt=""/>:<div className="book-cover-ph" style={{background:"linear-gradient(135deg,var(--blue),var(--purple))"}}>📖</div>}
        <div style={{flex:1,minWidth:0}}>
          <div className="book-title">{book.title}</div>
          <div className="book-author">{book.author}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,margin:".25rem 0"}}>
            {book.date&&<span className="tag tag-yellow">📅{formatMonthYear(book.date?.slice(0,7))}</span>}
            {book.theme&&<span className="tag tag-purple">#{book.theme}</span>}
            {book.pages&&<span className="tag tag-blue">📄{book.pages}p</span>}
          </div>
          {avg!==null?<div style={{display:"flex",alignItems:"center",gap:5}}><span style={{color:"var(--yellow)",fontSize:".82rem"}}>{starsFrom(avg)}</span><span style={{fontFamily:"var(--fd)",fontSize:"1.3rem",color:"var(--pink)",letterSpacing:"2px"}}>{fmtNota(avg)}</span><span style={{fontSize:".7rem",color:"rgba(26,26,46,.4)",fontWeight:700}}>({ratings.length})</span></div>
          :<span style={{fontSize:".72rem",color:"rgba(26,26,46,.3)",fontWeight:700}}>Sem notas ainda</span>}
        </div>
        <span style={{fontSize:".8rem",color:"rgba(26,26,46,.25)"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{marginTop:"1rem"}}>
          <div className="divider"/>
          {suggester&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:".65rem"}}><MemberAvatar member={suggester} size={24}/><span style={{fontSize:".78rem",fontWeight:700}}>Sugestão de <strong>{suggester.name}</strong></span></div>}
          {book.link&&<a href={book.link} target="_blank" rel="noreferrer" style={{fontSize:".75rem",color:"var(--blue)",fontWeight:700,display:"block",marginBottom:".5rem"}}>🔗 Ver no Goodreads</a>}
          {book.summary&&<div style={{fontSize:".83rem",lineHeight:1.6,background:"rgba(30,111,217,.06)",padding:".8rem",borderRadius:10,marginBottom:".65rem",border:"1.5px solid rgba(30,111,217,.1)"}}>{book.summary}</div>}
          {reviews&&reviews.length>0&&(
            <div style={{marginBottom:".75rem"}}>
              <div style={{fontFamily:"var(--fd)",fontSize:".72rem",letterSpacing:"1.5px",color:"rgba(26,26,46,.4)",marginBottom:".5rem"}}>REVIEWS</div>
              {reviews.map(r=>{const u=members.find(m=>m.id===r.userId);return(
                <div key={r.id} style={{background:"rgba(255,63,142,.04)",border:"1.5px solid rgba(255,63,142,.12)",borderRadius:10,padding:".75rem",marginBottom:".4rem"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:".3rem"}}><MemberAvatar member={u} size={20}/><span style={{fontWeight:800,fontSize:".78rem"}}>{u?.name||"?"}</span></div>
                  <div style={{fontSize:".82rem",lineHeight:1.5,color:"rgba(26,26,46,.75)"}}>{r.text}</div>
                </div>
              );})}
            </div>
          )}
          {ratings.length>0&&(
            <div style={{marginBottom:".65rem"}}>
              <div style={{fontFamily:"var(--fd)",fontSize:".72rem",letterSpacing:"1.5px",color:"rgba(26,26,46,.4)",marginBottom:".4rem"}}>NOTAS</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:".35rem"}}>
                {ratings.map(r=>{const u=members.find(m=>m.id===r.userId);const name=r.userId==="_general"?"Média geral":u?.name?.split(" ")[0]||"?";return<div key={r.id} style={{display:"flex",alignItems:"center",gap:3,background:"rgba(255,214,0,.12)",border:"1.5px solid rgba(255,214,0,.3)",padding:"3px 9px",borderRadius:99,fontSize:".72rem",fontWeight:800}}>{name}: <span style={{color:"var(--pink)"}}>{r.value}</span></div>;})}
              </div>
            </div>
          )}
          <div style={{display:"flex",gap:".4rem",flexWrap:"wrap"}}>
            <button className="btn btn-pink btn-sm" onClick={onRate}>{myRating?`Minha nota: ${myRating.value}`:"⭐ Dar nota"}</button>
            <button className="btn btn-blue btn-sm" onClick={onReview}>{myReview?"✏️ Editar review":"✍️ Review"}</button>
            {currentUser.isAdmin&&<button className="btn btn-ghost btn-sm" onClick={onEdit}>✏️</button>}
            {currentUser.isAdmin&&<button className="btn btn-danger btn-sm" onClick={onDelete}>🗑️</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewModal({book,currentUser,existingReview,onClose,onSave}) {
  const [text,setText]=useState(existingReview?.text||"");
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:480}}>
        <div className="modal-handle"/><button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">REVIEW ✍️</div>
        <div style={{padding:".75rem",background:"rgba(30,111,217,.06)",borderRadius:10,marginBottom:"1rem",border:"1.5px solid rgba(30,111,217,.1)"}}>
          <div className="book-title">{book.title}</div><div className="book-author">{book.author}</div>
        </div>
        <div className="form-group"><label className="form-label">SUA REVIEW</label><textarea className="form-textarea" placeholder="O que você achou? Pontos fortes, fracos, citações favoritas..." value={text} onChange={e=>setText(e.target.value)} style={{minHeight:140}}/></div>
        <div style={{display:"flex",gap:".6rem"}}>
          <button className="btn btn-outline btn-full" onClick={onClose}>Cancelar</button>
          <button className="btn btn-pink btn-full" disabled={!text.trim()} onClick={()=>onSave(book.id,text)}>SALVAR REVIEW ✍️</button>
        </div>
      </div>
    </div>
  );
}

function BookFormModal({book,books,members,onClose,onSave}) {
  const [form,setForm]=useState(book?{...book}:{id:uid(),title:"",author:"",theme:"",suggestedBy:"",date:"",cover:"",pages:"",summary:"",notes:"",link:"",isRaffled:false});
  const [saving,setSaving]=useState(false);
  const fileRef=useRef();
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const pageWarn=form.pages&&form.date?checkPageLimit(parseInt(form.pages),form.date):null;
  const dup=!book&&books.find(b=>b.title.trim().toLowerCase()===form.title.trim().toLowerCase());
  const handleFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>set("cover",ev.target.result);r.readAsDataURL(f);};
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/><button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{book?"EDITAR":"NOVO"} LIVRO</div>
        {dup&&<div className="alert alert-error">⚠️ "{form.title}" já foi lido!</div>}
        {pageWarn&&<div className="alert alert-warn">{pageWarn}</div>}
        <div className="form-group"><label className="form-label">TÍTULO *</label><input className="form-input" value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Nome do livro"/></div>
        <div className="form-row"><div className="form-group"><label className="form-label">AUTOR</label><input className="form-input" value={form.author} onChange={e=>set("author",e.target.value)} placeholder="Autor/a"/></div><div className="form-group"><label className="form-label">TEMA</label><input className="form-input" value={form.theme} onChange={e=>set("theme",e.target.value)} placeholder="Ex: romance"/></div></div>
        <div className="form-row"><div className="form-group"><label className="form-label">MÊS/ANO</label><input className="form-input" type="month" value={form.date} onChange={e=>set("date",e.target.value)}/></div><div className="form-group"><label className="form-label">PÁGINAS</label><input className="form-input" type="number" value={form.pages} onChange={e=>set("pages",e.target.value)} placeholder="350"/></div></div>
        <div className="form-group"><label className="form-label">SUGESTÃO DE</label><select className="form-select" value={form.suggestedBy} onChange={e=>set("suggestedBy",e.target.value)}><option value="">— Selecione —</option>{dedupeMembers(members.filter(m=>m.id!=="adm")).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <div className="form-group"><label className="form-label">LINK</label><input className="form-input" value={form.link||""} onChange={e=>set("link",e.target.value)} placeholder="https://..."/></div>
        <div className="form-group"><label className="form-label">CAPA</label><input className="form-input" placeholder="URL..." value={form.cover?.startsWith("data:")||!form.cover?"":form.cover} onChange={e=>set("cover",e.target.value)} style={{marginBottom:6}}/><div className="upload-zone" onClick={()=>fileRef.current?.click()}><input type="file" ref={fileRef} accept="image/*" onChange={handleFile} style={{display:"none"}}/>{form.cover?<img src={form.cover} alt="" style={{height:70,borderRadius:6,margin:"0 auto",display:"block",objectFit:"cover"}}/>:<div style={{fontSize:".75rem",color:"rgba(26,26,46,.4)",fontWeight:700}}>📷 Upload</div>}</div></div>
        <div className="form-group"><label className="form-label">RESUMO</label><textarea className="form-textarea" value={form.summary} onChange={e=>set("summary",e.target.value)} placeholder="O que o grupo achou..."/></div>
        <div className="form-group"><label className="form-label">OBSERVAÇÕES</label><textarea className="form-textarea" style={{minHeight:60}} value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Notas gerais..."/></div>
        <div style={{display:"flex",gap:".6rem"}}><button className="btn btn-outline btn-full" onClick={onClose}>Cancelar</button><button className="btn btn-pink btn-full" onClick={async()=>{setSaving(true);await onSave(form);setSaving(false);}} disabled={saving}>{saving?"Salvando...":"SALVAR 💾"}</button></div>
      </div>
    </div>
  );
}

function RateModal({book,currentUser,existingRatings,onClose,onSave}) {
  const myEx=existingRatings.find(r=>r.userId===currentUser.id);
  const [value,setValue]=useState(myEx?.value??null);
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:380}}>
        <div className="modal-handle"/><button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">DAR NOTA ⭐</div>
        <div style={{padding:".75rem",background:"rgba(255,214,0,.08)",borderRadius:10,marginBottom:"1rem",border:"1.5px solid rgba(255,214,0,.3)"}}><div className="book-title">{book.title}</div><div className="book-author">{book.author}</div></div>
        <div className="form-label" style={{marginBottom:".6rem"}}>SUA NOTA (0–10)</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:"1rem"}}>{[0,1,2,3,4,5,6,7,8,9,10].map(n=><button key={n} className={`rating-num-btn${value===n?" sel":""}`} onClick={()=>setValue(n)}>{n}</button>)}</div>
        {value!==null&&<div style={{textAlign:"center",marginBottom:"1rem"}}><div style={{fontSize:"1.1rem",color:"var(--yellow)"}}>{starsFrom(value)}</div><div style={{fontFamily:"var(--fd)",fontSize:"2.5rem",color:"var(--pink)",letterSpacing:"3px"}}>{value}</div></div>}
        <div style={{display:"flex",gap:".6rem"}}><button className="btn btn-outline btn-full" onClick={onClose}>Cancelar</button><button className="btn btn-pink btn-full" disabled={value===null} onClick={()=>onSave({id:myEx?.id||uid(),bookId:book.id,userId:currentUser.id,value})}>CONFIRMAR ⭐</button></div>
      </div>
    </div>
  );
}

// ─── RANKING ──────────────────────────────────────────────────────────────────
function RankingPage({books,members,ratings,getBookAvg}) {
  const [tab,setTab]=useState("books");const [filterYear,setFilterYear]=useState("all");
  const years=[...new Set(books.map(b=>b.date?.split("-")[0]).filter(Boolean))].sort().reverse();
  const ratedBooks=books.filter(b=>getBookAvg(b.id)!==null).filter(b=>filterYear==="all"||b.date?.startsWith(filterYear)).map(b=>({...b,avg:getBookAvg(b.id)})).sort((a,b)=>b.avg-a.avg);
  const top3=ratedBooks.slice(0,3);
  const memberStats=members.filter(m=>m.id!=="adm").map(m=>{const suggested=books.filter(b=>b.suggestedBy===m.id).length;const myR=ratings.filter(r=>r.userId===m.id);const voted=myR.length;const avgGiven=myR.length?(myR.reduce((s,r)=>s+r.value,0)/myR.length).toFixed(1):null;return{...m,suggested,voted,avgGiven};}).sort((a,b)=>b.suggested-a.suggested);
  return(
    <div>
      <div className="page-title">RAN<span className="hi">KING</span></div>
      <div className="page-sub">Os favoritos do clube 🏆</div>
      <div className="tab-bar"><button className={`tab-btn${tab==="books"?" active":""}`} onClick={()=>setTab("books")}>📚 LIVROS</button><button className={`tab-btn${tab==="members"?" active":""}`} onClick={()=>setTab("members")}>👥 MEMBROS</button></div>
      {tab==="books"&&(<>
        <div className="filter-bar">{["all",...years].map(y=><button key={y} className={`chip${filterYear===y?" active":""}`} onClick={()=>setFilterYear(y)}>{y==="all"?"TODOS":y}</button>)}</div>
        {ratedBooks.length===0?<div className="empty"><div className="ico">🏆</div><div className="ttl">SEM RANKING</div><div className="txt">Adicione notas para ver o ranking!</div></div>
        :<>
          <div className="card no-hover" style={{marginBottom:"1.2rem"}}>
            <div style={{fontFamily:"var(--fd)",fontSize:"1.2rem",letterSpacing:"3px",textAlign:"center",marginBottom:"1rem"}}>🏆 PÓDIO</div>
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"center",gap:".4rem",margin:"1rem 0"}}>
              {[top3[1],top3[0],top3[2]].map((b,i)=>{
                if(!b)return<div key={i} style={{flex:1}}/>;
                const place=i===0?2:i===1?1:3;const medals={1:"🥇",2:"🥈",3:"🥉"};const heights={1:110,2:84,3:64};const colors={1:"linear-gradient(180deg,var(--yellow),#FFB800)",2:"linear-gradient(180deg,#D0D0D0,#909090)",3:"linear-gradient(180deg,#CD8B4A,#9E5A1A)"};
                return(<div key={b.id} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:".35rem",maxWidth:110}}>
                  <div style={{fontFamily:"var(--fs)",fontWeight:700,fontSize:".65rem",textAlign:"center",maxWidth:90,lineHeight:1.2,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{b.title}</div>
                  <div style={{fontSize:"1.2rem"}}>{medals[place]}</div>
                  <div style={{width:"100%",borderRadius:"10px 10px 0 0",height:heights[place],background:colors[place],display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:".65rem"}}>
                    <span style={{fontFamily:"var(--fd)",fontSize:"1.6rem",color:"rgba(0,0,0,.6)",letterSpacing:"2px"}}>{fmtNota(b.avg)}</span>
                  </div>
                </div>);
              })}
            </div>
          </div>
          {ratedBooks.map((book,i)=>(
            <div key={book.id} className="rank-row">
              <div className="rank-num" style={{color:i===0?"var(--yellow)":i===1?"#C0C0C0":i===2?"#CD7F32":"rgba(26,26,46,.12)"}}>{i+1}</div>
              {book.cover?<img src={book.cover} alt="" style={{width:38,height:56,borderRadius:6,objectFit:"cover",flexShrink:0}}/>:<div style={{width:38,height:56,borderRadius:6,background:"linear-gradient(135deg,var(--blue),var(--purple))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1rem",flexShrink:0}}>📖</div>}
              <div style={{flex:1,minWidth:0}}><div className="book-title" style={{fontSize:".88rem",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{book.title}</div><div className="book-author">{book.author}</div>{book.date&&<div style={{fontSize:".68rem",color:"rgba(26,26,46,.4)",fontWeight:700}}>{formatMonthYear(book.date?.slice(0,7))}</div>}</div>
              <div style={{textAlign:"center",flexShrink:0}}><div style={{fontFamily:"var(--fd)",fontSize:"1.8rem",color:"var(--pink)",letterSpacing:"2px",lineHeight:1}}>{fmtNota(book.avg)}</div><div style={{fontSize:".62rem",color:"rgba(26,26,46,.3)",fontWeight:800}}>/10</div></div>
            </div>
          ))}
        </>}
      </>)}
      {tab==="members"&&(<div>{memberStats.map(m=>(
        <div key={m.id} className="card no-hover" style={{marginBottom:".6rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
            <MemberAvatar member={m} size={46}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:".92rem"}}>{m.name} <span className={`gender-badge ${m.gender==="f"?"gender-f":"gender-m"}`}>{m.gender==="f"?"Leitora":"Leitor"}</span></div>
              <div style={{display:"flex",gap:".4rem",flexWrap:"wrap",marginTop:5}}>
                <span className="tag tag-blue">📚 {m.suggested} sugestões</span><span className="tag tag-yellow">⭐ {m.voted} votos</span>{m.avgGiven&&<span className="tag tag-pink">Média: {m.avgGiven}</span>}
              </div>
              <div className="progress-bar" style={{marginTop:5}}><div className="progress-fill" style={{width:`${Math.min(100,(m.suggested/Math.max(1,books.length))*100)}%`,background:"var(--blue)"}}/></div>
            </div>
          </div>
        </div>
      ))}</div>)}
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
// Visível para todos — ações de edição só para admin (isAdmin)

// Helper visual: cadeado inline para ações bloqueadas
function LockBadge() {
  return(
    <span title="Apenas admin pode alterar" style={{display:"inline-flex",alignItems:"center",gap:3,background:"rgba(26,26,46,.07)",border:"1.5px solid rgba(26,26,46,.13)",borderRadius:99,padding:"2px 8px",fontSize:".68rem",fontWeight:800,color:"rgba(26,26,46,.4)",flexShrink:0}}>
      🔒 Admin
    </span>
  );
}

function AdminPage({members,books,suggestions,ratings,reviews,setRules,curVotes,setVotes,curElim,setElim,perms,setPerms,currentUser,realMonth,rules,phase,setPhase,showToast,realMonthSugg,powerUses,powerCycle,config,setConfig,viewMonth,isViewingCurrent,viewRules,setViewRules,calendarMonth,isMonthAdvanced}) {
  const [tab,setTab]=useState("members");
  const isAdm=currentUser.isAdmin;
  // Painel → Regras edita o mês visualizado (permite configurar o tema do mês seguinte com antecedência)
  const rulesMonth=isViewingCurrent?realMonth:viewMonth;
  const rulesForMonth=isViewingCurrent?rules:viewRules;
  const setRulesForMonth=isViewingCurrent?setRules:setViewRules;

  // Banner para não-admin
  const ReadOnlyBanner=()=>(
    <div className="alert alert-info" style={{marginBottom:"1rem",alignItems:"center"}}>
      👁️ Você está no modo <strong>visualização</strong>. Apenas o admin pode alterar configurações.
    </div>
  );

  return(
    <div>
      <div className="page-title">PAI<span className="hi">NEL</span> {isAdm&&<span className="adm-crown" style={{fontSize:"1.5rem"}}>👑</span>}</div>
      <div className="page-sub">{isAdm?"Painel de gerenciamento":"Informações do clube"}</div>

      {!isAdm&&<ReadOnlyBanner/>}

      <div className="tab-bar" style={{flexWrap:"wrap"}}>
        <button className={`tab-btn${tab==="members"?" active":""}`} onClick={()=>setTab("members")}>MEMBROS</button>
        <button className={`tab-btn${tab==="perms"?" active":""}`} onClick={()=>setTab("perms")}>PERMISSÕES</button>
        <button className={`tab-btn${tab==="rules"?" active":""}`} onClick={()=>setTab("rules")}>REGRAS</button>
        <button className={`tab-btn${tab==="powers"?" active":""}`} onClick={()=>setTab("powers")}>⚡ PODERES</button>
        <button className={`tab-btn${tab==="phase"?" active":""}`} onClick={()=>setTab("phase")}>FASE</button>
        <button className={`tab-btn${tab==="export"?" active":""}`} onClick={()=>setTab("export")}>EXPORT</button>
      </div>

      {tab==="members" &&<AdminMembers members={members} isAdm={isAdm} showToast={showToast} books={books} ratings={ratings} reviews={reviews} suggestions={suggestions} currentUser={currentUser}/>}
      {tab==="perms"   &&<AdminPerms  members={members} perms={perms} setPerms={setPerms} month={realMonth} isAdm={isAdm} showToast={showToast}/>}
      {tab==="rules"   &&<AdminRules  month={rulesMonth} rules={rulesForMonth} setRules={setRulesForMonth} isAdm={isAdm} showToast={showToast}/>}
      {tab==="powers"  &&<AdminPowers members={members} books={books} powerUses={powerUses} powerCycle={powerCycle} config={config} setConfig={setConfig} isAdm={isAdm} showToast={showToast}/>}
      {tab==="phase"   &&<AdminPhase  phase={phase} setPhase={setPhase} month={realMonth} calendarMonth={calendarMonth} config={config} setConfig={setConfig} isMonthAdvanced={isMonthAdvanced} suggestions={realMonthSugg} curVotes={curVotes} setVotes={setVotes} curElim={curElim} setElim={setElim} isAdm={isAdm} showToast={showToast}/>}
      {tab==="export"  &&<AdminExport books={books} members={members} suggestions={suggestions} ratings={ratings} showToast={showToast}/>}
    </div>
  );
}

// ── ADMIN: MEMBROS ────────────────────────────────────────────────────────────
function AdminMembers({members, isAdm, showToast, books, ratings, reviews, suggestions, currentUser}) {
  const [modal,setModal]=useState(null);
  const [profileModal,setProfileModal]=useState(null); // membro para ver o perfil
  const save=async(m)=>{await FS.set("members",m.id,m);setModal(null);showToast("Membro salvo! ✅");};
  const del=async(id)=>{if(id==="adm")return showToast("Não pode excluir o admin!");await FS.del("members",id);showToast("Membro removido.");};

  return(
    <div>
      <div className="section-header">
        <div className="section-title">MEMBROS <span className="badge badge-navy">{members.length}</span></div>
        {isAdm
          ? <button className="btn btn-pink btn-sm" onClick={()=>setModal("new")}>+ NOVO</button>
          : <LockBadge/>
        }
      </div>

      {members.map(m=>(
        <div key={m.id} className="card no-hover" style={{marginBottom:".55rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:".85rem"}}>
            <MemberAvatar member={m} size={46}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:".9rem"}}>{m.name} {m.isAdmin&&<span className="adm-crown">👑</span>}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:3}}>
                <span className={`gender-badge ${m.gender==="f"?"gender-f":"gender-m"}`}>{m.gender==="f"?"Leitora":"Leitor"}</span>
                {isAdm && (
                  <span className="tag tag-navy" style={{fontFamily:"var(--fd)",letterSpacing:"1px",fontSize:".62rem"}}>
                    🔐 {m.code}
                  </span>
                )}
              </div>
            </div>
            <div style={{display:"flex",gap:".35rem",flexShrink:0}}>
              {/* Ver perfil — disponível para todos */}
              <button className="btn btn-ghost btn-sm" onClick={()=>setProfileModal(m)} title="Ver perfil">👤</button>
              {isAdm&&(
                <>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setModal(m)}>✏️</button>
                  {!m.isAdmin&&<button className="btn btn-danger btn-sm" onClick={()=>del(m.id)}>🗑️</button>}
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      {modal&&<MemberFormModal member={modal==="new"?null:modal} onClose={()=>setModal(null)} onSave={save}/>}

      {/* Profile modal overlay */}
      {profileModal&&(
        <div className="modal-overlay" onClick={()=>setProfileModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-handle"/>
            <button className="modal-close" onClick={()=>setProfileModal(null)}>✕</button>
            <ProfilePage
              currentUser={currentUser}
              members={members}
              books={books}
              ratings={ratings}
              reviews={reviews}
              suggestions={suggestions}
              showToast={showToast}
              viewedMember={profileModal}
              setPage={()=>{}}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MemberFormModal({member,onClose,onSave}) {
  const [form,setForm]=useState(member?{...member}:{id:uid(),name:"",code:"",gender:"f",photo:"",isAdmin:false,color:AVATAR_COLORS[Math.floor(Math.random()*AVATAR_COLORS.length)]});
  const [saving,setSaving]=useState(false);
  const fileRef=useRef();
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const handleFile=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>set("photo",ev.target.result);r.readAsDataURL(f);};
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{maxWidth:420}}>
        <div className="modal-handle"/><button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-title">{member?"EDITAR":"NOVO"} MEMBRO</div>
        <div style={{textAlign:"center",marginBottom:"1rem"}}>
          <MemberAvatar member={form} size={80}/>
          <div><button className="btn btn-ghost btn-sm" style={{marginTop:".5rem"}} onClick={()=>fileRef.current?.click()}>📷 FOTO DE PERFIL</button><input type="file" ref={fileRef} accept="image/*" onChange={handleFile} style={{display:"none"}}/></div>
          <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:".6rem",flexWrap:"wrap"}}>
            {AVATAR_COLORS.map(c=><div key={c} onClick={()=>set("color",c)} style={{width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",border:`3px solid ${form.color===c?"var(--navy)":"transparent"}`,transition:"border .15s"}}/>)}
          </div>
        </div>
        <div className="form-row"><div className="form-group"><label className="form-label">NOME</label><input className="form-input" value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Nome"/></div><div className="form-group"><label className="form-label">CÓDIGO</label><input className="form-input" value={form.code} onChange={e=>set("code",e.target.value)} placeholder="senha123"/></div></div>
        <div className="form-group"><label className="form-label">IDENTIFICAÇÃO</label><select className="form-select" value={form.gender} onChange={e=>set("gender",e.target.value)}><option value="f">Leitora</option><option value="m">Leitor</option></select></div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:".65rem .85rem",background:"rgba(255,214,0,.08)",borderRadius:10,border:"1.5px solid rgba(255,214,0,.25)",marginBottom:".85rem"}}>
          <div>
            <div style={{fontWeight:800,fontSize:".85rem"}}>👑 Permissão de Admin</div>
            <div style={{fontSize:".72rem",color:"rgba(26,26,46,.5)",fontWeight:600}}>Admin pode gerenciar membros, regras e fases</div>
          </div>
          <label className="toggle" style={{marginLeft:"1rem"}}>
            <input type="checkbox" checked={form.isAdmin||false} onChange={e=>set("isAdmin",e.target.checked)}/>
            <div className="toggle-track"><div className="toggle-thumb"/></div>
          </label>
        </div>
        <div style={{display:"flex",gap:".6rem"}}><button className="btn btn-outline btn-full" onClick={onClose}>Cancelar</button><button className="btn btn-pink btn-full" disabled={!form.name||!form.code||saving} onClick={async()=>{setSaving(true);await onSave(form);setSaving(false);}}>{saving?"Salvando...":"SALVAR ✅"}</button></div>
      </div>
    </div>
  );
}

// ── ADMIN: PERMISSÕES ─────────────────────────────────────────────────────────
function AdminPerms({members, perms, setPerms, month, isAdm, showToast}) {
  const [lp,setLp]=useState({...perms});
  const toggle=(memberId,action)=>{
    if(!isAdm)return; // guard extra — UI já bloqueia
    const curr=lp[memberId]||{};
    const key=`can${action.charAt(0).toUpperCase()+action.slice(1)}`;
    setLp(p=>({...p,[memberId]:{...curr,[key]:curr[key]===false?true:false}}));
  };
  const save=async()=>{await setPerms(lp);showToast("Permissões salvas! ✅");};

  return(
    <div>
      <div className="alert alert-info" style={{marginBottom:"1rem"}}>
        {isAdm?"Defina quem pode fazer o que neste mês. Desativado = bloqueado.":"Visualize as permissões do mês. Apenas admin pode alterar."}
      </div>

      {members.filter(m=>m.id!=="adm").map(m=>{
        const mp=lp[m.id]||{};
        return(
          <div key={m.id} className="card no-hover" style={{marginBottom:".65rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:".75rem"}}>
              <MemberAvatar member={m} size={36}/>
              <div style={{fontWeight:800,fontSize:".9rem"}}>{m.name}</div>
              {!isAdm&&<LockBadge/>}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:".5rem"}}>
              {[["suggest","Sugerir livros","💡"],["elim","Eliminar livros","❌"],["vote","Votar na eliminação","🗳️"]].map(([action,label,ico])=>{
                const key=`can${action.charAt(0).toUpperCase()+action.slice(1)}`;
                const isOn=mp[key]!==false;
                return(
                  <div key={action} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:".35rem .5rem",borderRadius:8,background:isOn?"rgba(45,171,111,.06)":"rgba(232,39,42,.04)"}}>
                    <span style={{fontSize:".82rem",fontWeight:700}}>{ico} {label}</span>
                    {isAdm?(
                      // Admin: toggle funcional
                      <label className="toggle" style={{cursor:"pointer"}}>
                        <input type="checkbox" checked={isOn} onChange={()=>toggle(m.id,action)}/>
                        <div className="toggle-track"><div className="toggle-thumb"/></div>
                      </label>
                    ):(
                      // Não-admin: toggle visual somente leitura
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:".72rem",fontWeight:800,color:isOn?"var(--green)":"var(--red)"}}>
                          {isOn?"✅ Liberado":"❌ Bloqueado"}
                        </span>
                        <div className="toggle-track" style={{opacity:.5,pointerEvents:"none"}}>
                          <div className="toggle-thumb" style={{transform:isOn?"translateX(18px)":"none"}}/>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {isAdm&&<button className="btn btn-pink btn-full" onClick={save}>SALVAR PERMISSÕES ✅</button>}
    </div>
  );
}

// ── ADMIN: PODERES ────────────────────────────────────────────────────────────
function AdminPowers({members,books,powerUses,powerCycle,config,setConfig,isAdm,showToast}) {
  const [start,setStart]=useState(config.powerCycleStart);
  const [range0,range1]=cycleRangeFor(powerCycle,config.powerCycleStart);
  const save=async()=>{await setConfig({powerCycleStart:start});showToast("Ciclo de poderes salvo! ✅");};
  const liberar=async(memberId)=>{await FS.del("powerUses",`${memberId}_${powerCycle}`);showToast("Poder liberado neste ciclo. 🔓");};
  const clube=members.filter(m=>m.id!=="adm");

  // Registro de bloqueios em mês livre neste ciclo (regra: quem já ganhou em mês livre não sugere de novo em mês livre até o próximo ciclo)
  const freeWins=clube.map(m=>({member:m,book:books.find(b=>b.suggestedBy===m.id&&b.wasThemed===false&&b.date&&cycleIndexFor(b.date.slice(0,7),config.powerCycleStart)===powerCycle)})).filter(x=>x.book);

  return(
    <div>
      <div className="card no-hover" style={{marginBottom:"1rem"}}>
        <div style={{fontFamily:"var(--fd)",fontSize:".9rem",letterSpacing:"2px",marginBottom:".5rem"}}>⚡ CICLO ATUAL</div>
        <div style={{fontSize:".85rem",fontWeight:700}}>Ciclo #{powerCycle+1} · {formatMonthShort(range0)} — {formatMonthShort(range1)}</div>
        <div style={{fontSize:".72rem",color:"rgba(26,26,46,.5)",fontWeight:600,marginTop:4}}>Cada membro usa 1 poder por ciclo de 14 meses. O ciclo é o mesmo para todo o clube.</div>
        {isAdm&&(
          <>
            <div className="divider"/>
            <div className="form-group">
              <label className="form-label">INÍCIO DO CICLO 1 (AAAA-MM)</label>
              <input className="form-input" placeholder="2025-01" value={start} onChange={e=>setStart(e.target.value)}/>
            </div>
            <button className="btn btn-pink btn-full" onClick={save}>SALVAR CICLO ✅</button>
          </>
        )}
      </div>

      {clube.map(m=>{
        const use=powerUses.find(p=>p.memberId===m.id&&p.cycle===powerCycle);
        return(
          <div key={m.id} className="card no-hover" style={{marginBottom:".55rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:".75rem"}}>
              <MemberAvatar member={m} size={36}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:".88rem"}}>{m.name}</div>
                {use
                  ?<div style={{fontSize:".72rem",color:"var(--orange)",fontWeight:700}}>Usado: {powerLabel(use.power)} em {formatMonthShort(use.month)}</div>
                  :<div style={{fontSize:".72rem",color:"var(--green)",fontWeight:700}}>Disponível</div>}
              </div>
              {isAdm&&use&&<button className="btn btn-outline btn-sm" onClick={()=>liberar(m.id)}>🔓 Liberar</button>}
            </div>
          </div>
        );
      })}

      <div className="divider"/>
      <div style={{fontFamily:"var(--fd)",fontSize:".85rem",letterSpacing:"2px",marginBottom:".6rem"}}>🚫 BLOQUEIOS EM MÊS LIVRE (ESTE CICLO)</div>
      {freeWins.length===0?(
        <div style={{fontSize:".78rem",color:"rgba(26,26,46,.45)",fontWeight:600}}>Ninguém está bloqueado neste ciclo.</div>
      ):freeWins.map(({member,book})=>(
        <div key={member.id} className="card no-hover" style={{marginBottom:".5rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:".7rem"}}>
            <MemberAvatar member={member} size={32}/>
            <div style={{flex:1,fontSize:".78rem"}}><strong>{member.name}</strong> ganhou com <strong>"{book.title}"</strong> em {formatMonthShort(book.date?.slice(0,7))} — não pode sugerir em mês livre até o próximo ciclo.</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ADMIN: REGRAS ─────────────────────────────────────────────────────────────
function AdminRules({month, rules, setRules, isAdm, showToast}) {
  const [form,setForm]=useState({...rules});
  // Re-sincroniza o formulário ao trocar de mês (ex: alternar entre mês atual e mês seguinte)
  useEffect(()=>{setForm({...rules})},[month]);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=async()=>{await setRules(form);showToast("Regras salvas! ✅");};
  const days=["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
  const ro=!isAdm; // read-only

  return(
    <div>
      <div className="card no-hover" style={{marginBottom:"1rem"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
          <div style={{fontFamily:"var(--fd)",fontSize:"1rem",letterSpacing:"2px"}}>REGRAS DE {formatMonthYear(month).toUpperCase()}</div>
          {!isAdm&&<LockBadge/>}
        </div>

        <div className="form-group">
          <label className="form-label">LIMITE DE SUGESTÕES POR MEMBRO</label>
          <input className="form-input" type="number" min={1} max={5} value={form.suggLimit} onChange={e=>set("suggLimit",parseInt(e.target.value))} disabled={ro}/>
        </div>
        <div className="form-group">
          <label className="form-label">VOTOS MÁXIMOS P/ ELIMINAÇÃO</label>
          <input className="form-input" type="number" min={1} max={5} value={form.maxElimVotes||2} onChange={e=>set("maxElimVotes",parseInt(e.target.value))} disabled={ro}/>
        </div>

        <div className="divider"/>
        <div style={{fontFamily:"var(--fd)",fontSize:".9rem",letterSpacing:"2px",marginBottom:".75rem"}}>📅 ENCONTROS</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">DIA DA SEMANA</label>
            <select className="form-select" value={form.meetingDay||""} onChange={e=>set("meetingDay",e.target.value)} disabled={ro}>
              <option value="">— Nenhum —</option>
              {days.map(d=><option key={d} value={d.toLowerCase()}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">HORÁRIO</label>
            <input className="form-input" type="time" value={form.meetingTime||""} onChange={e=>set("meetingTime",e.target.value)} disabled={ro}/>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">LOCAL / LINK</label>
          <input className="form-input" value={form.meetingLocal||""} onChange={e=>set("meetingLocal",e.target.value)} placeholder="Ex: Casa da Carol / meet.google.com/..." disabled={ro}/>
        </div>

        <div className="divider"/>
        <div style={{display:"flex",alignItems:"center",gap:".75rem",marginBottom:"1rem"}}>
          <label className="toggle" style={{cursor:ro?"default":"pointer"}}>
            <input type="checkbox" checked={form.hasTheme||false} onChange={e=>!ro&&set("hasTheme",e.target.checked)} disabled={ro}/>
            <div className="toggle-track"><div className="toggle-thumb"/></div>
            <span style={{fontSize:".85rem",fontWeight:700}}>Tem tema obrigatório</span>
          </label>
        </div>
        {form.hasTheme&&(
          <div className="form-group">
            <label className="form-label">TEMA DO MÊS</label>
            <input className="form-input" value={form.theme||""} onChange={e=>set("theme",e.target.value)} placeholder="Ex: literatura latino-americana" disabled={ro}/>
          </div>
        )}

        {isAdm&&<button className="btn btn-pink btn-full" onClick={save}>SALVAR REGRAS ✅</button>}
      </div>
    </div>
  );
}

// ── ADMIN: FASE ───────────────────────────────────────────────────────────────
function AdminPhase({phase, setPhase, month, calendarMonth, config, setConfig, isMonthAdvanced, suggestions, curVotes, setVotes, curElim, setElim, isAdm, showToast}) {
  const phases=[
    {id:"suggest",label:"Sugestões abertas",  ico:"💡",color:"var(--green)"},
    {id:"vote",   label:"Votação/Eliminação",  ico:"🗳️",color:"var(--orange)"},
    {id:"raffle", label:"Sorteio",              ico:"🎲",color:"var(--purple)"},
    {id:"reading",label:"Leitura em andamento",ico:"📖",color:"var(--blue)"},
    {id:"done",   label:"Leitura concluída",   ico:"✅",color:"var(--teal)"},
  ];

  const resetMonth=async()=>{
    if(!confirm("Resetar sugestões, votos e eliminações do mês atual?"))return;
    const toDelete=suggestions.filter(s=>s.month===month);
    await Promise.all(toDelete.map(s=>FS.del("suggestions",s.id)));
    await setVotes({});await setElim({});await setPhase("suggest");
    showToast("Mês resetado! 🔄");
  };

  const advanceMonth=async()=>{
    const next=addMonths(month,1);
    if(!confirm(`Isso faz o app inteiro (pra todo mundo) tratar ${formatMonthYear(next)} como o mês atual, antes do calendário virar. Continuar?`))return;
    await setConfig({...config,monthOverride:next});
    showToast(`⏩ Mês adiantado para ${formatMonthYear(next)}!`);
  };
  const revertMonth=async()=>{
    await setConfig({...config,monthOverride:null});
    showToast("Mês voltou a acompanhar o calendário real.");
  };

  return(
    <div>
      {isAdm&&(
        <div className="card no-hover" style={{marginBottom:"1rem",borderColor:"var(--purple)"}}>
          <div style={{fontFamily:"var(--fd)",fontSize:"1rem",letterSpacing:"2px",color:"var(--purple)",marginBottom:".5rem"}}>⏩ ADIANTAR MÊS</div>
          <div style={{fontSize:".78rem",color:"rgba(26,26,46,.55)",fontWeight:600,marginBottom:".75rem"}}>
            {isMonthAdvanced
              ?<>O clube está adiantado: todo mundo está usando <strong>{formatMonthYear(month)}</strong> como mês atual (o calendário real ainda está em {formatMonthYear(calendarMonth)}). Isso volta sozinho quando o calendário alcançar.</>
              :<>Faz o app inteiro pular pro mês seguinte ({formatMonthYear(addMonths(month,1))}) antes do calendário virar — útil pra fazer eliminação/votação/sorteio com antecedência.</>}
          </div>
          {isMonthAdvanced
            ?<button className="btn btn-ghost btn-full" onClick={revertMonth}>↩️ Voltar para o mês real ({formatMonthYear(calendarMonth)})</button>
            :<button className="btn btn-outline btn-full" style={{borderColor:"var(--purple)",color:"var(--purple)"}} onClick={advanceMonth}>⏩ Adiantar para {formatMonthYear(addMonths(month,1))}</button>}
        </div>
      )}

      <div className="card no-hover" style={{marginBottom:"1rem"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
          <div style={{fontFamily:"var(--fd)",fontSize:"1rem",letterSpacing:"2px"}}>
            FASE ATUAL: <span style={{color:"var(--pink)"}}>{phases.find(p=>p.id===phase)?.label?.toUpperCase()||phase.toUpperCase()}</span>
          </div>
          {!isAdm&&<LockBadge/>}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:".5rem"}}>
          {phases.map(p=>(
            <button key={p.id}
              className="btn btn-full"
              style={{
                background:phase===p.id?p.color:"rgba(26,26,46,.06)",
                color:phase===p.id?"white":"rgba(26,26,46,.6)",
                justifyContent:"flex-start",gap:".65rem",
                cursor:isAdm?"pointer":"default",
                opacity:!isAdm&&phase!==p.id?.6:1,
              }}
              onClick={async()=>{ if(!isAdm)return; await setPhase(p.id); showToast(`Fase: ${p.label}`); }}
            >
              <span style={{fontSize:"1.1rem"}}>{p.ico}</span>
              {p.label}
              {phase===p.id&&<span style={{marginLeft:"auto",fontSize:".75rem"}}>← ATUAL</span>}
              {!isAdm&&phase!==p.id&&<span style={{marginLeft:"auto",fontSize:".7rem",opacity:.4}}>🔒</span>}
            </button>
          ))}
        </div>
      </div>

      {isAdm&&(
        <div className="card no-hover" style={{borderColor:"var(--red)"}}>
          <div style={{fontFamily:"var(--fd)",fontSize:"1rem",letterSpacing:"2px",color:"var(--red)",marginBottom:"1rem"}}>⚠️ AÇÕES</div>
          <button className="btn btn-danger btn-full" onClick={resetMonth}>🔄 RESETAR MÊS ATUAL</button>
        </div>
      )}
    </div>
  );
}

// ── ADMIN: EXPORT (visível para todos) ────────────────────────────────────────
function AdminExport({books, members, suggestions, ratings, showToast}) {
  const exp=(type)=>{
    let content,filename,mime;
    if(type==="json"){
      content=JSON.stringify({version:4.5,exportedAt:new Date().toISOString(),books,members,suggestions,ratings},null,2);
      filename=`livre-do-clubo-${new Date().toISOString().slice(0,10)}.json`;
      mime="application/json";
    } else {
      const rows=[["Título","Autor","Tema","Mês","Páginas","Média","Sugerido por"]];
      books.forEach(b=>{
        const avg=ratings.filter(r=>r.bookId===b.id);
        const media=avg.length?(avg.reduce((s,r)=>s+r.value,0)/avg.length).toFixed(1):"";
        const sug=members.find(m=>m.id===b.suggestedBy)?.name||"";
        rows.push([b.title,b.author,b.theme,b.date,b.pages,media,sug]);
      });
      content="\uFEFF"+rows.map(r=>r.map(c=>`"${(c||"").toString().replace(/"/g,'""')}"`).join(",")).join("\n");
      filename=`livre-do-clubo-${new Date().toISOString().slice(0,10)}.csv`;
      mime="text/csv;charset=utf-8";
    }
    const blob=new Blob([content],{type:mime});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=filename;a.click();
    URL.revokeObjectURL(url);
    showToast(`${type.toUpperCase()} exportado! 📦`);
  };

  return(
    <div>
      <div className="card no-hover">
        <div style={{fontFamily:"var(--fd)",fontSize:"1rem",letterSpacing:"2px",marginBottom:"1rem"}}>EXPORTAR DADOS 📤</div>
        <div style={{fontSize:".8rem",color:"rgba(26,26,46,.5)",fontWeight:600,marginBottom:".85rem"}}>
          Qualquer membro pode exportar os dados do clube.
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:".6rem"}}>
          <button className="btn btn-navy btn-full" onClick={()=>exp("json")}>📦 EXPORTAR JSON COMPLETO</button>
          <button className="btn btn-ghost btn-full" onClick={()=>exp("csv")}>📊 EXPORTAR LIVROS EM CSV</button>
        </div>
      </div>
    </div>
  );
}

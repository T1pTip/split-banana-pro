// ============================================================
// pae-video-module.js — Palette AI Video Mode (v1.0)
// Adds video prompt generation alongside the existing image mode.
// Uses MyMemory API (free, no key) for Hebrew→English translation.
// Pattern follows pae-v2-module.js (IIFE, install guard, polling boot).
// ============================================================

(function() {
  if (window.__paeVideoInstalled) return;
  window.__paeVideoInstalled = true;
  function _log(m) { try { console.log('[pae-video]', m); } catch(e){} }

  // ============================================================
  // DATA — Video pills (he label / en value used in prompt / kids flag)
  // ============================================================
  var VIDEO_DATA = {
    camera: { he:'תנועת מצלמה', en:'Camera', emoji:'🎬', pills:[
      {he:'זום פנימה איטי', en:'slow zoom in', kids:true},
      {he:'זום החוצה', en:'slow zoom out', kids:true},
      {he:'דולי שמאל', en:'dolly left tracking', kids:true},
      {he:'דולי ימין', en:'dolly right tracking', kids:true},
      {he:'מבט ציפור', en:'birds eye view from above', kids:true},
      {he:'POV', en:'first person POV shot', kids:false},
      {he:'אורבית', en:'orbit camera around subject', kids:true},
      {he:'מצלמת יד', en:'handheld shaky camera', kids:false},
      {he:'מנוף אווירי', en:'aerial crane shot', kids:true},
      {he:'דחיפה דרמטית', en:'dramatic push in', kids:false}
    ]},
    motion: { he:'סגנון תנועה', en:'Motion', emoji:'🎭', pills:[
      {he:'קולנועי איטי', en:'cinematic slow movement', kids:true},
      {he:'הילוך איטי', en:'slow motion', kids:true},
      {he:'טיים-לאפס', en:'timelapse', kids:true},
      {he:'הייפר-לאפס', en:'hyperlapse', kids:false},
      {he:'לופ חלק', en:'seamless loop', kids:true},
      {he:'תנועה זורמת', en:'fluid flowing motion', kids:true}
    ]},
    lighting: { he:'תאורה', en:'Lighting', emoji:'💡', pills:[
      {he:'שקיעה זהובה', en:'golden hour sunset', kids:true},
      {he:'אור יום', en:'bright daylight', kids:true},
      {he:'דמדומים', en:'twilight blue hour', kids:true},
      {he:'לילה', en:'night scene', kids:false},
      {he:'ניאון', en:'neon lights', kids:false},
      {he:'אור ירח', en:'soft moonlight', kids:true}
    ]}
  };

  Object.assign(VIDEO_DATA, {
    filmStyle: { he:'סגנון סרטים', en:'Film Style', emoji:'🎞️', pills:[
      {he:'IMAX אפי', en:'IMAX epic cinematic', kids:true},
      {he:'בלייד ראנר', en:'blade runner cyberpunk style', kids:false},
      {he:'קובריק', en:'kubrick symmetrical composition', kids:false},
      {he:'גיבלי חלומי', en:'studio ghibli dreamy aesthetic', kids:true},
      {he:'פיקסאר 3D', en:'pixar 3d animation style', kids:true}
    ]},
    genre: { he:'ז׳אנר', en:'Genre', emoji:'🎟️', pills:[
      {he:'הרפתקה', en:'adventure', kids:true},
      {he:'מדע בדיוני', en:'science fiction', kids:false},
      {he:'סייברפאנק', en:'cyberpunk', kids:false},
      {he:'נואר', en:'film noir', kids:false},
      {he:'פנטזיה', en:'fantasy', kids:true},
      {he:'דוקומנטרי', en:'documentary style', kids:true}
    ]},
    environment: { he:'סביבה', en:'Environment', emoji:'🌆', pills:[
      {he:'יער קסום', en:'enchanted forest', kids:true},
      {he:'עיר עתידנית', en:'futuristic city', kids:false},
      {he:'חוף ים', en:'tropical beach', kids:true},
      {he:'הרים מושלגים', en:'snowy mountains', kids:true},
      {he:'מדבר', en:'desert dunes', kids:true},
      {he:'תחנת חלל', en:'space station interior', kids:true}
    ]},
    weather: { he:'מזג אוויר', en:'Weather', emoji:'🌊', pills:[
      {he:'גשם ניאון', en:'neon rain', kids:false},
      {he:'ערפל בוקר', en:'morning mist', kids:true},
      {he:'שלג ראשון', en:'first snow falling', kids:true},
      {he:'סערת ברק', en:'thunderstorm with lightning', kids:false},
      {he:'גלי ים', en:'crashing ocean waves', kids:true}
    ]},
    effects: { he:'אפקטים', en:'Effects', emoji:'✨', pills:[
      {he:'עשן ואדים', en:'smoke and steam', kids:true},
      {he:'אורות חלקיקים', en:'particle lights floating', kids:true},
      {he:'הולוגרמה', en:'holographic display', kids:false},
      {he:'גליץ', en:'glitch effect', kids:false},
      {he:'פריזמה', en:'prism light refraction', kids:true}
    ]}
  });

  var KIDS_SUBJECTS = [
    'דרקון חמוד מעופף מעל ממלכת ממתקים',
    'שועל קטן רץ ביער שלג מנצנץ',
    'אסטרונאוט קטן קופץ על הירח',
    'יוניקורן רץ באחו פרחים צבעוניים',
    'דובון פנדה משחק בשלג ראשון',
    'דג זהב שוחה במים זוהרים',
    'ברווזון קטן שוחה באגם בשקיעה',
    'תינוק פיל מתיז מים על עצמו',
    'חתלתול שובב מנסה לתפוס פרפר',
    'רובוט חמוד אופה עוגיות במטבח',
    'עכבר קטן לובש כובע ענק'
  ];

  var ADULT_SUBJECTS = [
    'אישה צעירה הולכת ברחוב גשום בלילה',
    'מכונית ספורט נוסעת בכביש הרים בשקיעה',
    'גבר עומד על גג גורד שחקים בעיר ניאון',
    'יד מוזגת קפה לכוס שקופה בהילוך איטי',
    'גלגל ענק במזח בלילה מואר',
    'בלרינה רוקדת על במה ריקה תחת זרקור',
    'איש בחליפה רץ בעיר בלילה גשום',
    'סוס פראי דוהר במישור בזריחה',
    'דובי קוטב הולך על קרחון',
    'נר נדלק בחדר חשוך ויוצר צללים'
  ];

  var ADULT_PRESETS = [
    {camera:'slow zoom in', motion:'cinematic slow movement', lighting:'golden hour sunset', filmStyle:'IMAX epic cinematic'},
    {camera:'birds eye view from above', motion:'fluid flowing motion', lighting:'bright daylight', genre:'documentary style'},
    {camera:'orbit camera around subject', motion:'cinematic slow movement', lighting:'twilight blue hour', filmStyle:'IMAX epic cinematic'},
    {camera:'dolly left tracking', motion:'slow motion', lighting:'soft moonlight', filmStyle:'studio ghibli dreamy aesthetic'},
    {camera:'aerial crane shot', motion:'fluid flowing motion', lighting:'golden hour sunset', environment:'tropical beach'},
    {camera:'dramatic push in', motion:'slow motion', lighting:'neon lights', filmStyle:'blade runner cyberpunk style'},
    {camera:'first person POV shot', motion:'fluid flowing motion', lighting:'bright daylight', environment:'enchanted forest'}
  ];

  var KIDS_PRESETS = [
    {camera:'slow zoom in', motion:'cinematic slow movement', lighting:'golden hour sunset', filmStyle:'studio ghibli dreamy aesthetic'},
    {camera:'orbit camera around subject', motion:'fluid flowing motion', lighting:'bright daylight', filmStyle:'pixar 3d animation style'},
    {camera:'birds eye view from above', motion:'seamless loop', lighting:'soft moonlight', environment:'enchanted forest'},
    {camera:'aerial crane shot', motion:'cinematic slow movement', lighting:'golden hour sunset'},
    {camera:'dolly left tracking', motion:'slow motion', lighting:'twilight blue hour', filmStyle:'studio ghibli dreamy aesthetic'}
  ];

  var PLATFORMS = {
    kling:  { url:'https://app.klingai.com/global/text-to-video/new', label:'Kling',  emoji:'🎬' },
    pika:   { url:'https://pika.art/',                                 label:'Pika',   emoji:'🌀' },
    runway: { url:'https://app.runwayml.com/',                         label:'Runway', emoji:'🚀' }
  };

  var DURATIONS = ['3','5','10'];

  // ============================================================
  // VIDEO GUIDE SLIDES (he/en, 6 slides)
  // ============================================================
  var VID_GUIDE = {
    he: [
      { emoji:'🎬', title:'מצב וידאו — חדש!', subtitle:'יוצרים פרומפטים מקצועיים לוידאו AI', body:'מצב הוידאו של Palette AI עוזר לך לבנות פרומפטים איכותיים ל-Kling, Pika ו-Runway — בעברית פשוטה, עם תרגום אוטומטי לאנגלית.' },
      { emoji:'✍️', title:'שלב 1: תאר/י את הסצנה', subtitle:'בעברית פשוטה — נתרגם אוטומטית', body:'כתוב/י איזו סצנה את/ה רוצה. למשל: "חתול שחור רץ על גג בלילה". הטקסט יתורגם אוטומטית לאנגלית מקצועית כשתבנה/י את הפרומפט.' },
      { emoji:'🎬', title:'שלב 2: בחר/י תנועת מצלמה', subtitle:'הלב של כל סרטון AI', body:'תנועת מצלמה היא הדבר הכי חשוב בפרומפט וידאו. בחר/י zoom איטי, dolly, orbit, או מבט ציפור — כל אחד יוצר תחושה אחרת.' },
      { emoji:'🎭', title:'שלב 3: שלב/י סגנון', subtitle:'תאורה + ז׳אנר + אפקטים', body:'הוסף/י תאורה (שקיעה, לילה, ניאון), סגנון סרטים (IMAX, גיבלי, פיקסאר), וז׳אנר. כל הקטגוריות תמיד גלויות — אין צורך לחפש.' },
      { emoji:'🎁', title:'לא יודע/ת? הפתעה!', subtitle:'קומבינציות מוכנות מראש', body:'לחיצה על "🎁 הפתעה!" בוחרת קומבינציה מקצועית של תנועה + תאורה + סגנון, יחד עם נושא רנדומלי. תוצאות איכותיות בלחיצה אחת.' },
      { emoji:'🚀', title:'יאללה, מצלמים!', subtitle:'Kling, Pika, או Runway', body:'לחיצה על Kling/Pika/Runway מעתיקה את הפרומפט ופותחת את האתר. הדבק/י עם Ctrl+V או ⌘V — וה-AI יצור את הסרטון!' }
    ],
    en: [
      { emoji:'🎬', title:'Video Mode — New!', subtitle:'Create pro AI video prompts', body:'Palette AI Video Mode helps you build professional prompts for Kling, Pika, and Runway — in plain Hebrew or English, with auto-translation.' },
      { emoji:'✍️', title:'Step 1: Describe the scene', subtitle:'Hebrew or English — auto-translated', body:'Type any scene you want. E.g., "black cat running on a rooftop at night". Hebrew gets auto-translated to professional English when you build the prompt.' },
      { emoji:'🎬', title:'Step 2: Pick camera movement', subtitle:'The heart of any AI video', body:'Camera movement is the most important part. Pick slow zoom, dolly, orbit, or birds eye view — each creates a different feeling.' },
      { emoji:'🎭', title:'Step 3: Layer the style', subtitle:'Lighting + Genre + Effects', body:'Add lighting (sunset, night, neon), film style (IMAX, Ghibli, Pixar), and genre. All categories always visible — no searching needed.' },
      { emoji:'🎁', title:'Not sure? Surprise!', subtitle:'Pre-built combinations', body:'Click "🎁 Surprise!" to pick a professional preset of motion + lighting + style with a random subject. Quality results in one click.' },
      { emoji:'🚀', title:"Let's roll!", subtitle:'Kling, Pika, or Runway', body:'Click Kling/Pika/Runway to copy the prompt and open the platform. Paste with Ctrl+V or ⌘V — and the AI generates your video!' }
    ]
  };

  var T = {
    modeImg: { he:'🖼️ תמונה', en:'🖼️ Image' },
    modeVid: { he:'🎬 וידאו', en:'🎬 Video' },
    placeholder: { he:'תאר/י את הסצנה (עברית או אנגלית)…', en:'Describe the scene (Hebrew or English)…' },
    duration: { he:'⏱ אורך', en:'⏱ Duration' },
    sec: { he:'שניות', en:'sec' },
    promptReady: { he:'פרומפט וידאו מוכן', en:'Video prompt ready' },
    promptEmpty: { he:'תאר/י סצנה ובחר/י תנועה כדי לבנות פרומפט', en:'Describe a scene and pick movement to build prompt' },
    chars: { he:'תווים', en:'chars' },
    translating: { he:'מתרגם…', en:'Translating…' },
    copied: { he:'✅ הועתק! הדבק/י ב-', en:'✅ Copied! Paste in ' },
    pasteHint: { he:' — Ctrl+V / ⌘V', en:' — Ctrl+V / ⌘V' },
    surprise: { he:'🎁 הפתעה!', en:'🎁 Surprise!' },
    kids: { he:'מצב ילדים', en:'Kids mode' },
    adults: { he:'מצב מבוגרים', en:'Adults mode' },
    share: { he:'📤 שתף/י', en:'📤 Share' },
    clear: { he:'נקה/י', en:'Clear' },
    copyPrompt: { he:'📋 העתק/י פרומפט', en:'📋 Copy prompt' },
    payboxTitle: { he:'אהבת? כייף עם בירה', en:'Liked it? Buy me a beer' },
    paybox: { he:'תשלום מאובטח · PayBox', en:'Secure · PayBox' },
    guideBtn: { he:'🎬 מדריך וידאו', en:'🎬 Video Guide' },
    skip: { he:'דלג', en:'Skip' },
    next: { he:'הבא ←', en:'Next →' },
    back: { he:'→ חזור', en:'← Back' },
    start: { he:'יאללה, נתחיל! ✨', en:"Let's go! ✨" },
    secLabel: { he:'שניות', en:'seconds' }
  };

  // ============================================================
  // STATE
  // ============================================================
  var state = {
    mode: 'img',
    selectedPills: {},
    duration: '5',
    kidsMode: false,
    lastVideoPrompt: '',
    translationCache: {},
    guideSlide: 0
  };

  function getLang() {
    return document.documentElement.getAttribute('lang') === 'en' ? 'en' : 'he';
  }
  function isHebrew(text) {
    return /[\u05D0-\u05EA]/.test(text || '');
  }
  function tr(key) {
    var l = getLang();
    return (T[key] && T[key][l]) || (T[key] && T[key].he) || key;
  }
  function toast(msg, type) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = 'show' + (type ? ' toast-' + type : '');
    clearTimeout(window.__vidToastT);
    window.__vidToastT = setTimeout(function() { el.classList.remove('show'); }, 3500);
  }

  // ============================================================
  // CSS
  // ============================================================
  function injectStyles() {
    if (document.getElementById('__pae_video_styles')) return;
    var st = document.createElement('style');
    st.id = '__pae_video_styles';
    st.textContent = [
      '.mode-tabs{display:flex;gap:0;background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:54px;z-index:99;backdrop-filter:blur(8px)}',
      '.mode-tab{flex:1;padding:10px 8px;text-align:center;font-size:13px;font-weight:600;color:var(--muted);cursor:pointer;border:none;background:transparent;border-bottom:2px solid transparent;font-family:inherit;transition:all .15s;touch-action:manipulation;-webkit-tap-highlight-color:transparent;min-height:44px}',
      '.mode-tab.active{color:#fff;border-bottom-color:var(--accent)}',
      '.mode-tab:active{opacity:.7}',
      '.vid-page{display:none;padding:14px;flex-direction:column;gap:12px}',
      '.vid-page.active{display:flex}',
      'body.vid-mode .app{display:none !important}',
      'body.vid-mode .format-row,body.vid-mode .random-divider{display:none !important}',
      '.vid-page .pae-section-header{font-size:13px;font-weight:600;color:var(--muted);display:flex;align-items:center;gap:5px;margin-bottom:6px}',
      '.vid-page #vidInput{width:100%;min-height:80px;background:var(--surface);border:1px solid var(--border);border-radius:var(--r);color:var(--text);padding:12px 14px;font-family:inherit;font-size:16px;line-height:1.6;outline:none;resize:none;-webkit-appearance:none}',
      '.vid-page #vidInput:focus{border-color:var(--a4)}',
      '.vid-page #vidInput::placeholder{color:var(--muted)}',
      '.vid-pill-section{display:flex;flex-direction:column;gap:6px}',
      '.vid-pills{display:grid;grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:6px}',
      '.vid-pill.tag-hidden{display:none !important}',
      '.vid-result-box{background:var(--surface);border:1px solid var(--a2);border-radius:var(--r);overflow:hidden}',
      '.vid-result-top{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;border-bottom:1px solid var(--border);background:var(--a1)}',
      '.vid-result-label{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.7px}',
      '.vid-result-count{font-size:11px;color:var(--muted)}',
      '#vidFinalPrompt{padding:12px 14px;font-family:"JetBrains Mono",monospace;font-size:12px;line-height:1.7;color:var(--teal);min-height:60px;white-space:pre-wrap;word-break:break-word}',
      '#vidFinalPrompt.empty{color:var(--muted);font-family:inherit;font-size:13px}',
      '.vid-platform-row{display:flex;gap:7px}',
      '.vid-plat-btn{flex:1;background:var(--surface2);border:1px solid rgba(0,229,150,.25);color:#00e596;border-radius:var(--r-sm);padding:11px 8px;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;min-height:44px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:all .15s;white-space:nowrap}',
      '.vid-plat-btn:active{opacity:.85;transform:scale(.97)}',
      '.vid-plat-btn:hover{background:rgba(0,229,150,.08);border-color:rgba(0,229,150,.45)}',
      '.vid-action-row{display:flex;gap:7px}',
      '.vid-pb-btn{display:flex;align-items:center;gap:10px;padding:11px 14px;background:#1a0f00;border:1px solid rgba(255,165,0,.2);border-radius:var(--r);cursor:pointer;color:#FFB800;text-decoration:none;width:100%;text-align:right;font-family:inherit;min-height:44px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
      '.vid-pb-btn:active{opacity:.85}',
      '.vid-pb-ico{width:34px;height:34px;background:rgba(255,165,0,.1);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}',
      '.vid-pb-text{flex:1;text-align:right}',
      '.vid-pb-t{font-size:13px;font-weight:700;color:#FFB800}',
      '.vid-pb-s{font-size:11px;color:#a07840;margin-top:1px}',
      '.vid-kids-area{display:flex;align-items:center;gap:6px;padding:6px 0}',
      '.vid-split-wrap{display:flex;align-items:stretch;border-radius:14px;overflow:hidden;border:1.5px solid var(--a3);background:var(--surface2);width:100%}',
      '.vid-kids-btn,.vid-adults-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:8px 10px;border:none;cursor:pointer;font-family:inherit;flex:1;min-height:54px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
      '.vid-kids-btn{background:rgba(255,210,60,.08);border-left:1.5px solid rgba(255,200,60,.12);color:rgba(255,220,100,.4)}',
      '.vid-kids-btn.on{background:rgba(255,210,60,.26);border-left-color:rgba(255,200,60,.45);color:#ffe566}',
      '.vid-rnd-btn{flex:1;background:transparent;border:none;color:var(--text);font-family:inherit;font-size:13px;font-weight:500;padding:8px 14px;cursor:pointer;min-height:54px;touch-action:manipulation;-webkit-tap-highlight-color:transparent;white-space:nowrap}',
      '.vid-rnd-btn:active{opacity:.7}',
      '.vid-adults-btn{background:rgba(0,122,255,.1);border-right:1.5px solid rgba(0,122,255,.15);color:rgba(100,180,255,.5)}',
      '.vid-adults-btn.on{background:rgba(0,122,255,.24);border-right-color:rgba(0,122,255,.45);color:var(--accent)}',
      '.vid-icon{font-size:20px}',
      '.vid-lbl{font-size:9px;font-weight:700;white-space:nowrap}',
      '.vid-dur-row{display:flex;gap:6px}',
      '.vid-dur-btn{flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-sm);color:var(--muted);font-family:inherit;font-size:13px;font-weight:600;padding:8px;cursor:pointer;min-height:44px;touch-action:manipulation}',
      '.vid-dur-btn.on{background:var(--a3);border-color:var(--accent);color:#fff}',
      '.vid-guide-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:10000;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(8px)}',
      '.vid-guide-overlay.show{display:flex;animation:fadeIn .2s ease}',
      '@keyframes fadeIn{from{opacity:0}to{opacity:1}}',
      '.vid-guide-box{background:var(--surface);border:1px solid var(--border);border-radius:18px;max-width:420px;width:100%;max-height:85vh;overflow-y:auto;display:flex;flex-direction:column}',
      '.vid-guide-top{display:flex;justify-content:flex-end;padding:10px 12px;border-bottom:1px solid var(--border)}',
      '.vid-guide-close{background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:inherit}',
      '.vid-guide-close:hover{background:var(--surface2);color:#fff}',
      '.vid-guide-content{padding:24px 20px;text-align:center;flex:1}',
      '.vid-guide-emoji{font-size:48px;margin-bottom:12px}',
      '.vid-guide-title{font-size:18px;font-weight:700;color:#fff;margin-bottom:4px}',
      '.vid-guide-subtitle{font-size:13px;color:var(--teal);margin-bottom:14px;font-weight:500}',
      '.vid-guide-body{font-size:13px;color:var(--text);line-height:1.7}',
      '.vid-guide-dots{display:flex;justify-content:center;gap:5px;margin-bottom:14px}',
      '.vid-guide-dot{width:7px;height:7px;border-radius:50%;background:var(--border);transition:all .2s}',
      '.vid-guide-dot.on{background:var(--teal);width:22px;border-radius:4px}',
      '.vid-guide-nav{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-top:1px solid var(--border);gap:10px}',
      '.vid-guide-skip{background:none;border:none;color:var(--muted);font-size:13px;cursor:pointer;padding:6px;font-family:inherit;min-height:44px}',
      '.vid-guide-next{background:var(--accent);border:none;color:#fff;border-radius:9px;padding:9px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;min-height:44px}',
      '.vid-guide-next:active{opacity:.85}',
      '#paeVidGuideBtn{background:rgba(0,229,150,.12);border:1px solid rgba(0,229,150,.3);color:#00e596;border-radius:8px;font-size:12px;font-weight:600;padding:5px 11px;cursor:pointer;font-family:inherit;margin-left:auto;margin-right:8px;min-height:36px}',
      '#paeVidGuideBtn:hover{background:rgba(0,229,150,.18)}'
    ].join('\n');
    document.head.appendChild(st);
  }

  // ============================================================
  // HTML INJECTION
  // ============================================================
  function injectModeTabs() {
    if (document.querySelector('.mode-tabs')) return;
    var header = document.querySelector('.header');
    if (!header) return;
    var tabs = document.createElement('div');
    tabs.className = 'mode-tabs';
    tabs.innerHTML =
      '<button class="mode-tab active" data-mode="img" id="modeTabImg">' + tr('modeImg') + '</button>' +
      '<button class="mode-tab" data-mode="vid" id="modeTabVid">' + tr('modeVid') + '</button>';
    header.parentNode.insertBefore(tabs, header.nextSibling);
    tabs.querySelector('#modeTabImg').addEventListener('click', function() { setMode('img'); });
    tabs.querySelector('#modeTabVid').addEventListener('click', function() { setMode('vid'); });
  }

  function injectVideoPage() {
    if (document.getElementById('vidPage')) return;
    var page = document.createElement('div');
    page.id = 'vidPage';
    page.className = 'vid-page';
    var html = [];
    html.push('<div class="pae-section-header"><span aria-hidden="true">✍️</span><span id="vidInputLbl">תאר/י את הסצנה שלך לוידאו</span></div>');
    html.push('<textarea id="vidInput" rows="3" placeholder="' + tr('placeholder') + '" maxlength="2000" aria-label="' + tr('placeholder') + '"></textarea>');
    html.push('<div class="vid-result-box">');
    html.push('  <div class="vid-result-top">');
    html.push('    <div class="vid-result-label"><span id="vidPromptLbl">' + tr('promptReady') + '</span></div>');
    html.push('    <span class="vid-result-count" id="vidCharCount">0 ' + tr('chars') + '</span>');
    html.push('  </div>');
    html.push('  <div id="vidFinalPrompt" class="empty">' + tr('promptEmpty') + '</div>');
    html.push('</div>');
    Object.keys(VIDEO_DATA).forEach(function(key) {
      var sec = VIDEO_DATA[key];
      html.push('<div class="vid-pill-section" data-section="' + key + '">');
      html.push('  <div class="pae-section-header"><span aria-hidden="true">' + sec.emoji + '</span><span class="vid-sec-lbl" data-key="' + key + '">' + sec.he + '</span></div>');
      html.push('  <div class="vid-pills">');
      sec.pills.forEach(function(p, i) {
        html.push('<button type="button" class="cat-pill vid-pill" data-section="' + key + '" data-val="' + p.en + '" data-kids="' + (p.kids ? '1' : '0') + '">' +
                  '<span class="cat-name">' + p.he + '</span></button>');
      });
      html.push('  </div>');
      html.push('</div>');
    });
    html.push('<div class="vid-pill-section">');
    html.push('  <div class="pae-section-header"><span aria-hidden="true">⏱</span><span id="vidDurLbl">' + tr('duration') + '</span></div>');
    html.push('  <div class="vid-dur-row">');
    DURATIONS.forEach(function(d) {
      html.push('<button type="button" class="vid-dur-btn' + (d === '5' ? ' on' : '') + '" data-dur="' + d + '">' + d + 's</button>');
    });
    html.push('  </div>');
    html.push('</div>');
    html.push('<div class="vid-kids-area">');
    html.push('  <div class="vid-split-wrap">');
    html.push('    <button type="button" class="vid-kids-btn" id="vidKidsBtn"><span class="vid-icon">✨</span><span class="vid-lbl" id="vidKidsLbl">' + tr('kids') + '</span></button>');
    html.push('    <button type="button" class="vid-rnd-btn" id="vidRndBtn">' + tr('surprise') + '</button>');
    html.push('    <button type="button" class="vid-adults-btn on" id="vidAdultsBtn"><span class="vid-icon">🎨</span><span class="vid-lbl" id="vidAdultsLbl">' + tr('adults') + '</span></button>');
    html.push('  </div>');
    html.push('</div>');
    html.push('<div class="vid-platform-row">');
    Object.keys(PLATFORMS).forEach(function(name) {
      var p = PLATFORMS[name];
      html.push('<button type="button" class="vid-plat-btn" data-platform="' + name + '">' + p.emoji + ' ' + p.label + ' ↗</button>');
    });
    html.push('</div>');
    html.push('<div class="action-row">');
    html.push('  <button type="button" class="btn-copy" id="vidCopyBtn">📋 <span id="vidCopyLbl">' + tr('copyPrompt') + '</span></button>');
    html.push('</div>');
    html.push('<div class="vid-action-row">');
    html.push('  <button type="button" class="btn-share" id="vidShareBtn"><span id="vidShareLbl">' + tr('share') + '</span></button>');
    html.push('  <button type="button" class="btn-clear" id="vidClearBtn"><span id="vidClearLbl">' + tr('clear') + '</span></button>');
    html.push('</div>');
    html.push('<button type="button" class="vid-pb-btn" id="vidPbBtn">');
    html.push('  <div class="vid-pb-ico">🍺</div>');
    html.push('  <div class="vid-pb-text"><div class="vid-pb-t" id="vidPbT">' + tr('payboxTitle') + '</div><div class="vid-pb-s" id="vidPbS">' + tr('paybox') + '</div></div>');
    html.push('</button>');
    page.innerHTML = html.join('\n');
    var app = document.querySelector('.app');
    if (app && app.parentNode) app.parentNode.insertBefore(page, app.nextSibling);
    else document.body.appendChild(page);
    bindVideoPageEvents();
  }

  function bindVideoPageEvents() {
    var input = document.getElementById('vidInput');
    if (input) {
      input.addEventListener('input', debounce(function() { rebuildPrompt(); }, 350));
    }
    document.querySelectorAll('.vid-pill').forEach(function(btn) {
      btn.addEventListener('click', function() { toggleVideoPill(btn); });
    });
    document.querySelectorAll('.vid-dur-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { setDuration(btn.getAttribute('data-dur')); });
    });
    var kBtn = document.getElementById('vidKidsBtn');
    if (kBtn) kBtn.addEventListener('click', function() { setVideoKidsMode(true); });
    var aBtn = document.getElementById('vidAdultsBtn');
    if (aBtn) aBtn.addEventListener('click', function() { setVideoKidsMode(false); });
    var rBtn = document.getElementById('vidRndBtn');
    if (rBtn) rBtn.addEventListener('click', function() { randomizeVideo(); });
    var cBtn = document.getElementById('vidCopyBtn');
    if (cBtn) cBtn.addEventListener('click', function() { copyVideoPrompt(); });
    var sBtn = document.getElementById('vidShareBtn');
    if (sBtn) sBtn.addEventListener('click', function() { shareVideo(); });
    var clBtn = document.getElementById('vidClearBtn');
    if (clBtn) clBtn.addEventListener('click', function() { clearVideo(); });
    var pBtn = document.getElementById('vidPbBtn');
    if (pBtn) pBtn.addEventListener('click', function() { openPayBox(); });
    document.querySelectorAll('.vid-plat-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { openPlatform(btn.getAttribute('data-platform')); });
    });
  }

  function debounce(fn, ms) {
    var t;
    return function() {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function() { fn.apply(ctx, args); }, ms);
    };
  }

  // ============================================================
  // CORE LOGIC
  // ============================================================
  async function translateHebrew(text) {
    if (!text || !text.trim()) return '';
    if (!isHebrew(text)) return text;
    if (state.translationCache[text]) return state.translationCache[text];
    try {
      var url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=he|en';
      var res = await fetch(url);
      var data = await res.json();
      if (data && data.responseStatus === 200 && data.responseData) {
        var translated = data.responseData.translatedText || text;
        state.translationCache[text] = translated;
        return translated;
      }
    } catch (e) { _log('translate err: ' + e.message); }
    return text;
  }

  function setMode(m) {
    state.mode = m;
    document.body.classList.toggle('vid-mode', m === 'vid');
    document.querySelectorAll('.mode-tab').forEach(function(t) {
      t.classList.toggle('active', t.getAttribute('data-mode') === m);
    });
    var vp = document.getElementById('vidPage');
    if (vp) vp.classList.toggle('active', m === 'vid');
    try { localStorage.setItem('paeMode', m); } catch (e) {}
  }

  function toggleVideoPill(btn) {
    var sec = btn.getAttribute('data-section');
    var val = btn.getAttribute('data-val');
    if (state.selectedPills[sec] === val) {
      delete state.selectedPills[sec];
      btn.classList.remove('active');
    } else {
      var prev = document.querySelector('.vid-pill[data-section="' + sec + '"].active');
      if (prev) prev.classList.remove('active');
      state.selectedPills[sec] = val;
      btn.classList.add('active');
    }
    rebuildPrompt();
  }

  function setDuration(d) {
    state.duration = d;
    document.querySelectorAll('.vid-dur-btn').forEach(function(b) {
      b.classList.toggle('on', b.getAttribute('data-dur') === d);
    });
    rebuildPrompt();
  }

  async function rebuildPrompt() {
    var input = document.getElementById('vidInput');
    var raw = (input && input.value || '').trim();
    var fp = document.getElementById('vidFinalPrompt');
    var cc = document.getElementById('vidCharCount');
    var pillCount = Object.keys(state.selectedPills).length;
    if (!raw && pillCount === 0) {
      if (fp) { fp.textContent = tr('promptEmpty'); fp.classList.add('empty'); }
      if (cc) cc.textContent = '0 ' + tr('chars');
      state.lastVideoPrompt = '';
      return;
    }
    if (fp && raw && isHebrew(raw) && !state.translationCache[raw]) {
      fp.textContent = tr('translating');
      fp.classList.add('empty');
    }
    var subject = await translateHebrew(raw);
    var parts = [];
    if (subject) parts.push(subject);
    ['camera','motion','lighting','filmStyle','genre','environment','weather','effects'].forEach(function(k) {
      if (state.selectedPills[k]) parts.push(state.selectedPills[k]);
    });
    var prompt = parts.join(', ');
    if (state.duration) prompt += ' --dur ' + state.duration;
    state.lastVideoPrompt = prompt;
    if (fp) {
      fp.textContent = prompt;
      fp.classList.toggle('empty', !prompt);
    }
    if (cc) cc.textContent = prompt.length + ' ' + tr('chars');
  }

  function setVideoKidsMode(isKids) {
    state.kidsMode = isKids;
    var kBtn = document.getElementById('vidKidsBtn');
    var aBtn = document.getElementById('vidAdultsBtn');
    if (kBtn) kBtn.classList.toggle('on', isKids);
    if (aBtn) aBtn.classList.toggle('on', !isKids);
    document.querySelectorAll('.vid-pill').forEach(function(p) {
      var pillKids = p.getAttribute('data-kids') === '1';
      var hide = isKids && !pillKids;
      p.classList.toggle('tag-hidden', hide);
      if (hide && p.classList.contains('active')) {
        var sec = p.getAttribute('data-section');
        delete state.selectedPills[sec];
        p.classList.remove('active');
      }
    });
    document.querySelectorAll('.vid-dur-btn').forEach(function(b) {
      var d = b.getAttribute('data-dur');
      var hide = isKids && d === '10';
      b.classList.toggle('tag-hidden', hide);
      if (hide && b.classList.contains('on')) {
        setDuration('5');
      }
    });
    rebuildPrompt();
  }

  async function randomizeVideo() {
    var subjects = state.kidsMode ? KIDS_SUBJECTS : ADULT_SUBJECTS;
    var presets = state.kidsMode ? KIDS_PRESETS : ADULT_PRESETS;
    var subject = subjects[Math.floor(Math.random() * subjects.length)];
    var preset = presets[Math.floor(Math.random() * presets.length)];
    var input = document.getElementById('vidInput');
    if (input) input.value = subject;
    document.querySelectorAll('.vid-pill.active').forEach(function(p) { p.classList.remove('active'); });
    state.selectedPills = {};
    Object.keys(preset).forEach(function(sec) {
      var val = preset[sec];
      state.selectedPills[sec] = val;
      var btn = document.querySelector('.vid-pill[data-section="' + sec + '"][data-val="' + val + '"]');
      if (btn && !btn.classList.contains('tag-hidden')) btn.classList.add('active');
    });
    var rBtn = document.getElementById('vidRndBtn');
    if (rBtn) { rBtn.style.transform = 'scale(.85)'; setTimeout(function() { rBtn.style.transform = ''; }, 150); }
    await rebuildPrompt();
  }

  // ============================================================
  // ACTIONS — copy/share/clear/openPlatform/payBox/saveHistory
  // ============================================================
  async function ensurePromptReady() {
    if (!state.lastVideoPrompt) await rebuildPrompt();
    return state.lastVideoPrompt;
  }

  function copyToClipboard(text) {
    if (!text) return false;
    try { navigator.clipboard.writeText(text).catch(function(){}); }
    catch(e) {}
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch(e){}
      document.body.removeChild(ta);
    } catch(e) {}
    return true;
  }

  async function copyVideoPrompt() {
    var prompt = await ensurePromptReady();
    if (!prompt) { toast(tr('promptEmpty'), 'err'); return; }
    copyToClipboard(prompt);
    var btn = document.getElementById('vidCopyBtn');
    if (btn) {
      btn.classList.add('copied');
      setTimeout(function() { btn.classList.remove('copied'); }, 1200);
    }
    toast(getLang() === 'en' ? '✅ Copied!' : '✅ הועתק!');
    saveVideoHistory(prompt);
  }

  async function openPlatform(name) {
    var p = PLATFORMS[name];
    if (!p) return;
    var prompt = await ensurePromptReady();
    if (!prompt) { toast(tr('promptEmpty'), 'err'); return; }
    copyToClipboard(prompt);
    saveVideoHistory(prompt);
    toast(tr('copied') + p.label + tr('pasteHint'), 'deep');
    setTimeout(function() {
      try { window.open(p.url, '_blank', 'noopener'); }
      catch(e) { window.location.href = p.url; }
    }, 150);
  }

  async function shareVideo() {
    var prompt = await ensurePromptReady();
    if (!prompt) { toast(tr('promptEmpty'), 'err'); return; }
    var lang = getLang();
    var url = 'https://t1ptip.github.io/palette-ai-v2';
    var text = lang === 'he'
      ? '🎬 יצרתי פרומפט וידאו AI ב-Palette AI!\n\n' + prompt + '\n\n📱 איפה להדביק? Kling / Pika / Runway\n\n✨ בנה פרומפט וידאו בעברית: ' + url
      : '🎬 I made an AI video prompt with Palette AI!\n\n' + prompt + '\n\n📱 Where to paste? Kling / Pika / Runway\n\n✨ Build video prompts in plain words: ' + url;
    if (navigator.share) {
      try { await navigator.share({ text: text, url: url }); return; }
      catch(e) { _log('share dismissed'); }
    }
    copyToClipboard(text);
    toast(getLang() === 'en' ? '✅ Copied to clipboard' : '✅ הועתק ללוח');
  }

  function clearVideo() {
    var input = document.getElementById('vidInput');
    if (input) input.value = '';
    state.selectedPills = {};
    document.querySelectorAll('.vid-pill.active').forEach(function(p) { p.classList.remove('active'); });
    setDuration('5');
    rebuildPrompt();
    toast(getLang() === 'en' ? 'Cleared' : 'נוקה');
  }

  function openPayBox() {
    var url = (typeof window.PAYBOX_URL === 'string' && window.PAYBOX_URL) || 'https://links.payboxapp.com/hbbbRHMn91b';
    try { window.open(url, '_blank', 'noopener'); }
    catch(e) { window.location.href = url; }
  }

  function saveVideoHistory(prompt) {
    if (!prompt) return;
    try {
      var key = 'paeVidHistory';
      var arr = [];
      try { arr = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) {}
      arr.unshift({ prompt: prompt, ts: Date.now() });
      if (arr.length > 50) arr = arr.slice(0, 50);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch(e) { _log('saveHistory err: ' + e.message); }
  }

  // ============================================================
  // VIDEO GUIDE OVERLAY
  // ============================================================
  function injectVideoGuideButton() {
    var top = document.querySelector('.pae-guide-top');
    if (!top || document.getElementById('paeVidGuideBtn')) return false;
    var btn = document.createElement('button');
    btn.id = 'paeVidGuideBtn';
    btn.type = 'button';
    btn.textContent = tr('guideBtn');
    btn.onclick = function(e) {
      e.stopPropagation();
      if (typeof window.__paeCloseGuide === 'function') window.__paeCloseGuide();
      setTimeout(openVideoGuide, 100);
    };
    top.insertBefore(btn, top.firstChild);
    return true;
  }

  function openVideoGuide() {
    var overlay = document.getElementById('paeVidGuideOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'paeVidGuideOverlay';
      overlay.className = 'vid-guide-overlay';
      overlay.innerHTML = [
        '<div class="vid-guide-box" role="dialog" aria-modal="true">',
        '  <div class="vid-guide-top"><button class="vid-guide-close" aria-label="Close">✕</button></div>',
        '  <div class="vid-guide-content" id="vidGuideContent"></div>',
        '  <div class="vid-guide-dots" id="vidGuideDots"></div>',
        '  <div class="vid-guide-nav">',
        '    <button class="vid-guide-skip" id="vidGuideSkip"></button>',
        '    <button class="vid-guide-next" id="vidGuideNext"></button>',
        '  </div>',
        '</div>'
      ].join('');
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeVideoGuide();
      });
      overlay.querySelector('.vid-guide-close').addEventListener('click', closeVideoGuide);
      overlay.querySelector('#vidGuideSkip').addEventListener('click', closeVideoGuide);
      overlay.querySelector('#vidGuideNext').addEventListener('click', function() {
        var lang = getLang();
        var total = VID_GUIDE[lang].length;
        if (state.guideSlide >= total - 1) {
          closeVideoGuide();
          setMode('vid');
        } else {
          renderVideoGuideSlide(state.guideSlide + 1);
        }
      });
    }
    state.guideSlide = 0;
    renderVideoGuideSlide(0);
    overlay.classList.add('show');
  }

  function renderVideoGuideSlide(idx) {
    state.guideSlide = idx;
    var lang = getLang();
    var slides = VID_GUIDE[lang];
    var s = slides[idx];
    if (!s) return;
    var content = document.getElementById('vidGuideContent');
    if (content) {
      content.innerHTML =
        '<div class="vid-guide-emoji">' + s.emoji + '</div>' +
        '<div class="vid-guide-title">' + s.title + '</div>' +
        (s.subtitle ? '<div class="vid-guide-subtitle">' + s.subtitle + '</div>' : '') +
        '<div class="vid-guide-body">' + s.body + '</div>';
    }
    var dots = document.getElementById('vidGuideDots');
    if (dots) {
      dots.innerHTML = slides.map(function(_, i) {
        return '<div class="vid-guide-dot' + (i === idx ? ' on' : '') + '"></div>';
      }).join('');
    }
    var skip = document.getElementById('vidGuideSkip');
    if (skip) skip.textContent = tr('skip');
    var next = document.getElementById('vidGuideNext');
    if (next) next.textContent = idx === slides.length - 1 ? tr('start') : tr('next');
  }

  function closeVideoGuide() {
    var overlay = document.getElementById('paeVidGuideOverlay');
    if (overlay) overlay.classList.remove('show');
  }

  // ============================================================
  // LANG / LABELS UPDATE
  // ============================================================
  function updateLabels() {
    var lang = getLang();
    var imgT = document.getElementById('modeTabImg'); if (imgT) imgT.textContent = tr('modeImg');
    var vidT = document.getElementById('modeTabVid'); if (vidT) vidT.textContent = tr('modeVid');
    var inp = document.getElementById('vidInput'); if (inp) inp.placeholder = tr('placeholder');
    var pl = document.getElementById('vidPromptLbl'); if (pl) pl.textContent = tr('promptReady');
    var dl = document.getElementById('vidDurLbl'); if (dl) dl.textContent = tr('duration');
    var kl = document.getElementById('vidKidsLbl'); if (kl) kl.textContent = tr('kids');
    var al = document.getElementById('vidAdultsLbl'); if (al) al.textContent = tr('adults');
    var rb = document.getElementById('vidRndBtn'); if (rb) rb.textContent = tr('surprise');
    var cl = document.getElementById('vidCopyLbl'); if (cl) cl.textContent = tr('copyPrompt');
    var sl = document.getElementById('vidShareLbl'); if (sl) sl.textContent = tr('share');
    var clrL = document.getElementById('vidClearLbl'); if (clrL) clrL.textContent = tr('clear');
    var pbT = document.getElementById('vidPbT'); if (pbT) pbT.textContent = tr('payboxTitle');
    var pbS = document.getElementById('vidPbS'); if (pbS) pbS.textContent = tr('paybox');
    var inpLbl = document.getElementById('vidInputLbl');
    if (inpLbl) inpLbl.textContent = (lang === 'en' ? 'Describe your video scene' : 'תאר/י את הסצנה שלך לוידאו');
    document.querySelectorAll('.vid-sec-lbl').forEach(function(el) {
      var key = el.getAttribute('data-key');
      var sec = VIDEO_DATA[key];
      if (sec) el.textContent = sec[lang] || sec.he;
    });
    document.querySelectorAll('.vid-pill').forEach(function(p) {
      var sec = p.getAttribute('data-section');
      var val = p.getAttribute('data-val');
      var data = VIDEO_DATA[sec];
      if (!data) return;
      var pill = data.pills.find(function(x) { return x.en === val; });
      if (!pill) return;
      var nameEl = p.querySelector('.cat-name');
      if (nameEl) nameEl.textContent = lang === 'en' ? pill.en : pill.he;
    });
    var fp = document.getElementById('vidFinalPrompt');
    var cc = document.getElementById('vidCharCount');
    if (fp && fp.classList.contains('empty') && !state.lastVideoPrompt) {
      fp.textContent = tr('promptEmpty');
    }
    if (cc) cc.textContent = (state.lastVideoPrompt.length || 0) + ' ' + tr('chars');
    var vgBtn = document.getElementById('paeVidGuideBtn');
    if (vgBtn) vgBtn.textContent = tr('guideBtn');
    if (document.getElementById('paeVidGuideOverlay') && document.getElementById('paeVidGuideOverlay').classList.contains('show')) {
      renderVideoGuideSlide(state.guideSlide);
    }
  }

  function observeLang() {
    new MutationObserver(function(muts) {
      muts.forEach(function(m) {
        if (m.type === 'attributes' && m.attributeName === 'lang') {
          setTimeout(updateLabels, 60);
        }
      });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  // ============================================================
  // EXPOSE GLOBALS
  // ============================================================
  window.setMode = setMode;
  window.toggleVideoPill = toggleVideoPill;
  window.setVideoKidsMode = setVideoKidsMode;
  window.randomizeVideo = randomizeVideo;
  window.copyVideoPrompt = copyVideoPrompt;
  window.shareVideo = shareVideo;
  window.clearVideo = clearVideo;
  window.openPlatform = openPlatform;
  window.openVideoGuide = openVideoGuide;

  // ============================================================
  // BOOT
  // ============================================================
  var bootAttempts = 0;
  function boot() {
    bootAttempts++;
    try {
      injectStyles();
      injectModeTabs();
      injectVideoPage();
      injectVideoGuideButton();
      var saved = null;
      try { saved = localStorage.getItem('paeMode'); } catch(e) {}
      if (saved === 'vid' && bootAttempts === 1) setMode('vid');
    } catch (e) { _log('boot err: ' + e.message); }
    if (bootAttempts < 12) setTimeout(boot, 400);
    else observeLang();
    if (bootAttempts === 1) _log('booted (attempt 1)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

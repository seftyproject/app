'use strict';


window.__sefty = true;
document.documentElement.classList.add('js');




 
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVGNS = 'http://www.w3.org/2000/svg';

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

 
const scrollHooks = [];
let hooksTicking = false;

function onScroll(fn) {
    scrollHooks.push(fn);
}

function runScrollHooks() {
    if (hooksTicking) return;
    hooksTicking = true;
    requestAnimationFrame(() => {
        scrollHooks.forEach((fn) => fn());
        hooksTicking = false;
    });
}

window.addEventListener('scroll', runScrollHooks, { passive: true });
window.addEventListener('resize', runScrollHooks, { passive: true });

function initSite() {
    [initNav, initHeader, initTocDisclosure, initVersions, initNight, initDay,
        initToc, initReveal, initInViewAnimations, initParallax, initStatement,
        initStepsProgress].forEach(init => {
        try { init(); } catch (error) { console.error(init.name, error); }
    });
    runScrollHooks();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSite);
else initSite();


 

 
function initNav() {
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('siteNav');
    if (!toggle || !nav) return;

    const setOpen = (open) => {
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Chiudi pannello' : 'Apri menu navigazione');
        nav.classList.toggle('is-open', open);
    };

    toggle.addEventListener('click', () => {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
            setOpen(false);
            toggle.focus();
        }
    });

    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });

    nav.addEventListener('click', e => { if(e.target.closest('a')) setOpen(false); });

    window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
        if (e.matches) setOpen(false);
    });
}

 
function initHeader() {
    const header = document.querySelector('.site-header');
    const bar = document.getElementById('progressBar');
    if (!header) return;

    onScroll(() => {
        const y = window.scrollY;
        header.classList.toggle('is-stuck', y > 8);
        if (bar) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0) + ')';
        }
    });
}

 
function initReveal() {
    
    if (document.querySelector('.prose, .tabpanel')) {
        const selector = [
            '.prose > section > :not(.stats):not(.rules)',
            '.stat', '.rules li', '.steps li', '.facts article',
            '.process > *', '.version-figure', '.related .tile'
        ].join(',');
        document.querySelectorAll(selector).forEach((el) => {
            el.classList.add('reveal');
            const index = Array.prototype.indexOf.call(el.parentElement.children, el);
            el.style.setProperty('--r', Math.min(index, 6));
        });
    }

    const items = Array.from(document.querySelectorAll('.reveal-card, .reveal'));
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('is-in'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.01 });

    items.forEach((el) => observer.observe(el));
}



function initInViewAnimations() {
    const targets = Array.from(document.querySelectorAll('.card, .page-art'));
    if (!targets.length || !('IntersectionObserver' in window)) return;

    const mobile = window.matchMedia('(hover: none), (max-width: 899px)');
    let observer = null;

    const start = () => {
        if (observer) return;
        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle('is-active', entry.isIntersecting);
            });
        }, { rootMargin: '-30% 0px -30% 0px', threshold: 0 });
        targets.forEach((el) => observer.observe(el));
    };

    const stop = () => {
        if (!observer) return;
        observer.disconnect();
        observer = null;
        targets.forEach((el) => el.classList.remove('is-active'));
    };

    const sync = () => (mobile.matches ? start() : stop());
    mobile.addEventListener('change', sync);
    sync();
}

 

 
function initToc() {
    const links = Array.from(document.querySelectorAll('.toc a'));
    if (!links.length) return;

    const byId = new Map(links.map((a) => [a.hash.slice(1), a]));

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                links.forEach((l) => l.removeAttribute('aria-current'));
                document.querySelectorAll('.prose > section.is-current')
                    .forEach((s) => s.classList.remove('is-current'));
                entry.target.classList.add('is-current');
                const link = byId.get(entry.target.id);
                if (link) link.setAttribute('aria-current', 'true');
            });
        }, { rootMargin: '-20% 0px -70% 0px' });

        byId.forEach((_, id) => {
            const section = document.getElementById(id);
            if (section) observer.observe(section);
        });
    }

    const prose = document.querySelector('.prose');
    const list = document.querySelector('.toc ul');
    if (prose && list) {
        onScroll(() => {
            const rect = prose.getBoundingClientRect();
            const progress = (window.innerHeight * 0.45 - rect.top) / rect.height;
            list.style.setProperty('--toc-p', clamp(progress, 0, 1).toFixed(3));
        });
    }
}

 
function initParallax() {
    const art = document.querySelector('.page-art');
    if (!art || reduceMotion) return;

    onScroll(() => {
        const y = Math.min(window.scrollY, 500);
        art.style.setProperty('--py', (y * 0.1).toFixed(1) + 'px');
    });
}

 
function initStatement() {
    document.querySelectorAll('[data-statement]').forEach((p) => {
        const section = p.closest('.statement');
        const words = p.textContent.trim().split(/\s+/);
        p.textContent = '';
        words.forEach((word, i) => {
            const span = document.createElement('span');
            span.className = 'sw';
            span.textContent = word;
            p.appendChild(span);
            if (i < words.length - 1) p.appendChild(document.createTextNode(' '));
        });

        const spans = Array.from(p.querySelectorAll('.sw'));
        if (reduceMotion) return;

        const update = () => {
            const rect = section.getBoundingClientRect();
            const vh = window.innerHeight;
            const progress = (vh * 0.85 - rect.top) / (vh * 0.35 + rect.height * 0.5);
            const n = spans.length;
            spans.forEach((span, i) => {
                const lit = clamp(progress * (n + 2) - i, 0, 1);
                span.style.setProperty('--o', (0.2 + 0.8 * lit).toFixed(2));
            });
        };

        onScroll(update);
        update();
    });
}

 
function initStepsProgress() {
    const lists = Array.from(document.querySelectorAll('.steps'));
    if (!lists.length) return;

    onScroll(() => {
        const line = window.innerHeight * 0.55;
        lists.forEach((list) => {
            if (!list.offsetParent) return; 
            list.querySelectorAll('li').forEach((li) => {
                const rect = li.getBoundingClientRect();
                li.classList.toggle('is-current', rect.top <= line && rect.bottom > line);
                li.classList.toggle('is-past', rect.bottom <= line);
            });
        });
    });
}
 
function initVersions() {
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    if (!tabs.length) return;
    const activate = (tab, focus = false) => {
        tabs.forEach(t => {
            const selected = t === tab;
            t.setAttribute('aria-selected', String(selected));
            t.tabIndex = selected ? 0 : -1;
            document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
        });
        if (focus) tab.focus();
        runScrollHooks();
    };
    const fromHash = () => {
        const target = tabs.find(t => '#' + t.getAttribute('aria-controls') === location.hash || '#' + t.dataset.key === location.hash);
        if (target) activate(target);
    };
    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => activate(tab));
        tab.addEventListener('keydown', e => {
            const next = {ArrowRight:(i+1)%tabs.length, ArrowLeft:(i+tabs.length-1)%tabs.length, Home:0, End:tabs.length-1}[e.key];
            if (next === undefined) return;
            e.preventDefault(); activate(tabs[next], true);
        });
    });
    document.querySelectorAll('.toc a').forEach(a => a.addEventListener('click', () => {
        const tab=tabs.find(t => '#'+t.getAttribute('aria-controls')===a.hash);
        if(tab) activate(tab);
    }));
    activate(tabs[0]); fromHash();
    window.addEventListener('hashchange', fromHash);
}

function initNight() {
    const widget = document.querySelector('[data-night]');
    if (!widget) return;
    const button = widget.querySelector('[data-hold]');
    const label = widget.querySelector('[data-label]');
    const reset = widget.querySelector('[data-reset]');
    const log = [...widget.querySelectorAll('.night-log li')];
    let timer = null, complete = false;
    const cancel = () => {
        clearTimeout(timer); timer = null; widget.classList.remove('is-holding');
        if (!complete) label.textContent = 'Tieni premuto';
    };
    const start = () => {
        if (timer || complete) return;
        widget.classList.add('is-holding'); label.textContent = 'Mantieni premuto…';
        timer = setTimeout(() => {
            timer = null; complete = true;
            widget.classList.remove('is-holding'); widget.classList.add('is-on');
            if (!reduceMotion) widget.classList.add('is-buzz');
            label.textContent = 'Simulazione completata'; reset.hidden = false;
            log.forEach(li => li.classList.add('done'));
        }, 3000);
    };
    if ('PointerEvent' in window) {
        button.addEventListener('pointerdown', e => {
            if (e.isPrimary === false || (e.pointerType === 'mouse' && e.button !== 0)) return;
            e.preventDefault();
            start();
            try { button.setPointerCapture(e.pointerId); } catch (_) {}
        });
        ['pointerup', 'pointercancel'].forEach(type => window.addEventListener(type, cancel));
        button.addEventListener('lostpointercapture', cancel);
    } else {
        button.addEventListener('touchstart', e => { e.preventDefault(); start(); }, {passive:false});
        ['touchend', 'touchcancel'].forEach(type => window.addEventListener(type, cancel));
        button.addEventListener('mousedown', e => { if(e.button === 0) start(); });
        window.addEventListener('mouseup', cancel);
    }
    button.addEventListener('contextmenu', e => e.preventDefault());
    button.addEventListener('blur', cancel);
    button.addEventListener('keydown', e => {
        if ([' ','Enter'].includes(e.key)) {e.preventDefault(); if (!e.repeat) start();}
        if (e.key === 'Escape') cancel();
    });
    button.addEventListener('keyup', e => {if ([' ','Enter'].includes(e.key)) {e.preventDefault(); cancel();}});
    window.addEventListener('blur',cancel);
    document.addEventListener('visibilitychange', () => {if(document.hidden) cancel();});
    reset.addEventListener('click', () => {
        complete=false; cancel(); widget.classList.remove('is-on','is-buzz');
        log.forEach(li=>li.classList.remove('done')); reset.hidden=true; button.focus();
    });
}

function initDay() {
    const widget=document.querySelector('[data-day]'); if(!widget)return;
    const svg=widget.querySelector('[data-svg]'), range=widget.querySelector('[data-range]');
    svg.replaceChildren();
    svg.setAttribute('viewBox', '0 0 600 320');
    const make=(name,attrs)=>{const el=document.createElementNS(SVGNS,name);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v)));svg.append(el);return el;};
    const zone=make('circle',{cx:300,cy:155,r:range.value,class:'day-zone'});
    make('circle',{cx:300,cy:155,r:26,class:'day-tutor-halo'});
    make('circle',{cx:300,cy:155,r:9,class:'day-tutor'});
    const points=[[260,125],[350,190],[210,165],[405,100],[140,130]];
    const dots=points.map(([x,y])=>make('circle',{cx:x,cy:y,r:8,class:'day-mem'}));
    const syncFill=()=>{
        const pct=(Number(range.value)-Number(range.min))/(Number(range.max)-Number(range.min))*100;
        range.style.setProperty('--fill',pct+'%');
    };
    const update=()=>{
        const radius=Number(range.value);zone.setAttribute('r',String(radius));let outside=0;
        dots.forEach((dot,i)=>{const out=Math.hypot(points[i][0]-300,points[i][1]-155)>radius;dot.classList.toggle('is-out',out);if(out)outside++;});
        const message=outside?`${outside} ${outside===1?'partecipante fuori':'partecipanti fuori'} dall’area: verifica del Tutor.`:'Tutti i partecipanti sono nell’area.';
        widget.querySelector('[data-alert-text]').textContent=message;
        widget.querySelector('[data-alert]').classList.toggle('is-visible',outside>0);
        const status=widget.querySelector('#dayStatus');
        if(status) status.textContent=message;
        range.setAttribute('aria-valuetext',`Raggio illustrativo ${radius}. ${message}`);
        syncFill();
    };
    range.addEventListener('input',update); range.addEventListener('change',update); update();
}

 
function initTocDisclosure() {
    const desktop = window.matchMedia('(min-width: 1024px)');
    document.querySelectorAll('.toc-disclosure').forEach(details => {
        const sync = () => { details.open = desktop.matches; };
        sync();
        desktop.addEventListener('change', sync);
        details.querySelector('summary').addEventListener('click', event => {
            if (desktop.matches) event.preventDefault();
        });
        details.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
            if (!desktop.matches) {
                details.open = false;
                const target = document.getElementById(link.hash.slice(1));
                if (target) { target.tabIndex = -1; target.focus({preventScroll:true}); }
            }
        }));
    });
}
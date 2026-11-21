import { RotateCcw } from 'lucide-react';

// Approved hero and explanatory scene. Example people are illustrative only.
export function StoryIntro() { return <>
<section className="ss-hero ss-wrap" id="ss-top" aria-labelledby="ss-main-title">
  <div className="ss-hero-image" aria-label="Первый экран — люди в разговоре"><img src="/images/conversation-hero.webp" width="1254" height="1254" alt="Мужчина и девушка увлечённо обсуждают профессиональную тему" /></div>
  <div className="ss-hero-copy"><p className="ss-eyebrow">Analyst Days / 23 · Нетворкинг</p><h1 id="ss-main-title" aria-label="Есть что обсудить. Осталось найти с кем.">Есть что<br />обсудить.<span>Осталось<br />найти с кем.</span></h1><p className="ss-hero-value">Найдите человека, который понимает ваши задачи. И превратите перерыв в полезный разговор.</p><button className="ss-pill" data-go="idea">Как это работает <span aria-hidden="true">↓</span></button></div>
  <a className="ss-downmark" href="#ss-idea" data-go="idea"><span>Знакомства со смыслом</span><b aria-hidden="true">↓</b></a>
</section>
<section className="ss-story" id="ss-idea" aria-labelledby="ss-idea-title"><div className="ss-wrap ss-story-inner">
  <div className="ss-story-intro"><div className="ss-reveal ss-story-copy-block"><p className="ss-eyebrow">Общая тема. Новый контакт.</p><h2 id="ss-idea-title">Не просто знакомство.<br /><span>Совпадение<br />по смыслу.</span></h2><p className="ss-story-copy">У вас есть вопрос. У кого-то — опыт.<br />Мы поможем вам встретиться на ближайшем перерыве и начать с того, что интересно обоим.</p></div>
  <div className="ss-connection ss-motion-on" aria-label="Нашлась общая тема — от интереса к встрече" data-phase="ready">
    <div className="ss-match-glow" aria-hidden="true"></div><div className="ss-match-line" aria-hidden="true"></div>
    <article className="ss-match-card ss-match-left"><div className="ss-match-face"><img src="/images/conversation-hero.webp" width="245" height="245" alt="" /></div><strong className="ss-match-name">Михаил</strong><span className="ss-match-role">Архитектор решений</span><span className="ss-match-label">Хочу разобраться</span><span className="ss-match-tag">ИИ в аналитике</span></article>
    <article className="ss-match-card ss-match-right"><div className="ss-match-face"><img src="/images/conversation-hero.webp" width="245" height="245" alt="" /></div><strong className="ss-match-name">Анна</strong><span className="ss-match-role">Системный аналитик</span><span className="ss-match-label">Могу поделиться</span><span className="ss-match-tag">ИИ в аналитике</span></article>
    <div className="ss-match-badge" aria-hidden="true">✦ Есть общая тема</div>
    <div className="ss-match-invite"><button type="button" className="ss-meet-pill" data-go="people"><span aria-hidden="true">↗</span> Встретимся на перерыве?</button><small>15 минут. Одна общая тема.</small></div>
    <p className="ss-match-phase" data-match-status>Интерес → совпадение → встреча</p>
  </div></div>
  <div className="ss-steps"><div className="ss-step ss-reveal"><small>01</small><h3>Ваш интерес</h3><p>Расскажите, что хотите обсудить и каким опытом можете поделиться.</p></div><div className="ss-step ss-reveal"><small>02</small><h3>Ваш собеседник</h3><p>Выберите человека по общей теме. Причину совпадения покажем в карточке.</p></div><div className="ss-step ss-reveal"><small>03</small><h3>Ваши 15 минут</h3><p>Договоритесь о времени. Встреча появится у обоих после взаимного согласия.</p></div></div>
  <div className="ss-story-bottom"><button className="ss-text-link" data-go="people">Найти свою тему <span aria-hidden="true">↓</span></button><button className="ss-replay" data-replay><RotateCcw size={16} aria-hidden="true" />К началу анимации</button></div>
</div></section>

</>; }

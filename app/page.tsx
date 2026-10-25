"use client";

import { useState } from "react";

const features = [
  { number: "01", title: "Etiketi tara", text: "Barkodu veya içerik listesini saniyeler içinde okut." },
  { number: "02", title: "Skoru gör", text: "İçeriği sade bir sağlık skoru ve anlaşılır açıklamalarla keşfet." },
  { number: "03", title: "Daha iyisini seç", text: "Bütçene ve hassasiyetlerine uygun temiz alternatifleri bul." },
];

function PhonePreview() {
  const [tab, setTab] = useState("Özet");
  return (
    <div className="landing-phone" aria-label="LabelScan uygulama önizlemesi">
      <div className="phone-top"><span>9:41</span><span>● ● ▰</span></div>
      <div className="phone-body">
        <div className="phone-heading"><div><small>CUMARTESİ, 25 EKİM</small><h3>{tab}</h3></div><span className="phone-avatar">AO</span></div>
        <div className="phone-score"><div><small>GÜNLÜK TEMİZLİK SKORU</small><strong>Harika gidiyorsun.</strong><p>Dününden 4 puan daha iyi.</p></div><div className="ring"><b>88</b><small>/100</small></div></div>
        <div className="phone-section"><h4>Bugün</h4><a>Detaylar</a></div>
        <div className="phone-grid"><div className="phone-tile tile-green"><span>✦</span><small>TOKSİN KALKANI</small><b>140g</b><p>Bu ay mısır şurubu engellendi.</p></div><div className="phone-tile tile-purple"><span>↗</span><small>AKILLI TASARRUF</small><b>420 TL</b><p>Smart Swap ile tasarruf.</p></div></div>
        <div className="phone-section"><h4>Son taramalar</h4><a>Tümünü gör</a></div>
        <div className="phone-list"><div><i className="dot pink">Y</i><span><b>Organik Yoğurt</b><small>Bugün, 09:42</small></span><em>96</em></div><div><i className="dot orange">E</i><span><b>Ekşi Mayalı Ekmek</b><small>Dün, 18:20</small></span><em>82</em></div></div>
      </div>
      <div className="phone-nav">{["Özet", "Tara", "Kiler", "Sosyal", "Profil"].map((item) => <button key={item} className={tab === item ? "selected" : ""} onClick={() => setTab(item)}><span>{item === "Özet" ? "◔" : item === "Tara" ? "⌗" : item === "Kiler" ? "▣" : item === "Sosyal" ? "♧" : "◎"}</span>{item}</button>)}</div>
    </div>
  );
}

export default function Home() {
  return <main className="landing-page">
    <nav className="landing-nav"><a className="brand" href="#top"><span className="brand-mark">⌁</span> labelscan</a><div className="nav-links"><a href="#nasil-calisir">Nasıl çalışır?</a><a href="#ozellikler">Özellikler</a><a href="#hikaye">Bizim hikâyemiz</a></div><a className="nav-cta" href="#basla">Uygulamayı keşfet <span>↗</span></a></nav>
    <section className="landing-hero" id="top"><div className="hero-copy"><p className="kicker"><span /> BİLİNÇLİ SEÇİMLER İÇİN</p><h1>Etiketi oku.<br /><em>Daha iyi</em> yaşa.</h1><p className="hero-text">Market alışverişini daha bilinçli hale getir. LabelScan ile ürünlerin içeriğini saniyeler içinde anla, sana en uygun seçeneği bul.</p><div className="hero-actions"><a className="primary-cta" href="#basla">Ücretsiz başla <span>↗</span></a><a className="text-cta" href="#nasil-calisir"><span className="play">▶</span> Nasıl çalıştığını gör</a></div><div className="hero-proof"><div className="proof-avatars"><span>AY</span><span>MK</span><span>EO</span></div><p><b>12.000+</b><br />bilinçli alışverişçi</p></div></div><div className="hero-visual"><div className="visual-note note-top"><span>✦</span><b>Temizlik skoru</b><strong>88<span>/100</span></strong></div><PhonePreview /><div className="visual-note note-bottom"><span className="note-check">✓</span><div><b>Smart Swap</b><small>Daha iyi alternatif bulundu</small></div></div></div></section>
    <section className="trust-strip"><p>DAHA İYİ SEÇİMLER YAPANLARIN TERCİHİ</p><div><span>Günlük alışkanlıklarını sadeleştir.</span><span>İçeriğini gerçekten anla.</span><span>İsrafı birlikte azalt.</span></div></section>
    <section className="intro-section" id="hikaye"><div><p className="kicker"><span /> NEDEN LABELSCAN?</p><h2>Ne aldığını bilmek<br /><em>hakkın.</em></h2></div><div><p className="intro-text">Karmaşık içerik listelerini herkesin anlayabileceği bir dile çeviriyoruz. Çünkü daha sağlıklı yaşamak, uzman olmayı değil, doğru bilgiye zamanında ulaşmayı gerektirir.</p><a className="arrow-link" href="#nasil-calisir">LabelScan’i keşfet <span>↗</span></a></div></section>
    <section className="steps-section" id="nasil-calisir"><div className="section-label"><p className="kicker"><span /> NASIL ÇALIŞIR?</p><h2>Üç adımda<br /><em>daha bilinçli.</em></h2></div><div className="steps">{features.map((feature) => <article key={feature.number} className="step"><span>{feature.number}</span><h3>{feature.title}</h3><p>{feature.text}</p><div className="step-arrow">↗</div></article>)}</div></section>
    <section className="final-cta" id="basla"><div><p className="kicker"><span /> BUGÜN BAŞLA</p><h2>Bir sonraki alışverişin<br /><em>daha bilinçli olsun.</em></h2></div><a className="primary-cta light" href="#top">Uygulamayı aç <span>↗</span></a></section>
    <footer><a className="brand" href="#top"><span className="brand-mark">⌁</span> labelscan</a><p>Gıdanın dilini birlikte sadeleştiriyoruz.</p><span>© 2025 LabelScan</span></footer>
  </main>;
}

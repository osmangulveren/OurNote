"use client";

import { useState } from "react";

const tabs = [
  { id: "summary", label: "Özet", icon: "◔" },
  { id: "scan", label: "Tara", icon: "⌗" },
  { id: "pantry", label: "Kiler", icon: "▣" },
  { id: "sharing", label: "Sosyal", icon: "♧" },
  { id: "profile", label: "Profil", icon: "◎" },
];

function ScoreRing({ score = 88 }: { score?: number }) {
  return (
    <div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}>
      <div className="score-ring__inner">
        <strong>{score}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

function Summary() {
  return (
    <div className="screen-content">
      <header className="page-header">
        <div>
          <p className="eyebrow">CUMARTESİ, 25 EKİM</p>
          <h1>Özet</h1>
        </div>
        <button className="avatar" aria-label="Profil">AO</button>
      </header>

      <section className="hero-card">
        <div>
          <p className="eyebrow light">GÜNLÜK TEMİZLİK SKORU</p>
          <h2>Harika gidiyorsun.</h2>
          <p className="hero-note">Dününden 4 puan daha iyi.</p>
        </div>
        <ScoreRing />
      </section>

      <div className="section-heading"><h2>Bugün</h2><button className="link-button">Detaylar</button></div>
      <div className="insight-grid">
        <article className="insight-card green-card"><span className="card-icon">✦</span><p className="eyebrow">TOKSİN KALKANI</p><strong>140g</strong><p>Bu ay mısır şurubu engellendi.</p></article>
        <article className="insight-card purple-card"><span className="card-icon">↗</span><p className="eyebrow">AKILLI TASARRUF</p><strong>420 TL</strong><p>Smart Swap ile tasarruf.</p></article>
      </div>

      <div className="section-heading"><h2>Son taramalar</h2><button className="link-button">Tümünü gör</button></div>
      <div className="scan-list">
        <div className="list-row"><span className="product-dot yogurt">Y</span><div><strong>Organik Yoğurt</strong><small>Bugün, 09:42</small></div><span className="mini-score good">96</span></div>
        <div className="list-row"><span className="product-dot bread">E</span><div><strong>Ekşi Mayalı Ekmek</strong><small>Dün, 18:20</small></div><span className="mini-score okay">82</span></div>
      </div>
    </div>
  );
}

function Scan() {
  return <div className="screen-content"><header className="page-header"><div><p className="eyebrow">LABELSCAN</p><h1>Hızlı Tarayıcı</h1></div><button className="help-button">?</button></header><section className="scanner"><div className="scanner-corners" /><div className="barcode">▥ ▥ ▥ ▥ ▥ ▥</div><p>Barkodu veya içerik listesini çerçeveye hizala</p></section><button className="primary-action">＋ Fotoğraf çek</button><div className="tip-card"><span>✦</span><div><strong>Smart Swap hazır</strong><p>Daha temiz ve uygun fiyatlı alternatifleri keşfet.</p></div></div></div>;
}

function Pantry() { return <div className="screen-content"><header className="page-header"><div><p className="eyebrow">ENVANTERİN</p><h1>Akıllı Kiler</h1></div><button className="add-button">＋</button></header><section className="waste-card"><div><p className="eyebrow light">BU AY TASARRUF</p><strong>₺186,40</strong><p>İsrafı önleyerek cebinde kaldı.</p></div><span className="trend">↗ 18%</span></section><div className="section-heading"><h2>Yaklaşan son kullanma</h2></div><div className="scan-list"><div className="list-row"><span className="product-dot milk">S</span><div><strong>Süt</strong><small>Son kullanma tarihine 2 gün kaldı</small></div><span className="warning-pill">2 gün</span></div><div className="list-row"><span className="product-dot yogurt">Y</span><div><strong>Yoğurt</strong><small>Son kullanma tarihine 5 gün kaldı</small></div><span className="mini-score good">5 gün</span></div></div><div className="section-heading"><h2>Tüketim istatistikleri</h2></div><div className="stat-card"><div><strong>12</strong><small>Ekmek</small></div><div><strong>6</strong><small>Yoğurt</small></div><div><strong>4</strong><small>Süt</small></div></div></div>; }

function Social() { return <div className="screen-content"><header className="page-header"><div><p className="eyebrow">TOPLULUK</p><h1>Sosyal Akış</h1></div><button className="avatar teal">♧</button></header><div className="section-heading"><h2>Arkadaşların ne keşfediyor?</h2></div><article className="feed-card"><div className="feed-head"><span className="avatar small">AK</span><div><strong>Ahmet K.</strong><small>2 saat önce</small></div></div><p>Yeni favorim: Organik Keçi Yoğurdu.</p><div className="feed-product"><span className="product-dot yogurt">Y</span><div><strong>Organik Keçi Yoğurdu</strong><small>Temizlik skoru: 96</small></div><button className="add-cart">Ekle</button></div></article><section className="league-card"><div><p className="eyebrow">SIFIR ATIK LİGİ</p><h2>Bu hafta 3. sıradasın</h2><p>İsrafı azaltmaya devam et.</p></div><strong className="rank">#3</strong></section></div>; }

function Profile() { return <div className="screen-content"><header className="page-header"><div><p className="eyebrow">HESABIN</p><h1>Sağlık Karnesi</h1></div><button className="settings">⚙</button></header><div className="profile-intro"><span className="large-avatar">AO</span><div><h2>Ayşe Özdemir</h2><p>Sağlık tercihlerin kişiselleştiriliyor.</p></div></div><div className="section-heading"><h2>Alerjiler ve hassasiyetler</h2><button className="link-button">Düzenle</button></div><div className="preference-list"><div><span className="status active" />Laktoz İntoleransı <small>Aktif</small></div><div><span className="status" />Gluten Hassasiyeti <small>Pasif</small></div></div><section className="pro-card"><p className="eyebrow light">LABELSCAN PRO</p><h2>Daha bilinçli seçimler.</h2><p>Sınırsız tarama, kişisel raporlar ve daha fazlası.</p><button>Pro&apos;yu keşfet <span>→</span></button></section></div>; }

export default function Home() {
  const [activeTab, setActiveTab] = useState("summary");
  const screens: Record<string, React.ReactNode> = { summary: <Summary />, scan: <Scan />, pantry: <Pantry />, sharing: <Social />, profile: <Profile /> };
  return <main className="app-shell"><div className="phone-frame"><div className="status-bar"><span>9:41</span><span>● ● ▰</span></div>{screens[activeTab]}<nav className="tab-bar" aria-label="Ana navigasyon">{tabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? "tab active" : "tab"} onClick={() => setActiveTab(tab.id)}><span className="tab-icon">{tab.icon}</span><span>{tab.label}</span></button>)}</nav></div></main>;
}

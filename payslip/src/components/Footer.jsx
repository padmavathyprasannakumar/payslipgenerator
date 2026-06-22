import React from "react";

const fallbackLogo = "/logo.png";

export default function Footer({ company }) {
  const companyName = company?.company_name || "Vetri Technology Solutions";
  const address = company?.address || "No2, Surandai, Tenkasi - 546678";
  const logoSrc = company?.logo_url || fallbackLogo;

  const handleImageError = (event) => {
    event.currentTarget.src = fallbackLogo;
  };

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <section className="footer-brand">
          <img className="footer-logo" src={logoSrc} onError={handleImageError} alt={`${companyName} Logo`} />
          <div>
            <h3>{companyName}</h3>
            <p>{address}</p>
          </div>
        </section>
      </div>
      <div className="footer-bottom">© 2026 {companyName}. All rights reserved.</div>
    </footer>
  );
}

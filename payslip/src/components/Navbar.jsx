import React from "react";
import { Link, useNavigate } from "react-router-dom";

const fallbackLogo = "/logo.png";

export default function Navbar({ user, onLogout, company }) {
  const navigate = useNavigate();
  const logoSrc = company?.logo_url || fallbackLogo;
  const companyName = company?.company_name || "Vetri Technology Solutions";
  const address = company?.address || "No2, Surandai, Tenkasi - 546678";

  const handleImageError = (event) => {
    event.currentTarget.src = fallbackLogo;
  };

  return (
    <header className="topbar">
      <div className="brand-wrap" onClick={() => navigate("/")}> 
        <img className="brand-logo" src={logoSrc} onError={handleImageError} alt={`${companyName} Logo`} />
        <div>
          <h1>{companyName}</h1>
          <p>{address}</p>
        </div>
      </div>

      <nav className="nav-actions">
        {user ? (
          <>
            <span className="welcome-text">Hi, {user.username}</span>
            <button className="nav-btn light" onClick={() => navigate("/")}>Create Payslip</button>
            <button className="nav-btn primary" onClick={() => navigate("/payslips")}>Existing Payslips</button>
            <button className="nav-btn danger" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link className="nav-btn light" to="/login">Login</Link>
            <Link className="nav-btn primary" to="/signup">Signup</Link>
          </>
        )}
      </nav>
    </header>
  );
}

import React, { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthPage from "./components/AuthPage";
import PayslipForm from "./components/PayslipForm";
import PayslipList from "./components/PayslipList";
import { getCompanyProfile, getCurrentUser, logoutUser } from "./services/api";
import "./App.css";

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function CreatePayslipPage({ editPayslip, setEditPayslip, setRefresh }) {
  return (
    <main className="page-container">
      <PayslipForm
        editPayslip={editPayslip}
        clearEdit={() => setEditPayslip(null)}
        onSaved={() => setRefresh((prev) => !prev)}
      />
    </main>
  );
}

function ExistingPayslipsPage({ refresh, setEditPayslip, user }) {
  const navigate = useNavigate();

  const handleEdit = (payslip) => {
    setEditPayslip(payslip);
    navigate("/");
  };

  return (
    <main className="page-container">
      <div className="page-heading-row">
        <div>
          <h2>My Payslips</h2>
          <p>
            {user?.username ? `Welcome, ${user.username}. ` : ""}
            Your generated payslips are listed here.
          </p>
        </div>
        <button className="btn success" onClick={() => navigate("/")}>+ Create New Payslip</button>
      </div>

      <PayslipList refresh={refresh} onEdit={handleEdit} />
    </main>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editPayslip, setEditPayslip] = useState(null);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    getCompanyProfile()
      .then((res) => setCompany(res.data))
      .catch((error) => console.error("Company profile load failed", error));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAuthSuccess = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setEditPayslip(null);
    }
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar user={user} onLogout={handleLogout} company={company} />
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <AuthPage mode="login" onAuthSuccess={handleAuthSuccess} company={company} />}
          />
          <Route
            path="/signup"
            element={user ? <Navigate to="/" replace /> : <AuthPage mode="signup" onAuthSuccess={handleAuthSuccess} company={company} />}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute user={user}>
                <CreatePayslipPage
                  editPayslip={editPayslip}
                  setEditPayslip={setEditPayslip}
                  setRefresh={setRefresh}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payslips"
            element={
              <ProtectedRoute user={user}>
                <ExistingPayslipsPage
                  refresh={refresh}
                  setEditPayslip={setEditPayslip}
                  user={user}
                />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
        </Routes>
        <Footer company={company} />
      </div>
    </BrowserRouter>
  );
}

export default App;

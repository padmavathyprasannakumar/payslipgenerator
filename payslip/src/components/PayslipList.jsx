import React, { useEffect, useMemo, useState } from "react";
import PayslipCard from "./PayslipCard";
import { getPayslips } from "../services/api";

export default function PayslipList({ refresh, onEdit }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    getPayslips()
      .then((res) => {
        if (isMounted) setList(res.data);
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setError("Unable to load payslips. Please check backend server.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refresh]);

  const filteredList = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return list;

    return list.filter((payslip) => {
      return [
        payslip.employee_name,
        payslip.employee_id,
        payslip.pay_period,
        payslip.pay_date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [list, search]);

  if (loading) {
    return (
      <section className="list-card">
        <h2>Existing Payslips</h2>
        <p>Loading payslips...</p>
      </section>
    );
  }

  return (
    <section className="list-card">
      <div className="section-title-row">
        <h2>Existing Payslips</h2>
        <span>{filteredList.length} of {list.length} record{list.length === 1 ? "" : "s"}</span>
      </div>

      <div className="list-toolbar">
        <input
          className="search-input"
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by employee name, ID, pay period, or date..."
        />
      </div>

      {error && <div className="error-box">{error}</div>}

      {list.length === 0 ? (
        <div className="empty-state">No payslips yet. Create your first payslip from the Create Payslip page.</div>
      ) : filteredList.length === 0 ? (
        <div className="empty-state">No payslips matched your search.</div>
      ) : (
        filteredList.map((payslip) => (
          <PayslipCard key={payslip.id} payslip={payslip} onEdit={onEdit} />
        ))
      )}
    </section>
  );
}

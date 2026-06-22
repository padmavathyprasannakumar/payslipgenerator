import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPayslip, updatePayslip } from "../services/api";

const emptyForm = {
  employee_name: "",
  employee_id: "",
  pay_period: "",
  pay_date: "",
  basic_salary: "",
  hra: "",
  income_tax: "",
  provident_fund: "",
  leave_days: "",
};

const fields = [
  { name: "employee_name", label: "Employee Name", type: "text" },
  { name: "basic_salary", label: "Basic Salary", type: "number" },
  { name: "employee_id", label: "Employee ID", type: "text" },
  { name: "hra", label: "HRA", type: "number" },
  { name: "pay_period", label: "Pay Period", type: "text", placeholder: "Example: January 2026" },
  { name: "income_tax", label: "Income Tax", type: "number" },
  { name: "pay_date", label: "Pay Date", type: "date" },
  { name: "provident_fund", label: "Provident Fund", type: "number" },
  { name: "leave_days", label: "Leave Days", type: "number" },
];

export default function PayslipForm({ onSaved, editPayslip, clearEdit }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (editPayslip) {
      setForm({
        employee_name: editPayslip.employee_name || "",
        employee_id: editPayslip.employee_id || "",
        pay_period: editPayslip.pay_period || "",
        pay_date: editPayslip.pay_date || "",
        basic_salary: editPayslip.basic_salary || "",
        hra: editPayslip.hra || "",
        income_tax: editPayslip.income_tax || "",
        provident_fund: editPayslip.provident_fund || "",
        leave_days: editPayslip.leave_days || "",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [editPayslip]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const preparePayload = () => ({
    ...form,
    basic_salary: Number(form.basic_salary),
    hra: Number(form.hra),
    income_tax: Number(form.income_tax),
    provident_fund: Number(form.provident_fund),
    leave_days: Number(form.leave_days),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      if (editPayslip) {
        await updatePayslip(editPayslip.id, preparePayload());
        clearEdit();
      } else {
        await createPayslip(preparePayload());
      }

      setForm(emptyForm);
      onSaved();
      navigate("/payslips");
    } catch (error) {
      console.error(error);
      setMessage("Unable to save payslip. Please check all fields and backend server.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    clearEdit();
    setMessage("");
  };

  return (
    <section className="form-card" id="create-payslip">
      <div className="section-title-row">
        <h2>{editPayslip ? "Edit Payslip" : "Generate Payslip"}</h2>
        <button className="btn primary" type="button" onClick={() => navigate("/payslips")}>View Existing Payslips</button>
      </div>

      {message && <div className="info-box">{message}</div>}

      <form onSubmit={handleSubmit} className="payslip-form-grid">
        {fields.map((field) => (
          <div className={field.name === "leave_days" ? "input-group right-column" : "input-group"} key={field.name}>
            <label>{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              value={form[field.name]}
              onChange={handleChange}
              placeholder={field.placeholder || ""}
              step={field.type === "number" ? "0.01" : undefined}
              min={field.type === "number" ? "0" : undefined}
              required
            />
          </div>
        ))}

        <div className="form-actions">
          <button className="btn success" type="submit" disabled={saving}>
            {saving ? "Saving..." : editPayslip ? "Update Payslip" : "Generate Payslip"}
          </button>
          {editPayslip && (
            <button className="btn muted" type="button" onClick={handleCancel}>Cancel Edit</button>
          )}
        </div>
      </form>
    </section>
  );
}

import React, { useState } from "react";
import { downloadPDF } from "../services/api";

const money = (value) => `₹${Number(value || 0).toFixed(2)}`;

export default function PayslipCard({ payslip, onEdit }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadPDF(payslip.id);
    } catch (error) {
      console.error(error);
      alert("PDF download failed. Please check backend server.");
    } finally {
      setDownloading(false);
    }
  };

  const leaveDeduction = Number(payslip.basic_salary || 0) / 30 * Number(payslip.leave_days || 0);

  return (
    <article className="payslip-card">
      <div className="employee-box">
        <h2>Payslip</h2>
        <p><strong>Employee:</strong> {payslip.employee_name}</p>
        <p><strong>ID:</strong> {payslip.employee_id}</p>
        <p><strong>Pay Period:</strong> {payslip.pay_period}</p>
        <p><strong>Pay Date:</strong> {payslip.pay_date}</p>
      </div>

      <div className="amount-section">
        <div className="section-strip">Earnings</div>
        <p>Basic: {money(payslip.basic_salary)}</p>
        <p>HRA: {money(payslip.hra)}</p>
        <p><strong>Total: {money(payslip.total_earnings)}</strong></p>
      </div>

      <div className="amount-section">
        <div className="section-strip">Deductions</div>
        <p>Tax: {money(payslip.income_tax)}</p>
        <p>PF: {money(payslip.provident_fund)}</p>
        <p>Leave ({Number(payslip.leave_days || 0)} days): {money(leaveDeduction)}</p>
        <p><strong>Total Deduction: {money(payslip.total_deductions)}</strong></p>
      </div>

      <div className="net-pay-bar">NET PAY: {money(payslip.net_pay)}</div>

      <div className="card-actions">
        <button className="btn warning" onClick={() => onEdit(payslip)}>Edit</button>
        <button className="btn primary" onClick={handleDownload} disabled={downloading}>
          {downloading ? "Downloading..." : "Download PDF"}
        </button>
      </div>
    </article>
  );
}

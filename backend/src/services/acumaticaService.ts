import { query } from '../db/connection.js';

interface Invoice {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  description: string;
  costCenter: string;
  dueDate: string;
  status: 'open' | 'paid' | 'overdue';
  isApproved: boolean;
  approvedBy?: string;
}

interface Vendor {
  id: string;
  name: string;
  email: string;
  isApproved: boolean;
  paymentTerms: string;
  status: 'active' | 'inactive';
}

export class AcumaticaService {
  // Note: In production, this would connect to actual Acumatica API
  // For MVP, we simulate with database queries

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    // Simulate fetching invoice from Acumatica
    const result = await query(
      `SELECT
        id, vendor_id as vendorId, vendor_name as vendorName,
        amount, description, cost_center as costCenter,
        due_date as dueDate, status, is_approved as isApproved,
        approved_by as approvedBy
       FROM invoices
       WHERE id = $1`,
      [invoiceId]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async getVendor(vendorId: string): Promise<Vendor | null> {
    const result = await query(
      `SELECT
        id, name, email, is_approved as isApproved,
        payment_terms as paymentTerms, status
       FROM vendors
       WHERE id = $1`,
      [vendorId]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async validateCostCenter(costCenter: string): Promise<boolean> {
    const result = await query(
      `SELECT id FROM cost_centers WHERE code = $1 AND is_active = true`,
      [costCenter]
    );

    return result.rows.length > 0;
  }

  async checkDuplicatePayment(vendorId: string, amount: number, description: string): Promise<boolean> {
    // Check for duplicate payment in last 30 days
    const result = await query(
      `SELECT id FROM invoices
       WHERE vendor_id = $1 AND amount = $2 AND description = $3
       AND created_at > NOW() - INTERVAL '30 days'
       AND status = 'paid'`,
      [vendorId, amount, description]
    );

    return result.rows.length > 0;
  }

  async getVendorApprovalStatus(vendorId: string): Promise<{
    isApproved: boolean;
    approvedDate?: string;
    lastPaymentDate?: string;
    totalPaid: number;
    outstandingBalance: number;
  }> {
    const vendorResult = await query(
      `SELECT is_approved, approved_date FROM vendors WHERE id = $1`,
      [vendorId]
    );

    if (vendorResult.rows.length === 0) {
      return {
        isApproved: false,
        totalPaid: 0,
        outstandingBalance: 0,
      };
    }

    const vendor = vendorResult.rows[0];

    // Get payment history
    const paymentResult = await query(
      `SELECT
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'open' OR status = 'overdue' THEN amount ELSE 0 END) as outstanding,
        MAX(CASE WHEN status = 'paid' THEN created_at END) as last_payment
       FROM invoices
       WHERE vendor_id = $1`,
      [vendorId]
    );

    const payment = paymentResult.rows[0] || {};

    return {
      isApproved: vendor.is_approved,
      approvedDate: vendor.approved_date,
      lastPaymentDate: payment.last_payment,
      totalPaid: parseFloat(payment.total_paid || 0),
      outstandingBalance: parseFloat(payment.outstanding || 0),
    };
  }

  async approveInvoice(invoiceId: string, approvedBy: string): Promise<void> {
    await query(
      `UPDATE invoices
       SET is_approved = true, approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [approvedBy, invoiceId]
    );
  }

  async rejectInvoice(invoiceId: string, reason: string): Promise<void> {
    await query(
      `UPDATE invoices
       SET status = 'rejected', rejection_reason = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reason, invoiceId]
    );
  }

  async flagForReview(invoiceId: string, reviewReason: string): Promise<void> {
    await query(
      `UPDATE invoices
       SET status = 'pending_review', review_reason = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [reviewReason, invoiceId]
    );
  }

  async getInvoiceMetrics(companyId: string): Promise<{
    totalPending: number;
    totalApproved: number;
    averageApprovalTime: number;
    approvalRate: number;
  }> {
    const result = await query(
      `SELECT
        COUNT(CASE WHEN status = 'open' THEN 1 END) as pending,
        COUNT(CASE WHEN is_approved = true THEN 1 END) as approved,
        AVG(EXTRACT(EPOCH FROM (approved_at - created_at)) / 3600)::int as avg_hours,
        (COUNT(CASE WHEN is_approved = true THEN 1 END)::float / COUNT(*) * 100)::int as approval_rate
       FROM invoices
       WHERE company_id = $1`,
      [companyId]
    );

    const metrics = result.rows[0] || {};

    return {
      totalPending: parseInt(metrics.pending || 0),
      totalApproved: parseInt(metrics.approved || 0),
      averageApprovalTime: parseInt(metrics.avg_hours || 0),
      approvalRate: parseInt(metrics.approval_rate || 0),
    };
  }
}

export const acumaticaService = new AcumaticaService();

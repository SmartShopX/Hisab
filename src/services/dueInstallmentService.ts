import { Customer, DueInstallmentItem, DueInstallmentPlan, PaymentMethod } from '../types';
import { DataStore } from './dataStorage';
import { customerService } from './customerService';

export const dueInstallmentService = {
  /**
   * Create an Installment / EMI Plan for a customer
   */
  createInstallmentPlan(
    customerId: string,
    numberOfInstallments: number,
    intervalDays: number = 30,
    startDateStr?: string,
    notes?: string
  ): DueInstallmentPlan {
    const customers = DataStore.getCustomers();
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) throw new Error('গ্রাহক পাওয়া যায়নি');
    if (customer.totalDue <= 0) throw new Error('গ্রাহকের কোনো বকেয়া নেই');
    if (numberOfInstallments < 2) throw new Error('ন্যূনতম ২টি কিস্তি নির্ধারণ করতে হবে');

    const totalDue = customer.totalDue;
    const baseAmount = Math.floor(totalDue / numberOfInstallments);
    const remainder = totalDue - baseAmount * numberOfInstallments;

    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const installments: DueInstallmentItem[] = [];

    for (let i = 1; i <= numberOfInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setDate(startDate.getDate() + (i - 1) * intervalDays);

      // Add remainder to the last installment
      const amount = i === numberOfInstallments ? baseAmount + remainder : baseAmount;

      installments.push({
        id: `inst_${Date.now()}_${i}`,
        installmentNo: i,
        amount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'Pending',
      });
    }

    const plan: DueInstallmentPlan = {
      id: `plan_${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      customerMobile: customer.mobile,
      totalDueAmount: totalDue,
      numberOfInstallments,
      intervalDays,
      startDate: startDate.toISOString().split('T')[0],
      installments,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
      notes,
    };

    if (!customer.installmentPlans) {
      customer.installmentPlans = [];
    }
    customer.installmentPlans.unshift(plan);
    DataStore.setCustomers([...customers]);

    return plan;
  },

  /**
   * Pay a specific installment in a plan
   */
  async payInstallment(
    customerId: string,
    planId: string,
    installmentId: string,
    paidAmount: number,
    paymentMethod: PaymentMethod = 'Cash',
    notes?: string,
    signatureImage?: string
  ): Promise<{ plan: DueInstallmentPlan; customer: Customer }> {
    const customers = DataStore.getCustomers();
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) throw new Error('গ্রাহক পাওয়া যায়নি');

    const plan = customer.installmentPlans?.find((p) => p.id === planId);
    if (!plan) throw new Error('কিস্তি পরিকল্পনা পাওয়া যায়নি');

    const installment = plan.installments.find((i) => i.id === installmentId);
    if (!installment) throw new Error('কিস্তি পাওয়া যায়নি');

    const receiptNumber = `EMI-REC-${Date.now().toString().slice(-6)}`;
    const today = new Date().toISOString().split('T')[0];

    // Mark installment as paid
    installment.status = 'Paid';
    installment.paidDate = today;
    installment.paidAmount = paidAmount;
    installment.paymentMethod = paymentMethod;
    installment.receiptNumber = receiptNumber;
    installment.notes = notes;

    // Check if all installments are paid
    const allPaid = plan.installments.every((i) => i.status === 'Paid');
    if (allPaid) {
      plan.status = 'Completed';
    }

    // Call customerService to reduce overall customer due & update ledger
    await customerService.collectDue({
      customerId: customer.id,
      amount: paidAmount,
      method: paymentMethod,
      receiptNumber,
      notes: `কিস্তি #${installment.installmentNo} পরিশোধ (${notes || 'ইএমআই কিস্তি'})`,
      collectedBy: 'দোকান ক্যাশিয়ার',
    });

    // If signature provided, update the latest ledger entry
    if (signatureImage && customer.ledger && customer.ledger.length > 0) {
      customer.ledger[0].signatureImage = signatureImage;
    }

    DataStore.setCustomers([...customers]);
    return { plan, customer };
  },

  /**
   * Get all active installment plans across all customers
   */
  getAllInstallmentPlans(): DueInstallmentPlan[] {
    const customers = DataStore.getCustomers();
    const allPlans: DueInstallmentPlan[] = [];
    customers.forEach((c) => {
      if (c.installmentPlans && c.installmentPlans.length > 0) {
        allPlans.push(...c.installmentPlans);
      }
    });
    return allPlans;
  },

  /**
   * Check for overdue installments based on today's date
   */
  updateOverdueInstallments(): void {
    const customers = DataStore.getCustomers();
    const today = new Date().toISOString().split('T')[0];
    let changed = false;

    customers.forEach((c) => {
      if (c.installmentPlans) {
        c.installmentPlans.forEach((plan) => {
          if (plan.status === 'Active') {
            plan.installments.forEach((inst) => {
              if (inst.status === 'Pending' && inst.dueDate < today) {
                inst.status = 'Overdue';
                changed = true;
              }
            });
          }
        });
      }
    });

    if (changed) {
      DataStore.setCustomers([...customers]);
    }
  },
};

export default dueInstallmentService;

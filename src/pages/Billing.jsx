import React, { useState, useEffect } from 'react';
import { 
  Receipt, Plus, Search, X, Check, 
  RefreshCw, DollarSign, Clock, FileText, 
  CheckCircle, CreditCard, Printer, TrendingUp,
  Percent, ArrowUpRight, BarChart3, Users, 
  Calendar, Trash2, Eye, Info, AlertTriangle
} from 'lucide-react';
import { listEntity, createEntity, updateEntity, deleteEntity } from '../services/api';
import { useToast } from '../components/Toast';

export default function Billing() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active Tab: 'invoices' | 'transactions' | 'analytics'
  const [activeTab, setActiveTab] = useState('invoices');

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All'); // 'All' | 'Today' | 'Yesterday' | 'ThisWeek' | 'ThisMonth' | 'Custom'
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Modals State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activePrintPayload, setActivePrintPayload] = useState(null); // { type: 'invoice'|'receipt', data: obj }

  // Create Invoice Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [treatmentName, setTreatmentName] = useState('Consultation');
  const [consultationCharges, setConsultationCharges] = useState('300');
  const [treatmentCharges, setTreatmentCharges] = useState('1200');
  const [procedureCharges, setProcedureCharges] = useState('0');
  const [medicineCharges, setMedicineCharges] = useState('0');
  const [labCharges, setLabCharges] = useState('0');
  const [additionalCharges, setAdditionalCharges] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('5'); // Default 5% tax
  const [notes, setNotes] = useState('');
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);

  // Record Payment Form State
  const [payAmount, setPayAmount] = useState('0');
  const [payMethod, setPayMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  const [collectedBy, setCollectedBy] = useState('Receptionist Desk');
  const [remarks, setRemarks] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Fallback Seed Data
  const defaultInvoices = [
    {
      id: 'INV-258537',
      invoiceNumber: 'INV-258537',
      patientId: '1',
      patientName: 'vaishnavi gutti',
      doctorName: 'Dr. Chaitanya',
      treatmentName: 'Root Canal Therapy',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      totalAmount: 1575.00,
      amountPaid: 0.00,
      remainingBalance: 1575.00,
      paymentMethod: 'UPI',
      paymentStatus: 'Pending',
      consultationCharges: 300,
      treatmentCharges: 1200,
      procedureCharges: 0,
      medicineCharges: 0,
      labCharges: 0,
      additionalCharges: 0,
      discount: 0,
      tax: 75,
      notes: 'Initial therapeutic pulp sit.'
    },
    {
      id: 'INV-257076',
      invoiceNumber: 'INV-257076',
      patientId: '2',
      patientName: 'Rahul Sharma',
      doctorName: 'Dr. Anusha',
      treatmentName: 'Dental Braces Adjustment',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      totalAmount: 3150.00,
      amountPaid: 1500.00,
      remainingBalance: 1650.00,
      paymentMethod: 'Cash',
      paymentStatus: 'Partially Paid',
      consultationCharges: 300,
      treatmentCharges: 2700,
      procedureCharges: 0,
      medicineCharges: 0,
      labCharges: 0,
      additionalCharges: 0,
      discount: 0,
      tax: 150,
      notes: 'Monthly alignment wires.'
    },
    {
      id: 'INV-256112',
      invoiceNumber: 'INV-256112',
      patientId: '3',
      patientName: 'Priya Patel',
      doctorName: 'Dr. Vikram',
      treatmentName: 'Scaling & Polishing',
      invoiceDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
      totalAmount: 1050.00,
      amountPaid: 1050.00,
      remainingBalance: 0.00,
      paymentMethod: 'Credit Card',
      paymentStatus: 'Paid',
      consultationCharges: 200,
      treatmentCharges: 800,
      procedureCharges: 0,
      medicineCharges: 0,
      labCharges: 0,
      additionalCharges: 0,
      discount: 0,
      tax: 50,
      notes: 'Routine plaque prophylaxis.'
    },
    {
      id: 'INV-255010',
      invoiceNumber: 'INV-255010',
      patientId: '4',
      patientName: 'Amit Verma',
      doctorName: 'Dr. Chaitanya',
      treatmentName: 'Porcelain Crown Placement',
      invoiceDate: '2026-07-01',
      dueDate: '2026-07-08',
      totalAmount: 5250.00,
      amountPaid: 0.00,
      remainingBalance: 5250.00,
      paymentMethod: 'Cheque',
      paymentStatus: 'Overdue',
      consultationCharges: 500,
      treatmentCharges: 4500,
      procedureCharges: 0,
      medicineCharges: 0,
      labCharges: 0,
      additionalCharges: 0,
      discount: 0,
      tax: 250,
      notes: 'Permanent crown fixed.'
    }
  ];

  const defaultPayments = [
    { id: 'pay-1', invoiceId: 'INV-257076', patientId: '2', paymentDate: new Date().toISOString().split('T')[0], paymentTime: '11:30 AM', amount: 1500, paymentMethod: 'Cash', transactionReference: 'CASH-REC', collectedBy: 'Receptionist Desk', remarks: 'First installment' },
    { id: 'pay-2', invoiceId: 'INV-256112', patientId: '3', paymentDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], paymentTime: '04:15 PM', amount: 1050, paymentMethod: 'Credit Card', transactionReference: 'TXN-998822', collectedBy: 'Front Desk', remarks: 'Full settled' }
  ];

  const fetchAllData = async () => {
    try {
      setError(null);
      console.log("[Billing System] Syncing entities...");
      
      const invRes = await listEntity('Invoice');
      const payRes = await listEntity('Payment');
      const patRes = await listEntity('Patient');
      const docRes = await listEntity('StaffMember');

      if (invRes.success && patRes.success && docRes.success && payRes.success) {
        setInvoices(invRes.data || []);
        setPaymentsList(payRes.data || []);
        setPatients(patRes.data || []);
        setDoctors(docRes.data || []);
      } else {
        const errorMsg = invRes.message || payRes.message || patRes.message || docRes.message || "Failed loading billing schema";
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.warn("[Billing System] Supabase fetch error, using mockup fallbacks:", err.message);
      setError(err.message || "Running Billing Dashboard in offline mockup fallback mode.");
      
      setInvoices(defaultInvoices);
      setPaymentsList(defaultPayments);
      setPatients([
        { id: '1', name: 'vaishnavi gutti', phone: '9876543210' },
        { id: '2', name: 'Rahul Sharma', phone: '9865432111' },
        { id: '3', name: 'Priya Patel', phone: '9822334455' },
        { id: '4', name: 'Amit Verma', phone: '9855667788' }
      ]);
      setDoctors([
        { id: '1', name: 'Dr. Chaitanya', specialization: 'Endodontist' },
        { id: '2', name: 'Dr. Anusha', specialization: 'Orthodontist' },
        { id: '3', name: 'Dr. Vikram', specialization: 'Pedodontist' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAllData();
  }, []);

  // 9 Summary Metrics Calculations
  const getSummaryMetrics = () => {
    let totalRevenue = 0;
    let todayRevenue = 0;
    let paidBillsCount = 0;
    let pendingBillsCount = 0;
    let partialBillsCount = 0;
    let overdueBillsCount = 0;
    let outstandingBalance = 0;
    let monthlyCollections = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const currentYearMonth = todayStr.substring(0, 7); // "YYYY-MM"

    invoices.forEach(inv => {
      outstandingBalance += inv.remainingBalance || 0;
      totalRevenue += inv.amountPaid || 0;

      const status = (inv.paymentStatus || inv.status || '').toLowerCase();
      if (status === 'paid') paidBillsCount++;
      else if (status === 'partially paid') partialBillsCount++;
      else if (status === 'overdue') overdueBillsCount++;
      else pendingBillsCount++;
    });

    paymentsList.forEach(p => {
      const pDate = p.paymentDate || '';
      if (pDate === todayStr) {
        todayRevenue += p.amount || 0;
      }
      if (pDate.substring(0, 7) === currentYearMonth) {
        monthlyCollections += p.amount || 0;
      }
    });

    return {
      totalRevenue,
      todayRevenue,
      totalBills: invoices.length,
      paidBillsCount,
      pendingBillsCount,
      partialBillsCount,
      overdueBillsCount,
      outstandingBalance,
      monthlyCollections
    };
  };

  const metrics = getSummaryMetrics();

  // Invoice calculations
  const calculateInvoiceTotal = () => {
    const cons = parseFloat(consultationCharges) || 0;
    const treat = parseFloat(treatmentCharges) || 0;
    const proc = parseFloat(procedureCharges) || 0;
    const med = parseFloat(medicineCharges) || 0;
    const lab = parseFloat(labCharges) || 0;
    const add = parseFloat(additionalCharges) || 0;
    const disc = parseFloat(discount) || 0;
    const tx = parseFloat(tax) || 0;

    const subtotal = cons + treat + proc + med + lab + add;
    const finalTotal = subtotal - disc + tx;
    return Math.max(0, finalTotal);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      showToast("Please choose a patient", "warning");
      return;
    }

    try {
      setInvoiceSubmitting(true);
      const patientObj = patients.find(p => p.id === selectedPatientId);
      const doctorObj = doctors.find(d => d.id === selectedDoctorId);
      
      const grandTotal = calculateInvoiceTotal();
      const invNum = `INV-${String(Math.floor(100000 + Math.random() * 900000))}`;
      const todayStr = new Date().toISOString().split('T')[0];
      const dueStr = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]; // Default 7 days due date

      const payload = {
        patientId: selectedPatientId,
        patientName: patientObj ? (patientObj.full_name || patientObj.name) : 'Unknown',
        doctorId: selectedDoctorId || undefined,
        doctorName: doctorObj ? doctorObj.name : (selectedDoctorId ? 'Doctor' : 'Dr. Chaitanya'),
        treatmentName,
        invoiceNumber: invNum,
        invoiceDate: todayStr,
        dueDate: dueStr,
        totalAmount: grandTotal,
        amountPaid: 0,
        remainingBalance: grandTotal,
        paymentStatus: 'Unpaid',
        consultationCharges: parseFloat(consultationCharges) || 0,
        treatmentCharges: parseFloat(treatmentCharges) || 0,
        procedureCharges: parseFloat(procedureCharges) || 0,
        medicineCharges: parseFloat(medicineCharges) || 0,
        labCharges: parseFloat(labCharges) || 0,
        additionalCharges: parseFloat(additionalCharges) || 0,
        discount: parseFloat(discount) || 0,
        tax: parseFloat(tax) || 0,
        notes
      };

      const res = await createEntity('Invoice', payload);
      if (res.success) {
        showToast("Invoice generated successfully!", "success");
        setIsInvoiceModalOpen(false);
        
        // Reset states
        setSelectedPatientId('');
        setSelectedDoctorId('');
        setTreatmentName('Consultation');
        setConsultationCharges('300');
        setTreatmentCharges('1200');
        setProcedureCharges('0');
        setMedicineCharges('0');
        setLabCharges('0');
        setAdditionalCharges('0');
        setDiscount('0');
        setTax('5');
        setNotes('');

        fetchAllData();
      } else {
        showToast(res.message, "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const handleOpenPaymentModal = (inv) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.remainingBalance.toString());
    setPayMethod('UPI');
    setTransactionRef('');
    setRemarks('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amountToPay = parseFloat(payAmount);
    if (isNaN(amountToPay) || amountToPay <= 0) {
      showToast("Payment amount must be greater than zero.", "warning");
      return;
    }

    if (amountToPay > selectedInvoice.remainingBalance) {
      showToast("Payment amount cannot exceed remaining balance.", "warning");
      return;
    }

    try {
      setPaymentSubmitting(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // 1. Save payment transaction record
      const paymentPayload = {
        invoiceId: selectedInvoice.id,
        patientId: selectedInvoice.patientId,
        paymentDate: todayStr,
        paymentTime: timeStr,
        amount: amountToPay,
        paymentMethod: payMethod,
        transactionReference: transactionRef,
        collectedBy,
        remarks
      };

      const payRes = await createEntity('Payment', paymentPayload);
      if (!payRes.success) {
        throw new Error(payRes.message || "Failed saving payment transaction record");
      }

      // 2. Calculate new payment status & update invoice
      const newPaidAmount = selectedInvoice.amountPaid + amountToPay;
      const newRemainingBalance = Math.max(0, selectedInvoice.totalAmount - newPaidAmount);
      
      let newStatus = 'Pending';
      if (newRemainingBalance === 0) {
        newStatus = 'Paid';
      } else if (newPaidAmount > 0) {
        newStatus = 'Partially Paid';
      }

      const invoiceUpdatePayload = {
        amountPaid: newPaidAmount,
        remainingBalance: newRemainingBalance,
        paymentStatus: newStatus,
        paymentMethod: payMethod
      };

      const invRes = await updateEntity('Invoice', selectedInvoice.id, invoiceUpdatePayload);
      if (invRes.success) {
        showToast("Payment collected and registered successfully!", "success");
        setIsPaymentModalOpen(false);
        fetchAllData();

        // Prepare payment receipt for printing immediately
        const receiptData = {
          receiptNumber: `REC-${String(Math.floor(100000 + Math.random() * 900000))}`,
          invoiceNumber: selectedInvoice.invoiceNumber || selectedInvoice.id,
          patientName: selectedInvoice.patientName,
          patientMobile: patients.find(p => p.id === selectedInvoice.patientId)?.phone || 'N/A',
          doctorName: selectedInvoice.doctorName,
          treatment: selectedInvoice.treatmentName,
          amountPaid: amountToPay,
          remainingBalance: newRemainingBalance,
          paymentMethod: payMethod,
          paymentDate: todayStr,
          paymentTime: timeStr
        };
        
        setActivePrintPayload({ type: 'receipt', data: receiptData });
      } else {
        showToast(invRes.message, "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await deleteEntity('Invoice', id);
      if (res.success) {
        showToast("Invoice deleted successfully.", "success");
        setInvoices(prev => prev.filter(inv => inv.id !== id));
      } else {
        showToast("Failed to delete invoice.", "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Printing Layout Triggers
  const triggerPrint = (type, data) => {
    setActivePrintPayload({ type, data });
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Filter & Search Logic
  const getFilteredInvoices = () => {
    return invoices.filter(inv => {
      // 1. Search Query
      const query = searchQuery.toLowerCase();
      const patientName = (inv.patientName || inv.patient_name || '').toLowerCase();
      const invNum = (inv.invoiceNumber || inv.id || '').toLowerCase();
      const docName = (inv.doctorName || inv.doctor_name || '').toLowerCase();
      const treatName = (inv.treatmentName || inv.treatment_name || '').toLowerCase();
      const phone = (patients.find(p => p.id === inv.patientId)?.phone || '').toLowerCase();

      const matchesSearch = !searchQuery || 
        patientName.includes(query) ||
        phone.includes(query) ||
        invNum.includes(query) ||
        docName.includes(query) ||
        treatName.includes(query);

      // 2. Status Badge Filter
      let badgeStatus = (inv.paymentStatus || inv.status || 'Pending').toLowerCase();
      if (badgeStatus === 'pending') badgeStatus = 'unpaid';

      let statusQuery = statusFilter.toLowerCase();
      if (statusQuery === 'pending') statusQuery = 'unpaid';

      const matchesStatus = statusFilter === 'All' || badgeStatus === statusQuery;

      // 3. Payment Method Filter
      const matchesMethod = methodFilter === 'All' || inv.paymentMethod === methodFilter;

      // 4. Date Range Filter
      const invDate = new Date(inv.invoiceDate || inv.created_at || Date.now());
      invDate.setHours(0,0,0,0);
      
      let matchesDate = true;
      const today = new Date();
      today.setHours(0,0,0,0);

      if (dateFilter === 'Today') {
        matchesDate = invDate.getTime() === today.getTime();
      } else if (dateFilter === 'Yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        matchesDate = invDate.getTime() === yesterday.getTime();
      } else if (dateFilter === 'ThisWeek') {
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        matchesDate = invDate >= oneWeekAgo && invDate <= today;
      } else if (dateFilter === 'ThisMonth') {
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        matchesDate = invDate >= oneMonthAgo && invDate <= today;
      } else if (dateFilter === 'Custom' && startDateFilter && endDateFilter) {
        const start = new Date(startDateFilter);
        start.setHours(0,0,0,0);
        const end = new Date(endDateFilter);
        end.setHours(23,59,59,999);
        matchesDate = invDate >= start && invDate <= end;
      }

      return matchesSearch && matchesStatus && matchesMethod && matchesDate;
    });
  };

  const getFilteredTransactions = () => {
    return paymentsList.filter(p => {
      const patient = patients.find(pat => pat.id === p.patientId);
      const patientName = (patient?.name || patient?.full_name || '').toLowerCase();
      const phone = (patient?.phone || '').toLowerCase();
      const invNum = (p.invoiceId || '').toLowerCase();

      const query = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        patientName.includes(query) || 
        phone.includes(query) || 
        invNum.includes(query);

      const matchesMethod = methodFilter === 'All' || p.paymentMethod === methodFilter;

      return matchesSearch && matchesMethod;
    });
  };

  const filteredInvoices = getFilteredInvoices();
  const filteredTransactions = getFilteredTransactions();

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 md:px-0 print:hidden">
      
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-150">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Billing Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">
              Clinic invoice management, transaction records, collections, and financial analytics.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl shadow-sm cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync System</span>
          </button>
          
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Custom Invoice</span>
          </button>
        </div>
      </div>

      {/* Connection Notice / Warning Banners */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-150 rounded-2xl flex items-start gap-3 text-left">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-800">Offline Fallback Mode</h4>
            <p className="text-xs text-amber-650 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* 2. SUMMARY CARDS - 9 financial metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Total Revenue */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-black text-slate-800">₹{metrics.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <p className="text-[9px] text-emerald-600 font-bold mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Cumulative collections
            </p>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Today's Revenue</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-black text-slate-800">₹{metrics.todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <p className="text-[9px] text-slate-505 font-semibold mt-1">Today's collection</p>
          </div>
        </div>

        {/* Monthly Collections */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Monthly Collections</span>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Calendar className="w-4 h-4" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-black text-slate-800">₹{metrics.monthlyCollections.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <p className="text-[9px] text-indigo-600 font-bold mt-1">This month's earnings</p>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Outstanding Balance</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><AlertTriangle className="w-4 h-4" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-black text-rose-700">₹{metrics.outstandingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <p className="text-[9px] text-rose-600 font-bold mt-1">Uncollected credits</p>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Total Bills</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-650"><FileText className="w-4 h-4" /></div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-black text-slate-800">{metrics.totalBills} Invoices</h3>
            <div className="flex gap-1.5 mt-1.5 text-[8px] font-bold">
              <span className="bg-emerald-50 text-emerald-700 px-1 py-0.2 rounded border border-emerald-100">{metrics.paidBillsCount} Paid</span>
              <span className="bg-amber-50 text-amber-700 px-1 py-0.2 rounded border border-amber-100">{metrics.partialBillsCount} Partial</span>
              <span className="bg-rose-50 text-rose-700 px-1 py-0.2 rounded border border-rose-100">{metrics.pendingBillsCount + metrics.overdueBillsCount} Pending</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. TABS BAR */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-px scrollbar-none">
        <button
          onClick={() => { setActiveTab('invoices'); }}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'invoices' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Billing Invoices</span>
        </button>

        <button
          onClick={() => { setActiveTab('transactions'); }}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'transactions' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Payment Transactions History</span>
        </button>

        <button
          onClick={() => { setActiveTab('analytics'); }}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>Financial Analytics</span>
        </button>
      </div>

      {/* Tab Content 1: Billing Invoices */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          
          {/* Advanced Search & Filtering panel */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-sm text-left grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Search input */}
            <div className="space-y-1 md:col-span-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Search Invoices</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Name, phone, Invoice #, doctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.8 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Payment Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.8 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Invoices</option>
                <option value="Paid">Paid status</option>
                <option value="Partially Paid">Partially Paid status</option>
                <option value="Unpaid">Unpaid / Pending status</option>
                <option value="Overdue">Overdue status</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Payment Method</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full px-3 py-1.8 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Invoice Timeframe</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-1.8 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="ThisWeek">This Week</option>
                <option value="ThisMonth">This Month</option>
                <option value="Custom">Custom Date Range</option>
              </select>
            </div>

            {/* Custom Dates Inputs */}
            {dateFilter === 'Custom' && (
              <div className="md:col-span-4 grid grid-cols-2 gap-4 animate-fade-in border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">From Date</label>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="w-full px-3 py-1.8 border border-slate-200 rounded-xl text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">To Date</label>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="w-full px-3 py-1.8 border border-slate-200 rounded-xl text-xs bg-white"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Invoices Table Grid */}
          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden text-left">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border-t border-slate-100">
                <Receipt className="w-8 h-8 text-slate-300 mb-2" />
                <h4 className="font-bold text-slate-800 text-xs">No matching invoices found</h4>
                <p className="text-[11px] text-slate-450 mt-1">Try resetting your search query or status filter parameters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wide">
                      <th className="p-3">Invoice Number</th>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Mobile</th>
                      <th className="p-3">Treatment Details</th>
                      <th className="p-3">Doctor</th>
                      <th className="p-3">Dates</th>
                      <th className="p-3">Amount Summary</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map(inv => {
                      const patient = patients.find(p => p.id === inv.patientId);
                      const phone = patient?.phone || 'N/A';
                      
                      let statusBadgeColor = 'bg-rose-50 text-rose-700 border-rose-100'; // Unpaid
                      let statusText = 'Unpaid';

                      const invStatus = (inv.paymentStatus || inv.status || 'Pending').toLowerCase();
                      if (invStatus === 'paid') {
                        statusBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                        statusText = 'Paid';
                      } else if (invStatus === 'partially paid') {
                        statusBadgeColor = 'bg-yellow-50 text-yellow-700 border-yellow-150';
                        statusText = 'Partially Paid';
                      } else if (invStatus === 'overdue') {
                        statusBadgeColor = 'bg-orange-50 text-orange-700 border-orange-100';
                        statusText = 'Overdue';
                      }

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/40 transition-colors font-medium">
                          
                          {/* Invoice # */}
                          <td className="p-3">
                            <span 
                              onClick={() => triggerPrint('invoice', inv)}
                              className="font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              {inv.invoiceNumber || inv.id}
                            </span>
                          </td>

                          {/* Patient Name */}
                          <td className="p-3 font-bold text-slate-800">{inv.patientName}</td>

                          {/* Mobile */}
                          <td className="p-3 text-slate-550 font-semibold">{phone}</td>

                          {/* Treatment */}
                          <td className="p-3">
                            <div className="font-semibold text-slate-700">{inv.treatmentName}</div>
                            {inv.notes && <div className="text-[9px] text-slate-450 mt-0.5 truncate max-w-[150px]">{inv.notes}</div>}
                          </td>

                          {/* Doctor */}
                          <td className="p-3 text-slate-600 font-semibold">{inv.doctorName}</td>

                          {/* Dates */}
                          <td className="p-3 text-slate-555">
                            <div>Inv: {inv.invoiceDate}</div>
                            <div className="text-[9px] font-bold text-rose-600 mt-0.5">Due: {inv.dueDate}</div>
                          </td>

                          {/* Financial values */}
                          <td className="p-3">
                            <div>Total: <span className="font-bold text-slate-800">₹{inv.totalAmount.toFixed(2)}</span></div>
                            <div className="text-[10px] text-emerald-600">Paid: ₹{inv.amountPaid.toFixed(2)}</div>
                            <div className="text-[10px] text-rose-600 font-bold">Bal: ₹{inv.remainingBalance.toFixed(2)}</div>
                          </td>

                          {/* Status */}
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${statusBadgeColor}`}>
                              {statusText}
                            </span>
                            {inv.paymentMethod && inv.amountPaid > 0 && (
                              <div className="text-[8px] text-slate-400 font-bold mt-1">via {inv.paymentMethod}</div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              
                              {/* Collect payment button */}
                              {inv.remainingBalance > 0 && (
                                <button
                                  onClick={() => handleOpenPaymentModal(inv)}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors text-[10px] font-bold rounded-lg cursor-pointer"
                                  title="Collect Payment"
                                >
                                  Collect
                                </button>
                              )}

                              {/* Print button */}
                              <button
                                onClick={() => triggerPrint('invoice', inv)}
                                className="p-1 text-slate-400 hover:text-slate-750 cursor-pointer"
                                title="Print Invoice / View PDF"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab Content 2: Payment Transactions History */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          
          {/* Filters */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-150 shadow-sm text-left grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Search Transactions</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Patient name, phone, Invoice #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.8 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Payment Method</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full px-3 py-1.8 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-blue-500"
              >
                <option value="All">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            {/* Helper text */}
            <div className="flex items-center text-xs text-slate-450 italic mt-4 pl-2 font-medium">
              Transactions are recorded automatically upon collecting payments.
            </div>

          </div>

          {/* Transactions List */}
          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden text-left">
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <CreditCard className="w-8 h-8 text-slate-300 mb-2" />
                <h4 className="font-bold text-slate-800 text-xs">No transactions matching criteria</h4>
                <p className="text-[11px] text-slate-450 mt-1">Choose alternative filters or check sync status.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wide">
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Invoice Reference</th>
                      <th className="p-3">Patient Name</th>
                      <th className="p-3">Amount Paid</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Transaction ID / Ref</th>
                      <th className="p-3">Collected By</th>
                      <th className="p-3">Remarks</th>
                      <th className="p-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredTransactions.map(p => {
                      const patient = patients.find(pat => pat.id === p.patientId);
                      const patientName = patient?.name || patient?.full_name || 'Patient';
                      
                      const matchedInvoice = invoices.find(inv => inv.id === p.invoiceId || inv.invoiceNumber === p.invoiceId);
                      
                      const receiptPayload = {
                        receiptNumber: `REC-${p.id.substring(0, 6).toUpperCase()}`,
                        invoiceNumber: matchedInvoice?.invoiceNumber || p.invoiceId,
                        patientName,
                        patientMobile: patient?.phone || 'N/A',
                        doctorName: matchedInvoice?.doctorName || 'Dr. Chaitanya',
                        treatment: matchedInvoice?.treatmentName || 'Dental Procedure',
                        amountPaid: p.amount,
                        remainingBalance: matchedInvoice?.remainingBalance || 0,
                        paymentMethod: p.paymentMethod,
                        paymentDate: p.paymentDate,
                        paymentTime: p.paymentTime
                      };

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                          
                          {/* Date Time */}
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{p.paymentDate}</div>
                            <div className="text-[9px] text-slate-450 mt-0.5">{p.paymentTime}</div>
                          </td>

                          {/* Invoice Reference */}
                          <td className="p-3 text-blue-600 font-bold hover:underline cursor-pointer" onClick={() => matchedInvoice && triggerPrint('invoice', matchedInvoice)}>
                            {matchedInvoice?.invoiceNumber || p.invoiceId}
                          </td>

                          {/* Patient */}
                          <td className="p-3 font-bold text-slate-800">{patientName}</td>

                          {/* Amount */}
                          <td className="p-3 text-emerald-600 font-bold text-sm">₹{p.amount.toFixed(2)}</td>

                          {/* Method */}
                          <td className="p-3">
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded font-extrabold text-[9px]">
                              {p.paymentMethod}
                            </span>
                          </td>

                          {/* Ref */}
                          <td className="p-3 text-slate-600 font-mono text-[10px]">{p.transactionReference || 'N/A'}</td>

                          {/* Collector */}
                          <td className="p-3 text-slate-500 font-semibold">{p.collectedBy}</td>

                          {/* Remarks */}
                          <td className="p-3 text-slate-550 italic text-[10px] truncate max-w-[120px]" title={p.remarks}>{p.remarks || 'None'}</td>

                          {/* Print Receipt */}
                          <td className="p-3 text-right">
                            <button
                              onClick={() => triggerPrint('receipt', receiptPayload)}
                              className="p-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-805 rounded-lg cursor-pointer transition-colors"
                              title="Print Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab Content 3: Financial Analytics Center */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 text-left">
          
          {/* Summary metrics grid layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* KPI Cards widget */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
              <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">Collections Overview</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Average Bill Value:</span>
                  <span className="font-extrabold text-slate-800">
                    ₹{metrics.totalBills > 0 ? (invoices.reduce((acc, inv) => acc + inv.totalAmount, 0) / metrics.totalBills).toFixed(2) : '0.00'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Payment Collection Rate:</span>
                  <span className="font-extrabold text-emerald-600">
                    {(() => {
                      const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
                      if (totalInvoiced === 0) return '0%';
                      return `${((metrics.totalRevenue / totalInvoiced) * 100).toFixed(1)}%`;
                    })()}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Outstanding Balances:</span>
                  <span className="font-extrabold text-rose-600">₹{metrics.outstandingBalance.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Doctors share analytics */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4 md:col-span-2">
              <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">Revenue contribution by Treatment</h4>
              
              {/* Custom simple visual list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(() => {
                  const treatmentSales = {};
                  invoices.forEach(inv => {
                    const name = inv.treatmentName || 'Generic Treatment';
                    treatmentSales[name] = (treatmentSales[name] || 0) + (inv.amountPaid || 0);
                  });

                  const sorted = Object.entries(treatmentSales).sort((a,b) => b[1] - a[1]).slice(0, 4);
                  if (sorted.length === 0) {
                    return <div className="text-slate-400 italic text-xs py-4">No revenue data available yet.</div>;
                  }

                  return sorted.map(([treat, value]) => {
                    const percentage = metrics.totalRevenue > 0 ? ((value / metrics.totalRevenue) * 100).toFixed(1) : 0;
                    return (
                      <div key={treat} className="space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700 truncate max-w-[150px]">{treat}</span>
                          <span className="font-extrabold text-slate-800">₹{value.toFixed(2)} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

            </div>

          </div>

          {/* Doctors Share & Top Paying Patients */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Revenue by Doctor */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-3">
              <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">Revenue by Doctor</h4>
              <div className="space-y-3">
                {(() => {
                  const doctorSales = {};
                  invoices.forEach(inv => {
                    const name = inv.doctorName || 'Dr. Chaitanya';
                    doctorSales[name] = (doctorSales[name] || 0) + (inv.amountPaid || 0);
                  });

                  const sorted = Object.entries(doctorSales).sort((a,b) => b[1] - a[1]);
                  if (sorted.length === 0) {
                    return <div className="text-slate-400 italic text-xs py-4">No collections registered.</div>;
                  }

                  return sorted.map(([doc, value]) => {
                    const percent = metrics.totalRevenue > 0 ? ((value / metrics.totalRevenue) * 100).toFixed(1) : 0;
                    return (
                      <div key={doc} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                          <span className="font-bold text-slate-700">{doc}</span>
                        </div>
                        <span className="font-extrabold text-slate-800">₹{value.toFixed(2)} ({percent}%)</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Top Paying Patients */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-3">
              <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">Top Paying Patients</h4>
              <div className="space-y-3">
                {(() => {
                  const patientSales = {};
                  invoices.forEach(inv => {
                    const name = inv.patientName || 'Patient';
                    patientSales[name] = (patientSales[name] || 0) + (inv.amountPaid || 0);
                  });

                  const sorted = Object.entries(patientSales).sort((a,b) => b[1] - a[1]).slice(0, 4);
                  if (sorted.length === 0) {
                    return <div className="text-slate-400 italic text-xs py-4">No payments recorded.</div>;
                  }

                  return sorted.map(([pat, value]) => (
                    <div key={pat} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{pat}</span>
                      <span className="font-extrabold text-emerald-650">₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 4. CREATE INVOICE MODAL */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:hidden">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-150 overflow-hidden animate-fade-in text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-850 text-base">Generate Dental Invoice</h3>
              </div>
              <button 
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-150 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              
              {/* Row 1: Patient and Doctor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Recipient Patient</label>
                  <select
                    required
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name || p.full_name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Linked Dentist / Doctor</label>
                  <select
                    required
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Treatment Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Treatment / Procedure Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tooth Filling, Consultation, Ortho sitting"
                  value={treatmentName}
                  onChange={(e) => setTreatmentName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Charge breakdowns */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 space-y-3.5">
                <div className="font-extrabold text-slate-805 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span>Itemized Dental Billing Charges Breakdown</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Consultation Fees</label>
                    <input
                      type="number"
                      value={consultationCharges}
                      onChange={(e) => setConsultationCharges(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Treatment charges</label>
                    <input
                      type="number"
                      value={treatmentCharges}
                      onChange={(e) => setTreatmentCharges(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Procedure Charges</label>
                    <input
                      type="number"
                      value={procedureCharges}
                      onChange={(e) => setProcedureCharges(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Medicine Charges</label>
                    <input
                      type="number"
                      value={medicineCharges}
                      onChange={(e) => setMedicineCharges(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Lab Charges</label>
                    <input
                      type="number"
                      value={labCharges}
                      onChange={(e) => setLabCharges(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Additional / Misc</label>
                    <input
                      type="number"
                      value={additionalCharges}
                      onChange={(e) => setAdditionalCharges(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-250 bg-white rounded-lg text-xs"
                    />
                  </div>

                </div>

                {/* Discounts and Tax */}
                <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-rose-600 uppercase">Discount (₹)</label>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs text-rose-700 font-bold"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-extrabold text-slate-550 uppercase">Tax / GST Amount (₹)</label>
                    <input
                      type="number"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs text-slate-800 font-bold"
                    />
                  </div>
                </div>

              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-505 uppercase tracking-wide">Remarks / Invoice Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Next sitting scheduled next Saturday."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Summary and Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[9px]">Grand Total</span>
                  <span className="text-lg font-black text-slate-850">₹{calculateInvoiceTotal().toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInvoiceModalOpen(false)}
                    className="px-4 py-2 border border-slate-250 text-slate-650 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={invoiceSubmitting || !selectedPatientId}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {invoiceSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <span>Generate Invoice</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 5. COLLECT PAYMENT MODAL */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:hidden">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-150 overflow-hidden animate-fade-in text-left">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">Record Payment Collection</h3>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-150 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              
              {/* Mini Info */}
              <div className="p-3.5 bg-blue-50/30 border border-blue-50/70 rounded-xl space-y-1.5 text-xs text-left">
                <div className="font-bold text-slate-700">Patient: <span className="text-slate-900 font-extrabold">{selectedInvoice.patientName}</span></div>
                <div className="font-bold text-slate-700">Invoice: <span className="text-slate-900 font-mono font-extrabold">{selectedInvoice.invoiceNumber || selectedInvoice.id}</span></div>
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5 mt-1 text-[11px] font-bold">
                  <span className="text-slate-500">Total: ₹{selectedInvoice.totalAmount.toFixed(2)}</span>
                  <span className="text-rose-600">Remaining Balance: ₹{selectedInvoice.remainingBalance.toFixed(2)}</span>
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Collect Amount (₹)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={selectedInvoice.remainingBalance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              {/* Method select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {/* Ref number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Transaction reference / ID</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref, cheque number"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              {/* Collector name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Collected By Staff</label>
                <input
                  type="text"
                  value={collectedBy}
                  onChange={(e) => setCollectedBy(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-505 uppercase tracking-wide">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Cash collected in full"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 text-slate-650 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {paymentSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Record Transaction</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 6. RECEIPT PREVIEW / PRINT SCREEN IN-MODAL TRIGGER */}
      {activePrintPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 print:hidden animate-fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden text-left border border-slate-150 flex flex-col max-h-[90vh]">
            
            {/* Header control */}
            <div className="flex items-center justify-between px-6 py-4.5 bg-slate-50 border-b border-slate-150 shrink-0">
              <div className="font-extrabold text-slate-805 text-sm">
                Preview printable document ({activePrintPayload.type === 'invoice' ? 'A4 Invoice' : 'A4 Payment Receipt'})
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button 
                  onClick={() => setActivePrintPayload(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-150 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Template preview frame */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
              <div className="bg-white p-8 max-w-xl mx-auto shadow border border-slate-200 rounded-lg">
                {activePrintPayload.type === 'invoice' ? (
                  // Invoice Template Content
                  <div className="space-y-6 text-xs text-slate-700">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Dentora AI Logo" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        <div>
                          <h2 className="text-base font-black text-slate-800 tracking-wide">CHAITANYA CARE DENTAL</h2>
                          <p className="text-[10px] text-slate-450 mt-1">12, Green Glen Layout, Outer Ring Road, Bangalore</p>
                          <p className="text-[10px] text-slate-455 mt-0.5">Phone: +91 98765 43210 | GSTIN: 29AAAAA1111A1Z1</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-blue-600">INVOICE</div>
                        <div className="font-bold text-slate-805 mt-1"># {activePrintPayload.data.invoiceNumber || activePrintPayload.data.id}</div>
                        <div className="text-[10px] text-slate-450 mt-0.5">Date: {activePrintPayload.data.invoiceDate}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div>
                        <div className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">Patient Details</div>
                        <div className="font-bold text-slate-800 mt-1">{activePrintPayload.data.patientName}</div>
                        <div className="text-slate-500 mt-0.5">Mobile: {patients.find(p => p.id === activePrintPayload.data.patientId)?.phone || 'N/A'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">Attending Doctor</div>
                        <div className="font-bold text-slate-850 mt-1">{activePrintPayload.data.doctorName}</div>
                        <div className="text-slate-550 mt-0.5">Due Date: {activePrintPayload.data.dueDate}</div>
                      </div>
                    </div>

                    <div className="border-t border-b border-slate-200 py-3.5 my-3">
                      <div className="font-bold text-slate-800 text-[11px] mb-2 uppercase">Prescribed Treatment / Procedures</div>
                      <div className="flex justify-between items-center text-xs font-semibold py-1">
                        <span className="text-slate-700">{activePrintPayload.data.treatmentName}</span>
                        <span className="text-slate-850 font-bold">₹{activePrintPayload.data.treatmentCharges.toFixed(2)}</span>
                      </div>
                      {activePrintPayload.data.consultationCharges > 0 && (
                        <div className="flex justify-between items-center text-xs font-semibold py-1">
                          <span className="text-slate-700">Consultation Charges</span>
                          <span className="text-slate-850 font-bold">₹{activePrintPayload.data.consultationCharges.toFixed(2)}</span>
                        </div>
                      )}
                      {activePrintPayload.data.procedureCharges > 0 && (
                        <div className="flex justify-between items-center text-xs font-semibold py-1">
                          <span className="text-slate-700">Clinical Procedure Fees</span>
                          <span className="text-slate-855 font-bold">₹{activePrintPayload.data.procedureCharges.toFixed(2)}</span>
                        </div>
                      )}
                      {activePrintPayload.data.medicineCharges > 0 && (
                        <div className="flex justify-between items-center text-xs font-semibold py-1">
                          <span className="text-slate-700">Medicine Charges</span>
                          <span className="text-slate-850 font-bold">₹{activePrintPayload.data.medicineCharges.toFixed(2)}</span>
                        </div>
                      )}
                      {activePrintPayload.data.labCharges > 0 && (
                        <div className="flex justify-between items-center text-xs font-semibold py-1">
                          <span className="text-slate-700">Dental Lab Fees</span>
                          <span className="text-slate-850 font-bold">₹{activePrintPayload.data.labCharges.toFixed(2)}</span>
                        </div>
                      )}
                      {activePrintPayload.data.additionalCharges > 0 && (
                        <div className="flex justify-between items-center text-xs font-semibold py-1">
                          <span className="text-slate-700">Additional Miscellaneous Charges</span>
                          <span className="text-slate-850 font-bold">₹{activePrintPayload.data.additionalCharges.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 text-right w-1/2 ml-auto border-b border-slate-100 pb-3">
                      {activePrintPayload.data.discount > 0 && (
                        <div className="flex justify-between items-center text-xs text-rose-600 font-bold">
                          <span>Discount Given:</span>
                          <span>- ₹{activePrintPayload.data.discount.toFixed(2)}</span>
                        </div>
                      )}
                      {activePrintPayload.data.tax > 0 && (
                        <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                          <span>Tax / GST:</span>
                          <span>+ ₹{activePrintPayload.data.tax.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm font-black text-slate-850 pt-1.5 border-t border-slate-200">
                        <span>Grand Total:</span>
                        <span>₹{activePrintPayload.data.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-emerald-700 font-bold">
                        <span>Amount Settled:</span>
                        <span>₹{activePrintPayload.data.amountPaid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-rose-600 font-black pt-1">
                        <span>Outstanding Balance:</span>
                        <span>₹{activePrintPayload.data.remainingBalance.toFixed(2)}</span>
                      </div>
                    </div>

                    {activePrintPayload.data.notes && (
                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-left">
                        <span className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wide block mb-1">Invoice Remarks</span>
                        <p className="font-medium leading-relaxed">{activePrintPayload.data.notes}</p>
                      </div>
                    )}

                    <div className="pt-8 border-t border-slate-150 flex justify-between items-end">
                      <div className="text-left space-y-1">
                        <div className="w-16 h-16 bg-slate-100 flex items-center justify-center border border-slate-200 text-[10px] text-slate-400 font-bold">QR Code</div>
                        <p className="text-[9px] text-slate-400 font-bold mt-1">Scan to pay via UPI</p>
                      </div>
                      
                      <div className="text-right space-y-5">
                        <div className="w-24 border-b border-slate-300 ml-auto h-5" />
                        <p className="text-[10px] font-bold text-slate-550 uppercase">Authorized Signature</p>
                      </div>
                    </div>

                    <div className="text-center text-[10px] text-slate-400 font-bold pt-4">
                      Thank you for choosing Chaitanya Care Dental! We care for your healthy smile.
                    </div>

                  </div>
                ) : (
                  // Receipt Template Content
                  <div className="space-y-6 text-xs text-slate-700">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Dentora AI Logo" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        <div>
                          <h2 className="text-base font-black text-slate-800 tracking-wide">CHAITANYA CARE DENTAL</h2>
                          <p className="text-[10px] text-slate-450 mt-1">12, Green Glen Layout, Outer Ring Road, Bangalore</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-black text-emerald-600">PAYMENT RECEIPT</div>
                        <div className="font-bold text-slate-850 mt-1">{activePrintPayload.data.receiptNumber}</div>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-left border-b border-slate-200 pb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Invoice Number:</span>
                        <span className="font-bold text-slate-800">{activePrintPayload.data.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Patient Name:</span>
                        <span className="font-bold text-slate-800">{activePrintPayload.data.patientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Patient Mobile:</span>
                        <span className="font-semibold text-slate-700">{activePrintPayload.data.patientMobile}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Treatment:</span>
                        <span className="font-semibold text-slate-700">{activePrintPayload.data.treatment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Attending Dentist:</span>
                        <span className="font-semibold text-slate-700">{activePrintPayload.data.doctorName}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide block">Amount Settled</span>
                        <span className="text-lg font-black text-emerald-800">₹{activePrintPayload.data.amountPaid.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide block">Payment Method</span>
                        <span className="text-xs font-bold text-slate-800">{activePrintPayload.data.paymentMethod}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-3">
                      <span className="text-slate-500 font-semibold">Remaining balance outstanding:</span>
                      <span className="font-black text-rose-600 text-sm">₹{activePrintPayload.data.remainingBalance.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                      <span>Transaction Time: {activePrintPayload.data.paymentDate} at {activePrintPayload.data.paymentTime}</span>
                    </div>

                    <div className="pt-8 flex justify-between items-end">
                      <div className="text-left text-[10px] text-slate-450 italic">
                        Authorized payment confirmation.
                      </div>
                      
                      <div className="text-right space-y-4">
                        <div className="w-24 border-b border-slate-300 ml-auto h-4" />
                        <p className="text-[10px] font-bold text-slate-550 uppercase">Authorized Signature</p>
                      </div>
                    </div>

                    <div className="text-center text-[10px] text-slate-400 font-bold pt-4 border-t border-slate-100">
                      Thank you for your payment! Chaitanya Care Dental.
                    </div>

                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. PRINTABLE HIDDEN AREA FOR WEB BROWSERS TRIGGER */}
      {activePrintPayload && (
        <div id="print-section" className="hidden print:block bg-white text-black p-8 font-sans w-full max-w-4xl mx-auto">
          {activePrintPayload.type === 'invoice' ? (
            // A4 Printable Invoice Sheet
            <div className="space-y-6 text-xs text-slate-700">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Dentora AI Logo" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  <div>
                    <h2 className="text-base font-black text-slate-850 tracking-wide">CHAITANYA CARE DENTAL</h2>
                    <p className="text-[10px] text-slate-450 mt-1">12, Green Glen Layout, Outer Ring Road, Bangalore</p>
                    <p className="text-[10px] text-slate-455 mt-0.5">Phone: +91 98765 43210 | GSTIN: 29AAAAA1111A1Z1</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-blue-600">INVOICE</div>
                  <div className="font-bold text-slate-805 mt-1"># {activePrintPayload.data.invoiceNumber || activePrintPayload.data.id}</div>
                  <div className="text-[10px] text-slate-450 mt-0.5">Date: {activePrintPayload.data.invoiceDate}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <div className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">Patient Details</div>
                  <div className="font-bold text-slate-800 mt-1">{activePrintPayload.data.patientName}</div>
                  <div className="text-slate-500 mt-0.5">Mobile: {patients.find(p => p.id === activePrintPayload.data.patientId)?.phone || 'N/A'}</div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">Attending Doctor</div>
                  <div className="font-bold text-slate-850 mt-1">{activePrintPayload.data.doctorName}</div>
                  <div className="text-slate-550 mt-0.5">Due Date: {activePrintPayload.data.dueDate}</div>
                </div>
              </div>

              <div className="border-t border-b border-slate-200 py-3.5 my-3">
                <div className="font-bold text-slate-800 text-[11px] mb-2 uppercase">Prescribed Treatment / Procedures</div>
                <div className="flex justify-between items-center text-xs font-semibold py-1">
                  <span className="text-slate-700">{activePrintPayload.data.treatmentName}</span>
                  <span className="text-slate-850 font-bold">₹{activePrintPayload.data.treatmentCharges.toFixed(2)}</span>
                </div>
                {activePrintPayload.data.consultationCharges > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold py-1">
                    <span className="text-slate-700">Consultation Charges</span>
                    <span className="text-slate-850 font-bold">₹{activePrintPayload.data.consultationCharges.toFixed(2)}</span>
                  </div>
                )}
                {activePrintPayload.data.procedureCharges > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold py-1">
                    <span className="text-slate-700">Clinical Procedure Fees</span>
                    <span className="text-slate-850 font-bold">₹{activePrintPayload.data.procedureCharges.toFixed(2)}</span>
                  </div>
                )}
                {activePrintPayload.data.medicineCharges > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold py-1">
                    <span className="text-slate-700">Medicine Charges</span>
                    <span className="text-slate-850 font-bold">₹{activePrintPayload.data.medicineCharges.toFixed(2)}</span>
                  </div>
                )}
                {activePrintPayload.data.labCharges > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold py-1">
                    <span className="text-slate-700">Dental Lab Fees</span>
                    <span className="text-slate-850 font-bold">₹{activePrintPayload.data.labCharges.toFixed(2)}</span>
                  </div>
                )}
                {activePrintPayload.data.additionalCharges > 0 && (
                  <div className="flex justify-between items-center text-xs font-semibold py-1">
                    <span className="text-slate-700">Additional Miscellaneous Charges</span>
                    <span className="text-slate-850 font-bold">₹{activePrintPayload.data.additionalCharges.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-right w-1/2 ml-auto border-b border-slate-100 pb-3">
                {activePrintPayload.data.discount > 0 && (
                  <div className="flex justify-between items-center text-xs text-rose-600 font-bold">
                    <span>Discount Given:</span>
                    <span>- ₹{activePrintPayload.data.discount.toFixed(2)}</span>
                  </div>
                )}
                {activePrintPayload.data.tax > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                    <span>Tax / GST:</span>
                    <span>+ ₹{activePrintPayload.data.tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-black text-slate-850 pt-1.5 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>₹{activePrintPayload.data.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-emerald-700 font-bold">
                  <span>Amount Settled:</span>
                  <span>₹{activePrintPayload.data.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-rose-600 font-black pt-1">
                  <span>Outstanding Balance:</span>
                  <span>₹{activePrintPayload.data.remainingBalance.toFixed(2)}</span>
                </div>
              </div>

              {activePrintPayload.data.notes && (
                <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-left">
                  <span className="font-extrabold text-[9px] text-slate-400 uppercase tracking-wide block mb-1">Invoice Remarks</span>
                  <p className="font-medium leading-relaxed">{activePrintPayload.data.notes}</p>
                </div>
              )}

              <div className="pt-8 border-t border-slate-150 flex justify-between items-end text-left">
                <div className="space-y-1">
                  <div className="w-16 h-16 bg-slate-100 flex items-center justify-center border border-slate-250 text-[10px] text-slate-400 font-bold">QR Code</div>
                  <p className="text-[9px] text-slate-400 font-bold mt-1">Scan to pay via UPI</p>
                </div>
                
                <div className="text-right space-y-5">
                  <div className="w-24 border-b border-slate-300 ml-auto h-5" />
                  <p className="text-[10px] font-bold text-slate-550 uppercase">Authorized Signature</p>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 font-bold pt-4">
                Thank you for choosing Chaitanya Care Dental! We care for your healthy smile.
              </div>
            </div>
          ) : (
            // A4 Printable Receipt Sheet
            <div className="space-y-6 text-xs text-slate-700">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Dentora AI Logo" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  <div>
                    <h2 className="text-base font-black text-slate-800 tracking-wide">CHAITANYA CARE DENTAL</h2>
                    <p className="text-[10px] text-slate-455 mt-1">12, Green Glen Layout, Outer Ring Road, Bangalore</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-emerald-600">PAYMENT RECEIPT</div>
                  <div className="font-bold text-slate-850 mt-1">{activePrintPayload.data.receiptNumber}</div>
                </div>
              </div>

              <div className="space-y-2.5 text-left border-b border-slate-200 pb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Invoice Number:</span>
                  <span className="font-bold text-slate-800">{activePrintPayload.data.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Patient Name:</span>
                  <span className="font-bold text-slate-800">{activePrintPayload.data.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Patient Mobile:</span>
                  <span className="font-semibold text-slate-700">{activePrintPayload.data.patientMobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Treatment:</span>
                  <span className="font-semibold text-slate-700">{activePrintPayload.data.treatment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Attending Dentist:</span>
                  <span className="font-semibold text-slate-700">{activePrintPayload.data.doctorName}</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide block">Amount Settled</span>
                  <span className="text-lg font-black text-emerald-800">₹{activePrintPayload.data.amountPaid.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide block">Payment Method</span>
                  <span className="text-xs font-bold text-slate-800">{activePrintPayload.data.paymentMethod}</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-3">
                <span className="text-slate-500 font-semibold">Remaining balance outstanding:</span>
                <span className="font-black text-rose-600 text-sm">₹{activePrintPayload.data.remainingBalance.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-450 font-bold">
                <span>Transaction Time: {activePrintPayload.data.paymentDate} at {activePrintPayload.data.paymentTime}</span>
              </div>

              <div className="pt-8 flex justify-between items-end text-left">
                <div className="text-left text-[10px] text-slate-450 italic">
                  Authorized payment confirmation.
                </div>
                
                <div className="text-right space-y-4">
                  <div className="w-24 border-b border-slate-300 ml-auto h-4" />
                  <p className="text-[10px] font-bold text-slate-550 uppercase">Authorized Signature</p>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 font-bold pt-4 border-t border-slate-100">
                Thank you for your payment! Chaitanya Care Dental.
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

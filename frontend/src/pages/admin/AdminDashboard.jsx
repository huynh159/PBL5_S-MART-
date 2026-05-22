import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, ShoppingBag, FileText, DollarSign as DollarIcon, 
  ArrowUpRight, ArrowDownRight, TrendingUp, 
  Package, CheckCircle, Clock, Bell, Ticket, AlertTriangle, Calendar, RefreshCw
} from 'lucide-react';
import adminService from '../../services/admin.service';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

// Removed date-fns to avoid dependency issues

const MotionDiv = motion.div;
const MotionTr = motion.tr;
let pdfModulesPromise = null;
let pdfFontBase64Promise = null;

const loadFontAsBase64 = async (url) => {
  const buffer = await fetch(url).then((response) => response.arrayBuffer());
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

const loadPdfDependencies = async () => {
  if (!pdfModulesPromise) {
    pdfModulesPromise = Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
      import('../../assets/fonts/arial.ttf?url'),
      import('../../assets/fonts/arialbd.ttf?url'),
    ]).then(([jspdfModule, autoTableModule, regularFontModule, boldFontModule]) => ({
      jsPDF: jspdfModule.jsPDF,
      autoTable: autoTableModule.default,
      arialRegularUrl: regularFontModule.default,
      arialBoldUrl: boldFontModule.default,
    }));
  }

  return pdfModulesPromise;
};

const registerPdfFonts = async (pdf) => {
  const { arialRegularUrl, arialBoldUrl } = await loadPdfDependencies();
  if (!pdfFontBase64Promise) {
    pdfFontBase64Promise = Promise.all([
      loadFontAsBase64(arialRegularUrl),
      loadFontAsBase64(arialBoldUrl),
    ]);
  }
  const [regular, bold] = await pdfFontBase64Promise;
  pdf.addFileToVFS('arial.ttf', regular);
  pdf.addFont('arial.ttf', 'Arial', 'normal');
  pdf.addFileToVFS('arialbd.ttf', bold);
  pdf.addFont('arialbd.ttf', 'Arial', 'bold');
  pdf.setFont('Arial', 'normal');
};

// ----------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------

// Counter Animation Component
const Counter = ({ from = 0, to, duration = 1, isCurrency = false }) => {
  const [count, setCount] = useState(from);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      setCount(Math.floor(progress * (to - from) + from));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(to);
      }
    };
    window.requestAnimationFrame(step);
  }, [from, to, duration]);

  if (isCurrency) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(count);
  }
  return new Intl.NumberFormat('vi-VN').format(count);
};

// ----------------------------------------------------------------------
// MAIN DASHBOARD
// ----------------------------------------------------------------------

const AdminDashboard = () => {
  const { token } = useAuth();
  
  // States
  const [stats, setStats] = useState({
    totalRevenue: 0, todayRevenue: 0, totalOrders: 0, todayOrders: 0, pendingOrders: 0,
    totalProducts: 0, totalUsers: 0, newCustomers7d: 0, orderStatusStats: [],
    revenueByMonth: [], topProducts: [], recentOrders: [], lowStockProducts: [], topCustomers: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('year'); // 'today', '7d', '30d', 'year'
  const [notifications, setNotifications] = useState([]);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const socketRef = useRef(null);
  const prevOrdersRef = useRef([]);

  // Constants
  const ORDER_STATUS_META = {
    PENDING: { label: 'Chờ xác nhận', color: '#f59e0b', icon: Clock },
    PAID: { label: 'Đã thanh toán', color: '#14b8a6', icon: CheckCircle },
    CONFIRMED: { label: 'Đang chuẩn bị', color: '#8b5cf6', icon: Package },
    SHIPPING: { label: 'Đang giao', color: '#0ea5e9', icon: TrendingUp },
    DELIVERED: { label: 'Thành công', color: '#22c55e', icon: CheckCircle },
    CANCELLED: { label: 'Đã hủy', color: '#ef4444', icon: ArrowDownRight },
  };

  const normalizedOrderStatusStats = Object.keys(ORDER_STATUS_META).map((status) => {
    const raw = (stats.orderStatusStats || []).find((s) => String(s.name).toUpperCase() === status);
    return { name: status, value: Number(raw?.value || 0) };
  }).filter((item) => item.value > 0);

  // Export PDF Logic — pure jsPDF (no html2canvas, no oklch issue)
  const exportPDF = async () => {
    const toastId = toast.loading('Đang tạo báo cáo PDF...');

    try {
      const { jsPDF, autoTable } = await loadPdfDependencies();
      const pdf = new jsPDF('p', 'mm', 'a4');
      await registerPdfFonts(pdf);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const reportDate = new Date();
      const reportDateLabel = reportDate.toLocaleString('vi-VN');
      const reportFileDate = reportDate.toISOString().slice(0, 10);
      const rangeLabelMap = { today: 'Hôm nay', '7d': '7 ngày qua', '30d': '30 ngày qua', year: 'Năm nay' };
      const rangeLabel = rangeLabelMap[dateRange] || 'Năm nay';
      const fmtNumber = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));
      const fmtVND = (value) => `${fmtNumber(value)} VND`;
      const tableTheme = {
        theme: 'grid',
        styles: {
          font: 'Arial',
          fontSize: 8.5,
          cellPadding: 2.4,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
          overflow: 'linebreak',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [31, 41, 55],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: margin, right: margin },
      };

      const ensurePageSpace = (currentY, needed = 32) => {
        if (currentY + needed > pageHeight - 18) {
          pdf.addPage();
          return margin;
        }
        return currentY;
      };

      const sectionTitle = (title, currentY) => {
        const nextY = ensurePageSpace(currentY, 16);
        pdf.setFillColor(79, 70, 229);
        pdf.roundedRect(margin, nextY, 3.5, 7, 1, 1, 'F');
        pdf.setFont('Arial', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(15, 23, 42);
        pdf.text(title, margin + 7, nextY + 5.3);
        return nextY + 10;
      };

      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 34, 'F');
      pdf.setFillColor(79, 70, 229);
      pdf.rect(0, 30, pageWidth, 4, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('Arial', 'bold');
      pdf.setFontSize(19);
      pdf.text('S-MART SPORT SHOP', margin, 13);
      pdf.setFontSize(10);
      pdf.setFont('Arial', 'normal');
      pdf.text('Báo cáo quản trị kinh doanh', margin, 22);
      pdf.text(`Kỳ báo cáo: ${rangeLabel}`, pageWidth - margin, 13, { align: 'right' });
      pdf.text(`Ngày xuất: ${reportDateLabel}`, pageWidth - margin, 22, { align: 'right' });

      let y = 45;
      const kpis = [
        { label: 'Doanh thu', value: fmtVND(stats.totalRevenue), note: 'Đơn DELIVERED trong kỳ' },
        { label: 'Đơn hàng', value: fmtNumber(stats.totalOrders), note: `${fmtNumber(stats.pendingOrders)} đơn chờ xử lý` },
        { label: 'Khách hàng', value: fmtNumber(stats.totalUsers), note: `+${fmtNumber(stats.newCustomers7d)} trong 7 ngày` },
        { label: 'Sản phẩm', value: fmtNumber(stats.totalProducts), note: `${fmtNumber(stats.lowStockProducts?.length)} cảnh báo tồn kho` },
      ];
      const cardGap = 3;
      const cardWidth = (pageWidth - margin * 2 - cardGap * 3) / 4;
      kpis.forEach((kpi, index) => {
        const x = margin + index * (cardWidth + cardGap);
        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(226, 232, 240);
        pdf.roundedRect(x, y, cardWidth, 25, 3, 3, 'FD');
        pdf.setFont('Arial', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(100, 116, 139);
        pdf.text(kpi.label.toUpperCase(), x + 3, y + 6);
        pdf.setFontSize(10);
        pdf.setTextColor(15, 23, 42);
        pdf.text(kpi.value, x + 3, y + 14);
        pdf.setFont('Arial', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139);
        pdf.text(kpi.note, x + 3, y + 21);
      });
      y += 34;

      y = sectionTitle('1. Tóm tắt điều hành', y);
      autoTable(pdf, {
        ...tableTheme,
        startY: y,
        head: [['Chỉ số', 'Giá trị', 'Ý nghĩa quản trị']],
        body: [
          ['Doanh thu ghi nhận', fmtVND(stats.totalRevenue), 'Chỉ tính đơn hàng DELIVERED trong kỳ báo cáo'],
          ['Đơn hàng trong kỳ', fmtNumber(stats.totalOrders), 'Loại trừ VNPay PENDING để tránh ghi nhận đơn chưa thanh toán'],
          ['Doanh thu hôm nay', fmtVND(stats.todayRevenue), 'Dùng theo dõi vận hành trong ngày'],
          ['Đơn hàng hôm nay', fmtNumber(stats.todayOrders), 'Tín hiệu nhu cầu hiện tại'],
          ['Đơn chờ xử lý', fmtNumber(stats.pendingOrders), 'Cần ưu tiên xác nhận và vận hành'],
        ],
        columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold' }, 1: { cellWidth: 42, halign: 'right' } },
      });
      y = pdf.lastAutoTable.finalY + 10;

      y = sectionTitle('2. Doanh thu theo tháng', y);
      const revenueRows = (stats.revenueByMonth || []).map((item) => [
        item.month,
        fmtVND(item.revenue),
        Number(item.revenue || 0) > 0 ? 'Có doanh thu' : 'Chưa phát sinh',
      ]);
      const revenueTotal = (stats.revenueByMonth || []).reduce((sum, item) => sum + Number(item.revenue || 0), 0);
      autoTable(pdf, {
        ...tableTheme,
        startY: y,
        head: [['Tháng', 'Doanh thu', 'Ghi chú']],
        body: [...revenueRows, ['Tổng cộng', fmtVND(revenueTotal), 'Tổng doanh thu theo bảng']],
        columnStyles: { 0: { cellWidth: 32 }, 1: { cellWidth: 54, halign: 'right' } },
        didParseCell: (data) => {
          if (data.row.index === revenueRows.length) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [238, 242, 255];
            data.cell.styles.textColor = [67, 56, 202];
          }
        },
      });
      y = pdf.lastAutoTable.finalY + 10;

      y = sectionTitle('3. Cơ cấu trạng thái đơn hàng', y);
      const statusRows = normalizedOrderStatusStats.map((item) => {
        const ratio = stats.totalOrders ? (Number(item.value) / Number(stats.totalOrders)) * 100 : 0;
        return [ORDER_STATUS_META[item.name]?.label || item.name, fmtNumber(item.value), `${ratio.toFixed(1)}%`];
      });
      autoTable(pdf, {
        ...tableTheme,
        startY: y,
        head: [['Trạng thái', 'Số đơn', 'Tỷ trọng']],
        body: statusRows.length ? statusRows : [['Không có dữ liệu', '0', '0%']],
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      });
      y = pdf.lastAutoTable.finalY + 10;

      y = sectionTitle('4. Sản phẩm bán chạy', y);
      autoTable(pdf, {
        ...tableTheme,
        startY: y,
        head: [['#', 'Sản phẩm', 'Đã bán', 'Doanh thu']],
        body: (stats.topProducts || []).length
          ? (stats.topProducts || []).map((product, index) => [String(index + 1), product.name || '-', fmtNumber(product.totalSold), fmtVND(product.totalRevenue)])
          : [['-', 'Không có dữ liệu', '0', '0 VND']],
        columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 2: { cellWidth: 28, halign: 'right' }, 3: { cellWidth: 42, halign: 'right' } },
      });
      y = pdf.lastAutoTable.finalY + 10;

      y = sectionTitle('5. Khách hàng giá trị cao', y);
      autoTable(pdf, {
        ...tableTheme,
        startY: y,
        head: [['#', 'Email', 'Số đơn', 'Tổng chi tiêu']],
        body: (stats.topCustomers || []).length
          ? (stats.topCustomers || []).map((customer, index) => [String(index + 1), customer.email || '-', fmtNumber(customer.orderCount), fmtVND(customer.totalSpent)])
          : [['-', 'Không có dữ liệu', '0', '0 VND']],
        columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 2: { cellWidth: 28, halign: 'right' }, 3: { cellWidth: 42, halign: 'right' } },
      });
      y = pdf.lastAutoTable.finalY + 10;

      y = sectionTitle('6. Cảnh báo tồn kho', y);
      autoTable(pdf, {
        ...tableTheme,
        startY: y,
        head: [['#', 'Sản phẩm', 'Tồn kho', 'Mức ưu tiên']],
        body: (stats.lowStockProducts || []).length
          ? (stats.lowStockProducts || []).map((product, index) => [String(index + 1), product.name || '-', fmtNumber(product.stock), Number(product.stock) <= 5 ? 'Khẩn cấp' : 'Cần nhập thêm'])
          : [['-', 'Kho ổn định', '-', 'Không có cảnh báo']],
        columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 2: { cellWidth: 28, halign: 'right' }, 3: { cellWidth: 38 } },
      });
      y = pdf.lastAutoTable.finalY + 10;

      y = sectionTitle('7. Đơn hàng gần đây', y);
      autoTable(pdf, {
        ...tableTheme,
        startY: y,
        head: [['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Ngày tạo']],
        body: (stats.recentOrders || []).length
          ? (stats.recentOrders || []).map((order) => [`#${order.id}`, order.email || '-', fmtVND(order.total), ORDER_STATUS_META[order.status]?.label || order.status, new Date(order.createdAt).toLocaleString('vi-VN')])
          : [['-', 'Không có dữ liệu', '0 VND', '-', '-']],
        columnStyles: { 0: { cellWidth: 22 }, 2: { cellWidth: 36, halign: 'right' }, 3: { cellWidth: 34 }, 4: { cellWidth: 34 } },
      });
      y = pdf.lastAutoTable.finalY + 14;

      y = ensurePageSpace(y, 34);
      pdf.setDrawColor(203, 213, 225);
      pdf.line(margin, y + 18, margin + 60, y + 18);
      pdf.line(pageWidth - margin - 60, y + 18, pageWidth - margin, y + 18);
      pdf.setFont('Arial', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Người lập báo cáo', margin + 30, y + 24, { align: 'center' });
      pdf.text('Quản lý phê duyệt', pageWidth - margin - 30, y + 24, { align: 'center' });

      const pageCount = pdf.getNumberOfPages();
      for (let page = 1; page <= pageCount; page++) {
        pdf.setPage(page);
        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
        pdf.setFont('Arial', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`S-Mart Pro - Báo cáo quản trị - Trang ${page}/${pageCount}`, margin, pageHeight - 8);
        pdf.text(reportFileDate, pageWidth - margin, pageHeight - 8, { align: 'right' });
      }

      pdf.save(`S-Mart-Bao-cao-quan-tri-${dateRange}-${reportFileDate}.pdf`);
      toast.update(toastId, { render: 'Xuất báo cáo thành công', type: 'success', isLoading: false, autoClose: 3000 });
      return;
    } catch (err) {
      console.error('Export PDF error:', err);
      toast.update(toastId, { render: `Lỗi khi xuất báo cáo: ${err.message}`, type: 'error', isLoading: false, autoClose: 5000 });
      return;
    }

  };

  // Fetch Data
  const fetchStats = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);
    try {
      const data = await adminService.getStats(new Date().getFullYear(), dateRange);
      setStats(data);
      // Keep track of recent orders for highlight animation
      prevOrdersRef.current = data.recentOrders || [];
    } catch (err) {
      console.error('Lỗi lấy thống kê', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial Fetch & Filter Change
  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, dateRange]);

  // WebSocket for Realtime updates
  useEffect(() => {
    adminService.getNotifications()
      .then(data => setNotifications(Array.isArray(data) ? data.map(n => n.content) : []))
      .catch(() => {});

    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:8080');
    socketRef.current = socket;

    socket.on('connect', () => setWsStatus('connected'));
    
    // Listen for any notifications to trigger dashboard refresh
    socket.on('receiveNotification', (msg) => {
      setNotifications(prev => [msg.content || msg, ...prev].slice(0, 50));
      // Soft refresh stats in background
      adminService.getStats(new Date().getFullYear(), dateRange).then(data => {
        setStats(prev => {
          prevOrdersRef.current = prev.recentOrders;
          return data;
        });
      }).catch(console.error);
    });

    socket.on('disconnect', () => setWsStatus('disconnected'));

    return () => { socket.disconnect(); };
  }, [dateRange]);

  // UI Variants
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } };

  return (
    <MotionDiv initial="hidden" animate="visible" variants={containerVariants} className="space-y-6 pb-12">
      
      {/* ----------------- HEADER & FILTERS ----------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Tổng Quan Hệ Thống 
            <span className="flex h-3 w-3 relative ml-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${wsStatus === 'connected' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${wsStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Dữ liệu được tự động cập nhật theo thời gian thực.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
            disabled={loading}
          >
            <FileText className="w-4 h-4" />
            Xuất PDF
          </button>
          <button 
            onClick={() => fetchStats(true)} 
            className={`p-2.5 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`}
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)} 
              className="pl-10 pr-8 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none shadow-inner"
            >
              <option value="today">Hôm nay</option>
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày qua</option>
              <option value="year">Năm nay</option>
            </select>
          </div>
        </div>
      </div>

      {/* ----------------- KPI CARDS ----------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <MotionDiv variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors">
            <DollarIcon className="w-32 h-32 rotate-12" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Doanh thu ({dateRange === 'today' ? 'Hôm nay' : 'Kỳ này'})</p>
          <h3 className="text-3xl font-black text-slate-800 font-display">
            {loading ? <span className="inline-block w-32 h-9 bg-slate-100 animate-pulse rounded-lg"></span> : <Counter to={stats.totalRevenue || 0} isCurrency={true} />}
          </h3>
          <div className="mt-4 flex items-center text-xs font-bold">
            <span className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Realtime
            </span>
          </div>
        </MotionDiv>

        {/* KPI 2 */}
        <MotionDiv variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-blue-500/5 group-hover:text-blue-500/10 transition-colors">
            <FileText className="w-32 h-32 rotate-12" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Đơn hàng ({dateRange === 'today' ? 'Hôm nay' : 'Kỳ này'})</p>
          <h3 className="text-3xl font-black text-slate-800 font-display">
            {loading ? <span className="inline-block w-16 h-9 bg-slate-100 animate-pulse rounded-lg"></span> : <Counter to={stats.totalOrders || 0} />}
          </h3>
          <div className="mt-4 flex items-center text-xs font-bold gap-3">
             <span className="text-amber-500 bg-amber-50 px-2 py-1 rounded-md flex items-center gap-1">
              <Clock className="w-3 h-3" /> {stats.pendingOrders || 0} Chờ xử lý
            </span>
          </div>
        </MotionDiv>

        {/* KPI 3 */}
        <MotionDiv variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-purple-500/5 group-hover:text-purple-500/10 transition-colors">
            <Users className="w-32 h-32 rotate-12" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Tổng Khách hàng</p>
          <h3 className="text-3xl font-black text-slate-800 font-display">
            {loading ? <span className="inline-block w-16 h-9 bg-slate-100 animate-pulse rounded-lg"></span> : <Counter to={stats.totalUsers || 0} />}
          </h3>
          <div className="mt-4 flex items-center text-xs font-bold">
            <span className="text-purple-500 bg-purple-50 px-2 py-1 rounded-md flex items-center gap-1">
              <Users className="w-3 h-3" /> +{stats.newCustomers7d || 0} trong 7 ngày
            </span>
          </div>
        </MotionDiv>

        {/* KPI 4 */}
        <MotionDiv variants={itemVariants} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-orange-500/5 group-hover:text-orange-500/10 transition-colors">
            <ShoppingBag className="w-32 h-32 rotate-12" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Sản phẩm Hệ thống</p>
          <h3 className="text-3xl font-black text-slate-800 font-display">
            {loading ? <span className="inline-block w-16 h-9 bg-slate-100 animate-pulse rounded-lg"></span> : <Counter to={stats.totalProducts || 0} />}
          </h3>
          <div className="mt-4 flex items-center text-xs font-bold">
            {stats.lowStockProducts?.length > 0 ? (
               <span className="text-rose-500 bg-rose-50 px-2 py-1 rounded-md flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {stats.lowStockProducts.length} SP sắp hết
              </span>
            ) : (
              <span className="text-slate-500 bg-slate-50 px-2 py-1 rounded-md flex items-center gap-1">Kho ổn định</span>
            )}
          </div>
        </MotionDiv>
      </div>

      {/* ----------------- CHARTS ROW 1 ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REVENUE AREA CHART */}
        <MotionDiv variants={itemVariants} className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Doanh Thu Trong Năm
            </h2>
          </div>
          <div className="h-72 w-full">
            {loading ? (
               <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl"></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueByMonth || []}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} tickFormatter={(value) => new Intl.NumberFormat('vi-VN', {notation: "compact"}).format(value)} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value), 'Doanh thu']} />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </MotionDiv>

        {/* DONUT CHART ORDER STATUS */}
        <MotionDiv variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
             <PieChart className="w-5 h-5 text-purple-500" /> Tỉ Lệ Đơn Hàng
          </h2>
          <div className="h-48 w-full relative mb-4">
            {loading ? (
               <div className="w-full h-full bg-slate-50 animate-pulse rounded-full border-8 border-white"></div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={normalizedOrderStatusStats} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name" animationDuration={1000}>
                      {normalizedOrderStatusStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={ORDER_STATUS_META[entry.name]?.color || '#94a3b8'} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(value, name) => [value, ORDER_STATUS_META[name]?.label || name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800 font-display"><Counter to={stats.totalOrders || 0} /></span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tổng Đơn</span>
                </div>
              </>
            )}
          </div>
          <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
            {!loading && normalizedOrderStatusStats.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ORDER_STATUS_META[item.name]?.color }}></div>
                  <span className="text-slate-600 font-semibold">{ORDER_STATUS_META[item.name]?.label}</span>
                </div>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </MotionDiv>
      </div>

      {/* ----------------- CHARTS ROW 2 ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TOP PRODUCTS BAR CHART */}
        <MotionDiv variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" /> Sản Phẩm Bán Chạy (Theo Kỳ)
            </h2>
            <div className="h-64 w-full">
              {loading ? (
                <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl"></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topProducts || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{fill: '#475569', fontSize: 12, fontWeight: 600}} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="totalSold" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} animationDuration={1000} name="Đã bán" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
        </MotionDiv>

        {/* LOW STOCK ALERT */}
        <MotionDiv variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" /> Cảnh Báo Tồn Kho
            </h2>
            <span className="text-xs font-bold bg-rose-50 text-rose-600 px-2 py-1 rounded-lg">
              {stats.lowStockProducts?.length || 0} sản phẩm
            </span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
             {loading ? (
               [...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse"></div>)
             ) : stats.lowStockProducts?.length === 0 ? (
               <div className="h-full flex flex-col justify-center items-center text-slate-400 py-10">
                 <CheckCircle className="w-10 h-10 mb-2 opacity-20 text-emerald-500" />
                 <p className="font-medium">Kho hàng đang ổn định</p>
               </div>
             ) : (
               stats.lowStockProducts?.map(p => (
                 <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                   <img src={p.imageUrl || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-200" />
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
                     <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                       <div className={`h-full rounded-full ${p.stock <= 5 ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, (p.stock / 20) * 100)}%` }}></div>
                     </div>
                   </div>
                   <div className="text-right shrink-0">
                     <span className={`text-sm font-black ${p.stock <= 5 ? 'text-rose-600' : 'text-amber-600'}`}>{p.stock}</span>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">Còn lại</p>
                   </div>
                 </div>
               ))
             )}
          </div>
        </MotionDiv>
      </div>

      {/* ----------------- DATA TABLE & NOTIFS ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT ORDERS TABLE */}
        <MotionDiv variants={itemVariants} className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" /> Đơn Hàng Gần Đây
            </h2>
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Xem tất cả</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Mã Đơn</th>
                  <th className="p-4 font-bold">Khách Hàng</th>
                  <th className="p-4 font-bold text-right">Tổng Tiền</th>
                  <th className="p-4 font-bold text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}><td colSpan="4" className="p-4"><div className="h-6 bg-slate-50 animate-pulse rounded"></div></td></tr>
                  ))
                ) : stats.recentOrders?.map(order => {
                  const isNew = prevOrdersRef.current.findIndex(o => o.id === order.id) === -1;
                  const st = ORDER_STATUS_META[order.status] || { label: order.status, color: '#94a3b8' };
                  return (
                    <MotionTr 
                      key={order.id} 
                      initial={isNew ? { backgroundColor: '#eef2ff' } : { backgroundColor: '#ffffff' }}
                      animate={{ backgroundColor: '#ffffff' }}
                      transition={{ duration: 2 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-bold text-slate-700">#{order.id}</span>
                        {isNew && <span className="ml-2 inline-flex w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-bold text-slate-800 truncate max-w-[150px]">{order.email}</p>
                        <p className="text-xs text-slate-500">{order.itemCount} sản phẩm • {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</p>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-black text-slate-800">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{order.paymentMethod}</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: `${st.color}15`, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                    </MotionTr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </MotionDiv>

        {/* LIVE NOTIFICATIONS */}
        <MotionDiv variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full max-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" /> Hoạt Động (Live)
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            <AnimatePresence>
              {notifications.length === 0 && !loading ? (
                <div className="h-full flex flex-col justify-center items-center text-slate-400 py-10">
                  <Bell className="w-10 h-10 mb-2 opacity-20" />
                  <p className="font-medium text-sm">Chưa có thông báo mới</p>
                </div>
              ) : (
                notifications.map((notif, i) => (
                  <MotionDiv 
                    key={i} 
                    initial={{ opacity: 0, x: -20, height: 0 }} 
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    className="flex gap-3 relative group"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 z-10 border-2 border-white">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    </div>
                    <div className="flex-1 pb-4 border-l-2 border-slate-100 -ml-[1.15rem] pl-6">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <p className="text-sm font-semibold text-slate-700 leading-snug">{notif}</p>
                        <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 block">Vừa xong</span>
                      </div>
                    </div>
                  </MotionDiv>
                ))
              )}
            </AnimatePresence>
          </div>
        </MotionDiv>
      </div>
    </MotionDiv>
  );
};

export default AdminDashboard;

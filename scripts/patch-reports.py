from pathlib import Path

path = Path('/home/ubuntu/enterprise-erp/client/src/pages/Home.tsx')
s = path.read_text()
needle = 'const [reportGroup, setReportGroup] = useState<"financial" | "generalLedger" | "payables" | "receivables" | "fixedAssets" | "cashManagement" | "sales" | "purchases" | "inventory" | "customers" | "suppliers" | "hr" | "pos" | "tax" | "management">("financial");'
replacement = needle + '\n  const [selectedOperationalReport, setSelectedOperationalReport] = useState("");\n  const [trialBalanceType, setTrialBalanceType] = useState<"all" | "customer" | "supplier" | "account">("all");'
if needle not in s:
    raise SystemExit('state needle not found')
s = s.replace(needle, replacement, 1)
old = 'onClick={() => { if (unavailable) { toast.info("هذا التقرير مُدرج في الكتالوج ويحتاج مصدر بيانات مستقل قبل تشغيله"); return; } if (label === "أعمار الديون" || label.includes("أعمار ديون")) setReportType("statement"); else if (label.includes("مبيعات") || label.includes("مشتريات")) setReportType("transactions"); else setReportType("financial"); toast.info(`تم فتح ${label}`); }}'
new = 'onClick={() => { if (unavailable) { toast.info("هذا التقرير مُدرج في الكتالوج ويحتاج مصدر بيانات مستقل قبل تشغيله"); return; } setSelectedOperationalReport(label); if (label === "ميزان المراجعة") setTrialBalanceType("all"); if (label.includes("أعمار") || label.includes("كشف العملاء") || label.includes("كشف الموردين")) setReportType("statement"); else if (label.includes("مبيعات") || label.includes("مشتريات") || label.includes("حركة")) setReportType("transactions"); else setReportType("financial"); }}'
if old not in s:
    raise SystemExit('center handler not found')
s = s.replace(old, new, 1)
old2 = '<Button variant="outline" size="sm" onClick={() => { setReportType("transactions"); toast.info(`تم فتح تفاصيل ${r}`); }}>فتح التفاصيل</Button>'
new2 = '<Button variant="outline" size="sm" onClick={() => { setSelectedOperationalReport(r); if (r === "ميزان المراجعة") setTrialBalanceType("all"); setReportType(r === "أعمار الديون" ? "statement" : r.includes("الأستاذ") ? "transactions" : "financial"); }}>فتح التفاصيل</Button>'
if old2 not in s:
    raise SystemExit('financial card handler not found')
s = s.replace(old2, new2, 1)
marker = '    {reportType === "financial" ? <div className="report-grid">'
panel = '''    {selectedOperationalReport && <Card className="mb-5 border-primary/30 shadow-sm"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>{selectedOperationalReport}</CardTitle><p className="text-sm text-muted-foreground">حدد الفترة ثم اعرض البيانات أو صدّرها. عند عدم وجود بيانات سيظهر تنبيه واضح.</p></div><Button variant="ghost" size="sm" onClick={() => setSelectedOperationalReport("")}>إغلاق</Button></div></CardHeader><CardContent><div className="form-grid mb-4"><Input type="date" value={from} onChange={e => setFrom(e.target.value)} /><Input type="date" value={to} onChange={e => setTo(e.target.value)} />{selectedOperationalReport === "ميزان المراجعة" && <select value={trialBalanceType} onChange={e => setTrialBalanceType(e.target.value as typeof trialBalanceType)}><option value="all">ميزان مراجعة الحسابات</option><option value="customer">ميزان مراجعة العملاء</option><option value="supplier">ميزان مراجعة الموردين</option><option value="account">ميزان مراجعة الحسابات العامة</option></select>}</div><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => { setReportType(selectedOperationalReport === "ميزان المراجعة" || selectedOperationalReport === "الميزانية العمومية" || selectedOperationalReport === "قائمة الدخل" ? "financial" : selectedOperationalReport.includes("كشف") || selectedOperationalReport.includes("أعمار") ? "statement" : "transactions"); toast.success(`تم تحميل ${selectedOperationalReport} للفترة المحددة`); }}>عرض التقرير</Button><Button size="sm" variant="outline" onClick={() => exportToExcel(selectedOperationalReport, exportRows.length ? exportRows : [{ التقرير: selectedOperationalReport, الفترة: `${from} إلى ${to}`, الحالة: "لا توجد بيانات للعرض" }])}>تصدير Excel</Button><Button size="sm" variant="outline" onClick={() => { const rows = exportRows.length ? exportRows : [{ التقرير: selectedOperationalReport, الفترة: `${from} إلى ${to}`, الحالة: "لا توجد بيانات للعرض" }]; if (!exportToPdf(selectedOperationalReport, rows)) toast.error("يرجى السماح بالنوافذ المنبثقة لتصدير PDF"); }}>تصدير PDF</Button></div><div className="mt-4 rounded-xl bg-muted/50 p-4 text-sm">{exportRows.length ? `تم العثور على ${exportRows.length} صف للعرض.` : "لا توجد بيانات للعرض للفترة المحددة."}</div></CardContent></Card>}\n'''
if marker not in s:
    raise SystemExit('panel marker not found')
s = s.replace(marker, panel + marker, 1)
path.write_text(s)

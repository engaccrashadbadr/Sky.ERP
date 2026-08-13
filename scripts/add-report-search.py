from pathlib import Path

path = Path('/home/ubuntu/enterprise-erp/client/src/pages/Home.tsx')
text = path.read_text()
old_state = '  const [selectedOperationalReport, setSelectedOperationalReport] = useState("");\n  const [trialBalanceType, setTrialBalanceType] = useState<"all" | "customer" | "supplier" | "account">("all");'
new_state = '  const [selectedOperationalReport, setSelectedOperationalReport] = useState("");\n  const [reportSearch, setReportSearch] = useState("");\n  const [trialBalanceType, setTrialBalanceType] = useState<"all" | "customer" | "supplier" | "account">("all");'
if old_state not in text:
    raise SystemExit('state anchor not found')
text = text.replace(old_state, new_state, 1)
old_toolbar = '<CardTitle>مركز التقارير</CardTitle><p className="text-sm text-muted-foreground">اختر القسم لعرض التقارير المناسبة للمحاسب والإدارة، ثم صدّر النتائج مباشرة.</p></CardHeader><CardContent><div className="flex flex-wrap gap-2">'
new_toolbar = '<CardTitle>مركز التقارير</CardTitle><p className="text-sm text-muted-foreground">اختر القسم لعرض التقارير المناسبة للمحاسب والإدارة، ثم صدّر النتائج مباشرة.</p></CardHeader><CardContent><div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"><Input aria-label="البحث في مركز التقارير" placeholder="ابحث عن تقرير أو عملية..." value={reportSearch} onChange={e => setReportSearch(e.target.value)} /><span className="self-center text-xs text-muted-foreground">تظهر التقارير المطابقة داخل القسم المحدد</span></div><div className="flex flex-wrap gap-2">'
if old_toolbar not in text:
    raise SystemExit('toolbar anchor not found')
text = text.replace(old_toolbar, new_toolbar, 1)
old_map = ']).map((label, index) => { const definition = oracleCatalog.data?.find(report => report.title === label'
new_map = ']).filter(label => !reportSearch || label.toLowerCase().includes(reportSearch.toLowerCase())).map((label, index) => { const definition = oracleCatalog.data?.find(report => report.title === label'
if old_map not in text:
    raise SystemExit('report map anchor not found')
text = text.replace(old_map, new_map, 1)
path.write_text(text)
print('patched report search')

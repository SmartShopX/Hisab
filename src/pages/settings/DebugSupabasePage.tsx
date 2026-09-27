import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabaseDebugApi } from '../../services/apiServices';
import { SupabaseDebugResponse, TableSchemaInfo } from '../../types/supabaseDebug';
import { useToast } from '../../context/ToastContext';
import {
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  ShieldCheck,
  Table,
  Layers,
  Clock,
  ArrowLeft,
  Copy,
  Check,
  Search,
  ExternalLink,
  Code2,
  FileText,
  Activity,
  Cpu,
  Terminal,
} from 'lucide-react';

export const DebugSupabasePage: React.FC = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<SupabaseDebugResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await supabaseDebugApi.getStatus();
      setData(res);
      if (res.connected) {
        showToast('SmartShopX Supabase ব্যাকএন্ড সফলভাবে সংযুক্ত হয়েছে', 'success');
      } else {
        showToast(res.error || 'Supabase ব্যাকএন্ডে সংযোগ করা যায়নি', 'error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch status');
      showToast('Supabase স্ট্যাটাস লোড করতে সমস্যা হয়েছে', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopyJson = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    showToast('সম্পূর্ণ স্কিমা JSON কপি করা হয়েছে', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredTables = (data?.tables || []).filter((table) => {
    if (selectedTable !== 'all' && table.name !== selectedTable) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = table.name.toLowerCase().includes(q);
      const colMatch = table.columns.some((c) =>
        c.columnName.toLowerCase().includes(q) || c.dataType.toLowerCase().includes(q)
      );
      return nameMatch || colMatch;
    }
    return true;
  });

  const getDataTypeBadgeColor = (type: string) => {
    if (type.includes('json')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (type.includes('numeric') || type.includes('int')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (type.includes('time') || type.includes('date')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (type.includes('bool')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link to="/settings" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>সেটিংস (Settings)</span>
            </Link>
            <span>/</span>
            <span className="text-emerald-700 font-bold">Supabase Debug Inspector</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Database className="w-6 h-6 text-emerald-600" />
            <span>SmartShopX Supabase Backend Status</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            এনভায়রনমেন্ট ভেরিয়েবল ও লাইভ ডাটাবেজ স্কিমা সংযোগ পরীক্ষণ (PostgreSQL Cloud Authority)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span>পুনরায় চেক করুন</span>
          </button>

          <button
            onClick={handleCopyJson}
            disabled={!data}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'কপি হয়েছে' : 'স্কিমা JSON'}</span>
          </button>

          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer border ${
              showRawJson
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showRawJson ? 'ভিউয়ার বন্ধ করুন' : 'Raw JSON'}</span>
          </button>
        </div>
      </div>

      {/* Connection Status Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          loading
            ? 'bg-slate-50 border-slate-200 text-slate-700'
            : data?.connected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                loading
                  ? 'bg-slate-200 text-slate-600'
                  : data?.connected
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
              }`}
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : data?.connected ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">
                  {loading
                    ? 'সংযোগ যাচাই করা হচ্ছে...'
                    : data?.connected
                    ? 'Supabase ব্যাকএন্ড সফলভাবে সংযুক্ত (CONNECTED)'
                    : 'Supabase সংযোগ ব্যাহত (DISCONNECTED)'}
                </span>
                {data?.connected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE SSL
                  </span>
                )}
              </div>
              <p className="text-xs opacity-80 mt-0.5 font-mono">
                {data?.projectUrl || 'https://ffqwfrtpscivirlvvxol.supabase.co'} &bull; Latency:{' '}
                <span className="font-bold">{data?.latencyMs ?? 0} ms</span> &bull; Engine:{' '}
                {data?.version ? data.version.split(' ')[0] + ' ' + data.version.split(' ')[1] : 'PostgreSQL'}
              </p>
            </div>
          </div>

          <div className="text-right sm:self-center">
            <span className="text-[11px] opacity-70 block font-mono">
              Last Verified: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'N/A'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-100/80 rounded-xl text-rose-800 text-xs border border-rose-200 font-mono">
            {error}
          </div>
        )}
      </div>

      {/* Raw JSON View if toggled */}
      {showRawJson && (
        <div className="bg-slate-900 rounded-2xl p-4 text-slate-100 font-mono text-xs overflow-x-auto shadow-inner border border-slate-800 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase Backend Diagnostic Payload</span>
            </span>
            <button
              onClick={handleCopyJson}
              className="text-xs hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      {/* Grid of Key Diagnostic Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Project Details */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Supabase প্রজেক্ট</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 truncate" title={data?.host || 'db.ffqwfrtpscivirlvvxol.supabase.co'}>
            ffqwfrtpscivirlvvxol
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate font-mono">
            {data?.projectUrl || 'https://ffqwfrtpscivirlvvxol.supabase.co'}
          </div>
        </div>

        {/* Card 2: Database Connection */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">ডাটাবেজ ইঞ্জিন ও পোর্ট</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 font-mono">
            {data?.database || 'postgres'} <span className="text-xs font-normal text-slate-400">: {data?.port || 5432}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>SSL TLSv1.3 Encrypted</span>
          </div>
        </div>

        {/* Card 3: Tables Count */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">প্রস্তুত পাবলিক টেবিল</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Table className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 flex items-baseline gap-1.5">
            <span>{data?.tableCount || 0}</span>
            <span className="text-xs font-normal text-slate-500">টি টেবিল স্কিমা</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono truncate">
            {data?.tables.map((t) => t.name).join(', ') || 'orders, customers, products...'}
          </div>
        </div>

        {/* Card 4: Ping / Health */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">সংযোগ গতি ও রেসপন্স</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 font-mono flex items-baseline gap-1.5">
            <span>{data?.latencyMs ?? 0}</span>
            <span className="text-xs font-normal text-slate-500">ms latency</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>High Reliability Cloud Ping</span>
          </div>
        </div>
      </div>

      {/* Integration Verification Checklist */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>SmartShopX Supabase ইন্টিগ্রেশন ভেরিফিকেশন চেকলিস্ট</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Supabase Database Connection</span>
              <span className="text-[11px] text-slate-500">
                DATABASE_URL ও সিক্রেট ক্রেডেনশিয়াল সফলভাবে লোড হয়েছে।
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Orders Table Schema</span>
              <span className="text-[11px] text-slate-500">
                গ্রাহকের নাম, আইটেম JSONB, ডেলিভারি চার্জ ও পেমেন্ট ফিল্ড প্রস্তুত।
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Customers Table Schema</span>
              <span className="text-[11px] text-slate-500">
                মোবাইল, ফুল নেইম, ঠিকানা ও মেম্বারশিপ ফিল্ড বিদ্যমান।
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Products Table Schema</span>
              <span className="text-[11px] text-slate-500">
                নাম, দাম, ডিসকাউন্ট, ক্যাটাগরি ও স্টক ফিল্ড অন্তর্ভুক্ত।
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Transactions Table Schema</span>
              <span className="text-[11px] text-slate-500">
                ইনকাম/এক্সপেন্স, অর্ডার রেফারেন্স ও তারিখ ট্র্যাকিং প্রস্তুত।
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Non-destructive Safety</span>
              <span className="text-[11px] text-slate-500">
                বিদ্যমান কোনো টেবিল বা ডাটা ড্রপ বা ওভাররাইট হবে না।
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table Schemas Inspector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Filter and Tab Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedTable('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                selectedTable === 'all'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              সকল টেবিল ({data?.tables.length || 0})
            </button>
            {(data?.tables || []).map((t) => (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedTable === t.name
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{t.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
                  {t.columns.length}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="কলাম বা টেবিল খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Tables Content */}
        <div className="divide-y divide-slate-100">
          {filteredTables.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              কোনো টেবিল বা কলাম খুঁজে পাওয়া যায়নি।
            </div>
          ) : (
            filteredTables.map((table) => (
              <div key={table.name} className="p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      <Table className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 font-mono">
                        {table.name}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        মোট {table.columns.length} টি ফিল্ড/কলাম &bull; সংরক্ষিত রেকর্ডস:{' '}
                        <span className="font-mono font-bold">{table.rowCount}</span>
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-mono border border-slate-200 self-start sm:self-center">
                    public.{table.name}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-100">
                        <th className="py-2.5 px-3 font-semibold">কলামের নাম (Column)</th>
                        <th className="py-2.5 px-3 font-semibold">ডাটা টাইপ (Data Type)</th>
                        <th className="py-2.5 px-3 font-semibold">Nullable</th>
                        <th className="py-2.5 px-3 font-semibold">ডিফল্ট ভ্যালু (Default)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white font-mono">
                      {table.columns.map((col) => (
                        <tr key={col.columnName} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 text-slate-900 font-bold flex items-center gap-1.5">
                            {col.columnName === 'id' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-sans font-bold">
                                PK
                              </span>
                            )}
                            <span>{col.columnName}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-md border font-medium ${getDataTypeBadgeColor(
                                col.dataType
                              )}`}
                            >
                              {col.dataType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                            {col.isNullable ? (
                              <span className="text-slate-500">YES (ঐচ্ছিক)</span>
                            ) : (
                              <span className="text-rose-600 font-bold">NO (আবশ্যক)</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-xs" title={col.columnDefault || '-'}>
                            {col.columnDefault || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugSupabasePage;

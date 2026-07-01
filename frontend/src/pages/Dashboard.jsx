import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Upload, History as HistoryIcon, TrendingUp, Activity } from "lucide-react";
import PageShell from "../components/PageShell";
import { DistributionPie } from "../components/DistributionChart";
import TrendsChart from "../components/TrendsChart";
import CountUp from "../components/CountUp";
import WhyManualCard from "../components/WhyManualCard";
import DashboardHero from "../components/DashboardHero";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [hist, tr] = await Promise.all([
          client.get("/history"),
          client.get("/trends"),
        ]);
        setItems(hist.data.items || []);
        setTrends(tr.data.points || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { distribution, totalAnalyzed, totalSessions } = useMemo(() => {
    const dist = { positive: 0, negative: 0, neutral: 0 };
    let analyzed = 0;
    items.forEach((it) => {
      if (it.kind === "bulk" && it.distribution) {
        Object.entries(it.distribution).forEach(([k, v]) => {
          dist[k] = (dist[k] || 0) + v;
          analyzed += v;
        });
      } else if (it.label) {
        dist[it.label] = (dist[it.label] || 0) + 1;
        analyzed += 1;
      }
    });
    return { distribution: dist, totalAnalyzed: analyzed, totalSessions: items.length };
  }, [items]);

  const hasData = totalAnalyzed > 0;

  return (
    <PageShell>
      <DashboardHero userName={user?.name} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-3"
      >
        <motion.div variants={item}>
          <StatCard icon={Activity} label="Texts analyzed" value={loading ? "—" : totalAnalyzed} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard icon={HistoryIcon} label="Sessions" value={loading ? "—" : totalSessions} />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            icon={TrendingUp}
            label="Positive rate"
            value={hasData ? Math.round((distribution.positive / totalAnalyzed) * 100) : "—"}
            suffix={hasData ? "%" : ""}
          />
        </motion.div>
      </motion.div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="mb-4 font-semibold text-slate-700">Quick actions</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <ActionTile to="/analyze" icon={Brain} title="Single Analysis" desc="Analyze one text" />
            <ActionTile to="/bulk" icon={Upload} title="Bulk Upload" desc="Process a file" />
            <ActionTile to="/history" icon={HistoryIcon} title="History" desc="View past results" />
          </div>
        </div>
        <div className="card">
          <h3 className="mb-2 font-semibold text-slate-700">Overall sentiment</h3>
          {hasData ? (
            <DistributionPie distribution={distribution} />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center text-slate-400">
              <p className="text-4xl">🪄</p>
              <p className="mt-2 text-sm">Run analyses to populate this chart</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 card">
        <h3 className="mb-2 font-semibold text-slate-700">Sentiment trends over time</h3>
        <TrendsChart points={trends} />
      </div>

      <WhyManualCard />
    </PageShell>
  );
}

function StatCard({ icon: Icon, label, value, suffix = "" }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="card flex items-center gap-4">
      <motion.div
        whileHover={{ rotate: 8, scale: 1.1 }}
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F06E4B]/15 text-primary"
      >
        <Icon size={22} />
      </motion.div>
      <div>
        <p className="text-2xl font-extrabold text-slate-800">
          <CountUp value={value} suffix={suffix} />
        </p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </motion.div>
  );
}

function ActionTile({ to, icon: Icon, title, desc }) {
  return (
    <Link to={to}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex h-full flex-col gap-2 rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 transition-all hover:shadow-md dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/40 dark:hover:border-brand-500/50 dark:hover:shadow-lg dark:hover:shadow-brand-500/10"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F06E4B] text-white">
          <Icon size={18} />
        </div>
        <p className="font-semibold text-slate-700">{title}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </motion.div>
    </Link>
  );
}

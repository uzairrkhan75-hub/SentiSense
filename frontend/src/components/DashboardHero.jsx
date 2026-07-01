import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Gift, Upload, Smile } from "lucide-react";

const FEATURES = [
  { icon: Gift, label: "100% Free to try" },
  { icon: Upload, label: "Upload files or paste text" },
  { icon: Smile, label: "Positive, negative & neutral detection" },
];

export default function DashboardHero({ userName }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-6 py-12 text-center shadow-2xl sm:px-10 sm:py-14"
    >
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#F06E4B]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-[#F06E4B]/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-5xl">
        {userName && (
          <p className="mb-4 text-sm font-medium text-slate-400">
            Welcome back, <span className="text-primary-light">{userName}</span>
          </p>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="pill-animated-border mx-auto inline-flex"
        >
          <span className="pill-animated-border-inner inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-primary-light backdrop-blur">
            <Sparkles size={14} className="text-primary" />
            AI-Powered Sentiment Analysis
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl"
        >
          Sentiment Analysis Tool
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg"
        >
          Analyze the sentiment of your files or text — detect positive, negative,
          and neutral tones instantly with AI.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8 flex flex-nowrap items-center justify-center gap-x-4 overflow-x-auto pb-1 sm:gap-x-6 lg:gap-x-8"
        >
          {FEATURES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap text-xs text-slate-300 sm:text-sm md:text-base"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F06E4B] text-white shadow-md shadow-[#F06E4B]/30">
                <Icon size={15} />
              </span>
              {label}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/analyze" className="btn-primary">
            Analyze text
          </Link>
          <Link
            to="/bulk"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white backdrop-blur transition-all hover:border-[#F06E4B]/50 hover:bg-white/10"
          >
            Bulk upload
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="aurora absolute inset-0" />
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-10 top-20 h-40 w-40 rounded-full bg-brand-300/30 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 24, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-16 right-12 h-52 w-52 rounded-full bg-brand-300/30 blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="glass relative z-10 w-full max-w-md rounded-3xl p-8"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F06E4B] text-white shadow-lg shadow-[#F06E4B]/40">
            <BarChart3 size={26} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

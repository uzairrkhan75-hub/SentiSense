import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  History as HistoryIcon,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

function initialsOf(name = "", email = "") {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/login");
  };

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const initials = initialsOf(user?.name, user?.email);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 py-1 pl-1 pr-2 transition-colors hover:border-brand-300 dark:border-slate-700 dark:bg-slate-800/60"
        title="Account"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F06E4B] text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden max-w-[7rem] truncate text-sm font-semibold text-slate-700 sm:block">
          {user?.name || "Account"}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-slate-400" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-center gap-3 bg-[#F06E4B] p-4 text-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold backdrop-blur">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold leading-tight">{user?.name || "User"}</p>
                <p className="truncate text-xs text-white/80">{user?.email}</p>
              </div>
            </div>

            <div className="p-1.5">
              <MenuItem icon={LayoutDashboard} label="Dashboard" onClick={() => go("/")} />
              <MenuItem icon={HistoryIcon} label="Analysis history" onClick={() => go("/history")} />
              <button
                onClick={toggle}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60"
              >
                <span className="flex items-center gap-3">
                  {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </span>
                <span className="text-xs text-slate-400">{theme}</span>
              </button>
            </div>

            <div className="border-t border-slate-100 p-1.5 dark:border-slate-700">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <LogOut size={17} />
                Log out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60"
    >
      <Icon size={17} />
      {label}
    </button>
  );
}

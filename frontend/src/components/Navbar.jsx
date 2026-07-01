import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  Home,
  History,
  Upload,
  Brain,
  Hash,
  GitCompare,
  Gauge,
} from "lucide-react";
import ProfileMenu from "./ProfileMenu";

const links = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/analyze", label: "Analyze", icon: Brain },
  { to: "/compare", label: "Compare", icon: GitCompare },
  { to: "/bulk", label: "Bulk", icon: Upload },
  { to: "/social", label: "Social", icon: Hash },
  { to: "/models", label: "Models", icon: Gauge },
  { to: "/history", label: "History", icon: History },
];

export default function Navbar() {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F06E4B] text-white shadow-lg shadow-[#F06E4B]/30">
            <BarChart3 size={20} />
          </div>
          <span className="text-lg font-extrabold tracking-tight">
            Senti<span className="text-primary">Sense</span>
          </span>
        </NavLink>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-slate-500 hover:text-primary"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} />
                  {label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-[#F06E4B]"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <ProfileMenu />
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center justify-around border-t border-slate-100 px-2 py-1 md:hidden">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[11px] font-medium ${
                isActive ? "text-primary" : "text-slate-500"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </motion.header>
  );
}

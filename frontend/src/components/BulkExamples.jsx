import { motion } from "framer-motion";
import {
  ShoppingCart,
  Cloud,
  UtensilsCrossed,
  MapPin,
  Video,
} from "lucide-react";

const EXAMPLES = [
  {
    icon: ShoppingCart,
    category: "E-commerce companies",
    desc: "analyze product reviews to identify which features customers love and which ones consistently frustrate people.",
  },
  {
    icon: Cloud,
    category: "SaaS businesses",
    desc: "monitor user feedback across multiple channels to prioritize feature development and improve onboarding processes.",
  },
  {
    icon: UtensilsCrossed,
    category: "Restaurants",
    desc: "track online reviews and social media to understand customer experience trends and respond to service issues quickly.",
  },
  {
    icon: MapPin,
    category: "Local service businesses",
    desc: "analyze customer feedback to improve service quality and identify staff training opportunities.",
  },
  {
    icon: Video,
    category: "Content creators",
    desc: "assess audience reactions to understand what resonates and what falls flat with their community.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export default function BulkExamples() {
  return (
    <section className="relative mt-12">
      <div className="pointer-events-none absolute -left-32 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-0 h-72 w-72 rounded-full bg-brand-400/10 blur-3xl" />

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative mb-6 text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white"
      >
        Real Examples from Different Businesses
      </motion.h2>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="relative grid gap-5 md:grid-cols-2"
      >
        {EXAMPLES.map(({ icon: Icon, category, desc }) => (
          <motion.div
            key={category}
            variants={item}
            whileHover={{ y: -4 }}
            className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/10 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-brand-500/50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-brand-600 transition-transform group-hover:scale-110 dark:border-slate-600 dark:bg-slate-900/60 dark:text-brand-400">
              <Icon size={20} />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{category}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {desc}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

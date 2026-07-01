import { motion } from "framer-motion";

const POINTS = [
  {
    lead: "It takes forever.",
    body: "Reading through customer reviews, support tickets, and social media comments manually eats up entire days, especially when you're trying to spot trends or compare time periods.",
  },
  {
    lead: "Everyone interprets differently.",
    body: "Ask three people to rate the same review as positive, negative, or neutral, and you'll often get three different answers. Personal bias creeps in, and what feels negative to one person might seem neutral to another.",
  },
  {
    lead: "You miss the subtle stuff.",
    body: "Sarcasm, cultural references, and context-dependent meaning are hard to catch when you're speed-reading through feedback. But those nuances often contain the most important insights.",
  },
  {
    lead: "Volume kills accuracy.",
    body: "The more text you have to analyze, the more your judgment gets cloudy. By the time you've read 200 reviews, you're not processing sentiment as carefully as you were for the first 20.",
  },
];

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function WhyManualCard() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="relative mt-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 text-slate-300 shadow-2xl sm:p-10"
    >
      {/* soft glow accents */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />

      <motion.h2
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="relative mb-7 text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
      >
        Why Manual Sentiment Analysis Doesn&apos;t Scale
      </motion.h2>

      <motion.ul
        variants={list}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="relative space-y-5"
      >
        {POINTS.map((p) => (
          <motion.li key={p.lead} variants={item} className="flex gap-3">
            <motion.span
              whileHover={{ scale: 1.6 }}
              className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.6)]"
            />
            <p className="leading-relaxed">
              <span className="font-bold text-white">{p.lead}</span> {p.body}
            </p>
          </motion.li>
        ))}
      </motion.ul>

      <motion.p
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="relative mt-7 border-t border-white/10 pt-5 text-sm italic leading-relaxed text-slate-400"
      >
        Studies show that businesses regularly misinterpret customer sentiment,
        leading to strategic decisions based on incomplete or biased understanding
        of customer feelings.
      </motion.p>
    </motion.section>
  );
}

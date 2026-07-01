import { useEffect, useState } from "react";
import { animate } from "framer-motion";

// Animated number that counts up to `value`. Non-numeric values render as-is.
export default function CountUp({ value, duration = 1.1, decimals = 0, suffix = "" }) {
  const numeric = typeof value === "number" ? value : Number(value);
  const isNumber = Number.isFinite(numeric);
  const [display, setDisplay] = useState(isNumber ? 0 : value);

  useEffect(() => {
    if (!isNumber) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, numeric, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, numeric, isNumber, duration]);

  if (!isNumber) return <>{display}</>;
  return (
    <>
      {Number(display).toFixed(decimals)}
      {suffix}
    </>
  );
}

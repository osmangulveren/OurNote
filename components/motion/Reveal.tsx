"use client";

import { motion, type HTMLMotionProps } from "motion/react";

const ease = [0.22, 1, 0.36, 1] as const;

/** Fades and lifts its children in when scrolled into view. */
export function Reveal({
  delay = 0, y = 24, className, children, ...rest
}: { delay?: number; y?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.9, ease, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Staggers direct children (each child should be a <RevealItem>). */
export function RevealGroup({ className, children, stagger = 0.07 }: { className?: string; children: React.ReactNode; stagger?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
        show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.85, ease } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Headline whose words rise out of a mask one after another. Wrap words in *stars* to italicise them. */
export function SplitHeading({
  text, className, as: Tag = "h1", delay = 0,
}: { text: string; className?: string; as?: "h1" | "h2" | "h3"; delay?: number }) {
  const lines = text.split("\n");
  let i = 0;
  return (
    <Tag className={className} aria-label={text.replace(/\*/g, "")}>
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden>
          {line.split(" ").map((word, wi) => {
            const italic = word.startsWith("*");
            const clean = word.replace(/\*/g, "");
            const idx = i++;
            return (
              <span key={wi} className="inline-block overflow-hidden pb-[0.12em] align-top">
                <motion.span
                  className={`inline-block ${italic ? "italic text-clay" : ""}`}
                  initial={{ y: "110%" }}
                  whileInView={{ y: "0%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease, delay: delay + idx * 0.06 }}
                >
                  {clean}
                </motion.span>
                {wi < line.split(" ").length - 1 && " "}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

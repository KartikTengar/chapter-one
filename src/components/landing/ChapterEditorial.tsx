"use client";

import { Container, Section } from "../layout";
import { motion } from "framer-motion";
import { ChapterEditorialStyles } from "./chapter-styles";

const chapters = [
  { number: "01", title: "MEET PEOPLE", description: "Turn a first hello into your favourite company." },
  { number: "02", title: "EXPLORE CAMPUS", description: "Find the corners that will become your places." },
  { number: "03", title: "CREATE MEMORIES", description: "Give tomorrow a story worth telling." },
];

export function ChapterEditorial() {
  return (
    <Section id="chapter" className="chapter-editorial" aria-labelledby="chapter-heading">
      <div className="chapter-editorial-background">
        <div className="chapter-editorial-background-content">
          <h2 aria-hidden="true">CHAPTER ONE</h2>
        </div>
      </div>
      <Container>
        <div className="chapter-editorial-content">
          <h2 id="chapter-heading" className="chapter-quote">
            This is your chapter<span className="chapter-period">.</span>
          </h2>
          <p className="chapter-note">
            Every fresher year is unwritten. We just make the pages louder.
          </p>
          <ol className="chapter-entries">
            {chapters.map(({ number, title, description }) => (
              <motion.li
                key={number}
                className="chapter-entry"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <span className="chapter-number" aria-hidden="true">{number}</span>
                <div>
                  <h3 className="chapter-title">{title}</h3>
                  <p className="chapter-description">{description}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </Container>
      {ChapterEditorialStyles}
    </Section>
  );
}
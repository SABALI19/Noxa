// Mount community word-of-the-day routes in the real backend.
// Public read routes:
//   GET /api/v1/community/words
//   GET /api/v1/community/words/featured
// Community submission route:
//   POST /api/v1/community/words

import express from "express";

const router = express.Router();

let communityWords = [
  {
    word: "Momentum",
    meaning: "The energy that builds when you keep moving toward a goal.",
    example: "Protect your momentum by finishing one meaningful task before noon.",
    updatedAt: new Date().toISOString(),
  },
];

const getFeaturedWord = () => {
  if (!communityWords.length) {
    return {
      word: "Momentum",
      meaning: "The energy that builds when you keep moving toward a goal.",
      example: "Protect your momentum by finishing one meaningful task before noon.",
      updatedAt: new Date().toISOString(),
    };
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const hash = Array.from(todayKey).reduce((total, character) => total + character.charCodeAt(0), 0);
  return communityWords[hash % communityWords.length];
};

router.get("/community/words", (_req, res) => {
  res.json({ data: communityWords });
});

router.get("/community/words/featured", (_req, res) => {
  res.json({ data: getFeaturedWord() });
});

router.post("/community/words", (req, res) => {
  const nextWord = {
    word: String(req.body?.word || "").trim(),
    meaning: String(req.body?.meaning || "").trim(),
    example: String(req.body?.example || "").trim(),
    updatedAt: new Date().toISOString(),
  };

  if (!nextWord.word || !nextWord.meaning) {
    return res.status(400).json({ message: "word and meaning are required." });
  }

  communityWords = [nextWord, ...communityWords];
  return res.status(201).json({ data: communityWords, message: "Word submitted." });
});

export default router;

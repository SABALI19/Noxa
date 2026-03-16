import { authFetch } from "./authService";

const WORD_OF_DAY_STORAGE_KEY = "noxa_word_of_day";
const COMMUNITY_WORDS_STORAGE_KEY = "noxa_community_words";
const DEFAULT_WORD_OF_DAY = {
  word: "Momentum",
  meaning: "The energy that builds when you keep moving toward a goal.",
  example: "Protect your momentum by finishing one meaningful task before noon.",
  updatedAt: new Date().toISOString(),
};

const WORD_OF_DAY_READ_PATH = "/api/v1/community/words/featured";
const COMMUNITY_WORDS_PATH = "/api/v1/community/words";

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const normalizeWordOfDay = (payload) => {
  const source =
    payload && typeof payload === "object" && payload.data && typeof payload.data === "object"
      ? payload.data
      : payload;

  if (!source || typeof source !== "object") {
    return DEFAULT_WORD_OF_DAY;
  }

  return {
    id: source.id || source._id || null,
    word: typeof source.word === "string" && source.word.trim() ? source.word.trim() : DEFAULT_WORD_OF_DAY.word,
    meaning:
      typeof source.meaning === "string" && source.meaning.trim()
        ? source.meaning.trim()
        : DEFAULT_WORD_OF_DAY.meaning,
    example:
      typeof source.example === "string" && source.example.trim()
        ? source.example.trim()
        : DEFAULT_WORD_OF_DAY.example,
    updatedAt:
      typeof source.updatedAt === "string" && source.updatedAt.trim()
        ? source.updatedAt
        : DEFAULT_WORD_OF_DAY.updatedAt,
    createdAt: source.createdAt || source.updatedAt || DEFAULT_WORD_OF_DAY.updatedAt,
    submittedBy: source.submittedBy || null,
    status: source.status || "approved",
    moderatedBy: source.moderatedBy || null,
    moderatedAt: source.moderatedAt || null,
    moderationNote: source.moderationNote || "",
  };
};

const readStoredWordOfDay = () => {
  try {
    const raw = localStorage.getItem(WORD_OF_DAY_STORAGE_KEY);
    return raw ? normalizeWordOfDay(JSON.parse(raw)) : DEFAULT_WORD_OF_DAY;
  } catch {
    return DEFAULT_WORD_OF_DAY;
  }
};

const persistWordOfDay = (value) => {
  const normalized = normalizeWordOfDay(value);
  try {
    localStorage.setItem(WORD_OF_DAY_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore storage failures and still return the normalized payload.
  }
  return normalized;
};

const readStoredCommunityWords = () => {
  try {
    const raw = localStorage.getItem(COMMUNITY_WORDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((item) => normalizeWordOfDay(item)) : [];
  } catch {
    return [];
  }
};

const persistCommunityWords = (entries) => {
  const normalizedEntries = Array.isArray(entries) ? entries.map((item) => normalizeWordOfDay(item)) : [];
  try {
    localStorage.setItem(COMMUNITY_WORDS_STORAGE_KEY, JSON.stringify(normalizedEntries));
  } catch {
    // Ignore storage failures and still return the normalized payload.
  }
  return normalizedEntries;
};

const mergeCommunityWords = (remoteEntries, localEntries = readStoredCommunityWords()) => {
  const normalizedRemote = Array.isArray(remoteEntries)
    ? remoteEntries.map((item) => normalizeWordOfDay(item))
    : [];
  const remoteKeys = new Set(
    normalizedRemote.map((entry) => `${entry.id || "no-id"}:${String(entry.word || "").toLowerCase()}`)
  );

  const localPendingEntries = localEntries
    .map((item) => normalizeWordOfDay(item))
    .filter((entry) => entry.status !== "approved")
    .filter((entry) => {
      const key = `${entry.id || "no-id"}:${String(entry.word || "").toLowerCase()}`;
      return !remoteKeys.has(key);
    });

  return [...localPendingEntries, ...normalizedRemote];
};

const getRandomFeaturedWord = (entries) => {
  if (!entries.length) {
    return DEFAULT_WORD_OF_DAY;
  }

  const selectedIndex = Math.floor(Math.random() * entries.length);
  return normalizeWordOfDay(entries[selectedIndex]);
};

export const getWordOfDay = async () => {
  try {
    const response = await fetch(WORD_OF_DAY_READ_PATH);
    if (!response.ok) {
      const fallbackEntries = readStoredCommunityWords();
      return persistWordOfDay(getRandomFeaturedWord(fallbackEntries));
    }

    const payload = await parseJsonSafe(response);
    return persistWordOfDay(payload);
  } catch {
    const fallbackEntries = readStoredCommunityWords();
    return persistWordOfDay(getRandomFeaturedWord(fallbackEntries));
  }
};

export const getCommunityWords = async () => {
  try {
    const response = await fetch(COMMUNITY_WORDS_PATH);
    if (!response.ok) {
      return readStoredCommunityWords();
    }

    const payload = await parseJsonSafe(response);
    const entries = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    return persistCommunityWords(mergeCommunityWords(entries));
  } catch {
    return readStoredCommunityWords();
  }
};

export const submitCommunityWord = async (payload) => {
  const submissionPayload = {
    word: String(payload?.word || "").trim(),
    meaning: String(payload?.meaning || "").trim(),
    example: String(payload?.example || "").trim(),
  };

  if (!submissionPayload.word) {
    throw new Error("Word is required.");
  }

  if (!submissionPayload.meaning) {
    throw new Error("Meaning is required.");
  }

  const normalizedPayload = normalizeWordOfDay({
    ...submissionPayload,
    updatedAt: new Date().toISOString(),
    status: "pending",
    submittedBy: payload?.submittedBy || null,
  });

  let response;

  try {
    response = await authFetch(COMMUNITY_WORDS_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submissionPayload),
    });
  } catch {
    const nextEntries = [normalizedPayload, ...readStoredCommunityWords()];
    persistCommunityWords(nextEntries);
    persistWordOfDay(getRandomFeaturedWord(nextEntries));
    return normalizedPayload;
  }

  const json = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(json?.message || "Failed to submit word of the day.");
  }

  const createdEntry = normalizeWordOfDay(json);
  const nextEntries = [createdEntry, ...readStoredCommunityWords().filter((entry) => entry.id !== createdEntry.id)];
  persistCommunityWords(nextEntries);
  return createdEntry;
};

export const updateWordOfDay = async (payload) => submitCommunityWord(payload);

export const getCachedWordOfDay = () => readStoredWordOfDay();
export const getCachedCommunityWords = () => readStoredCommunityWords();

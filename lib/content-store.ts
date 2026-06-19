import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { ContentItem, WorkflowState } from "./content";
import { canTransition } from "./content";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "content.json");

function generateId(): string {
  return randomBytes(12).toString("hex");
}

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
  }
}

async function readAll(): Promise<ContentItem[]> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeAll(items: ContentItem[]) {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), "utf-8");
}

export const contentStore = {
  async list(params?: {
    search?: string;
    status?: WorkflowState;
    page?: number;
    pageSize?: number;
  }) {
    let items = await readAll();
    const { search, status, page = 1, pageSize = 20 } = params || {};

    if (status) {
      items = items.filter((i) => i.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.author.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q),
      );
    }

    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const total = items.length;
    const start = (page - 1) * pageSize;
    const data = items.slice(start, start + pageSize);

    return { data, total, page, pageSize };
  },

  async get(id: string): Promise<ContentItem | null> {
    const items = await readAll();
    return items.find((i) => i.id === id) ?? null;
  },

  async create(input: {
    title: string;
    body: string;
    category: string;
    author: string;
    authorEmail: string;
  }): Promise<ContentItem> {
    const items = await readAll();
    const now = new Date().toISOString();
    const item: ContentItem = {
      id: generateId(),
      title: input.title,
      body: input.body,
      category: input.category,
      status: "DRAFT",
      author: input.author,
      authorEmail: input.authorEmail,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      version: 1,
    };
    items.push(item);
    await writeAll(items);
    return item;
  },

  async update(
    id: string,
    input: Partial<Pick<ContentItem, "title" | "body" | "category">>,
  ): Promise<ContentItem | null> {
    const items = await readAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    items[idx] = {
      ...items[idx],
      ...input,
      updatedAt: new Date().toISOString(),
      version: items[idx].version + 1,
    };
    await writeAll(items);
    return items[idx];
  },

  async transition(id: string, toStatus: WorkflowState): Promise<ContentItem | null> {
    const items = await readAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const current = items[idx];

    if (!canTransition(current.status, toStatus)) {
      return null;
    }

    const now = new Date().toISOString();
    items[idx] = {
      ...current,
      status: toStatus,
      updatedAt: now,
      publishedAt: toStatus === "PUBLISHED" ? now : current.publishedAt,
      version: current.version + 1,
    };
    await writeAll(items);
    return items[idx];
  },

  async delete(id: string): Promise<boolean> {
    const items = await readAll();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    await writeAll(items);
    return true;
  },
};

interface Snippet {
  id: string;
  title: string;
  language: string | null;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface SnippetsResponse {
  snippets: Snippet[];
}

const SEARCH_DEBOUNCE_MS = 200;

const form = document.getElementById("snippet-form") as HTMLFormElement;
const formTitle = document.getElementById("form-title") as HTMLHeadingElement;
const snippetIdInput = document.getElementById("snippet-id") as HTMLInputElement;
const titleInput = document.getElementById("title") as HTMLInputElement;
const languageInput = document.getElementById("language") as HTMLInputElement;
const bodyInput = document.getElementById("body") as HTMLTextAreaElement;
const tagsInput = document.getElementById("tags") as HTMLInputElement;
const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
const cancelBtn = document.getElementById("cancel-btn") as HTMLButtonElement;
const searchInput = document.getElementById("search") as HTMLInputElement;
const snippetList = document.getElementById("snippet-list") as HTMLDivElement;
const emptyState = document.getElementById("empty-state") as HTMLParagraphElement;
const noResultsState = document.getElementById(
  "no-results-state",
) as HTMLParagraphElement;

let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function formatTags(tags: string[]): string {
  return tags.join(", ");
}

function getSearchQuery(): string | undefined {
  const query = searchInput.value.trim();
  return query || undefined;
}

function resetForm(): void {
  snippetIdInput.value = "";
  form.reset();
  formTitle.textContent = "New snippet";
  saveBtn.textContent = "Save snippet";
  cancelBtn.hidden = true;
}

function fillForm(snippet: Snippet): void {
  snippetIdInput.value = snippet.id;
  titleInput.value = snippet.title;
  languageInput.value = snippet.language ?? "";
  bodyInput.value = snippet.body;
  tagsInput.value = formatTags(snippet.tags);
  formTitle.textContent = "Edit snippet";
  saveBtn.textContent = "Update snippet";
  cancelBtn.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function fetchSnippets(query?: string): Promise<Snippet[]> {
  const url = query
    ? `/api/snippets?q=${encodeURIComponent(query)}`
    : "/api/snippets";
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load snippets");
  }
  const data = (await response.json()) as SnippetsResponse;
  return data.snippets;
}

async function copySnippetBody(
  button: HTMLButtonElement,
  body: string,
): Promise<void> {
  try {
    await navigator.clipboard.writeText(body);
    const originalText = button.textContent ?? "Copy";
    button.textContent = "Copied!";
    button.disabled = true;
    window.setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 1500);
  } catch {
    window.alert("Could not copy to clipboard");
  }
}

function renderSnippetCard(snippet: Snippet): HTMLElement {
  const card = document.createElement("article");
  card.className = "snippet-card";
  card.dataset.id = snippet.id;

  const header = document.createElement("div");
  header.className = "snippet-card-header";

  const title = document.createElement("h3");
  title.className = "snippet-title";
  title.textContent = snippet.title;

  const meta = document.createElement("div");
  meta.className = "snippet-meta";
  if (snippet.language) {
    const lang = document.createElement("span");
    lang.className = "snippet-language";
    lang.textContent = snippet.language;
    meta.appendChild(lang);
  }
  if (snippet.tags.length > 0) {
    const tags = document.createElement("span");
    tags.className = "snippet-tags";
    tags.textContent = snippet.tags.join(" · ");
    meta.appendChild(tags);
  }

  header.appendChild(title);
  if (meta.childElementCount > 0) {
    header.appendChild(meta);
  }

  const body = document.createElement("pre");
  body.className = "snippet-body";
  body.textContent = snippet.body;

  const actions = document.createElement("div");
  actions.className = "snippet-actions";

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "copy-btn";
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    void copySnippetBody(copyBtn, snippet.body);
  });

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "secondary";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    fillForm(snippet);
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "danger";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", async (event) => {
    event.stopPropagation();
    const confirmed = window.confirm(
      `Delete "${snippet.title}"? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/snippets/${snippet.id}`, {
      method: "DELETE",
    });
    if (!response.ok && response.status !== 204) {
      window.alert("Failed to delete snippet");
      return;
    }

    if (snippetIdInput.value === snippet.id) {
      resetForm();
    }
    await renderSnippets();
  });

  actions.appendChild(copyBtn);
  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  card.appendChild(header);
  card.appendChild(body);
  card.appendChild(actions);

  card.addEventListener("click", () => {
    fillForm(snippet);
  });

  return card;
}

function updateEmptyStates(snippets: Snippet[], query?: string): void {
  const isSearching = Boolean(query);

  if (snippets.length > 0) {
    emptyState.hidden = true;
    noResultsState.hidden = true;
    return;
  }

  if (isSearching) {
    emptyState.hidden = true;
    noResultsState.hidden = false;
    return;
  }

  emptyState.hidden = false;
  noResultsState.hidden = true;
}

async function renderSnippets(): Promise<void> {
  const query = getSearchQuery();
  const snippets = await fetchSnippets(query);
  snippetList.replaceChildren();

  updateEmptyStates(snippets, query);

  for (const snippet of snippets) {
    snippetList.appendChild(renderSnippetCard(snippet));
  }
}

function scheduleSearch(): void {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  searchDebounceTimer = setTimeout(() => {
    void renderSnippets();
  }, SEARCH_DEBOUNCE_MS);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    title: titleInput.value.trim(),
    language: languageInput.value.trim() || undefined,
    body: bodyInput.value,
    tags: parseTags(tagsInput.value),
  };

  const editingId = snippetIdInput.value;
  const response = await fetch(
    editingId ? `/api/snippets/${editingId}` : "/api/snippets",
    {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    window.alert("Failed to save snippet");
    return;
  }

  resetForm();
  await renderSnippets();
});

cancelBtn.addEventListener("click", () => {
  resetForm();
});

searchInput.addEventListener("input", () => {
  scheduleSearch();
});

renderSnippets().catch(() => {
  emptyState.hidden = false;
  emptyState.textContent = "Could not load snippets.";
});

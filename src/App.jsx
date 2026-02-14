import React, { useEffect, useMemo, useRef, useState } from "react";
import { ref, push, onValue, update, remove } from "firebase/database";
import { db } from "./firebase";

function safeTrim(s) {
  return (s || "").toString().trim();
}
function nowISO() {
  return new Date().toISOString();
}
function getListCodeFromUrl() {
  const raw = window.location.hash?.replace("#", "") || "";
  const code = safeTrim(raw);
  return code || "";
}
function setListCodeToUrl(code) {
  window.location.hash = code ? `#${code}` : "";
}

function Crown() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 8l4 3 5-6 5 6 4-3v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M5 18h14" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="3" cy="8" r="1.2" fill="currentColor" />
      <circle cx="12" cy="5" r="1.2" fill="currentColor" />
      <circle cx="21" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function Pill({ children, active, onClick }) {
  return (
    <button className={`pill ${active ? "pillActive" : ""}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

export default function App() {
  const [listCode, setListCode] = useState(getListCodeFromUrl());
  const [codeInput, setCodeInput] = useState(getListCodeFromUrl() || "JASLEEN-DALJEET");
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [link, setLink] = useState("");
  const [price, setPrice] = useState("");
  const [priority, setPriority] = useState("Nice-to-have");

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("All"); // All | Open | Reserved | Purchased
  const titleRef = useRef(null);

  useEffect(() => {
    const handler = () => setListCode(getListCodeFromUrl());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  useEffect(() => {
    if (!listCode) return;
    setLoading(true);
    const itemsRef = ref(db, `wishlists/${listCode}/items`);
    const unsub = onValue(
      itemsRef,
      (snap) => {
        setItems(snap.val() || {});
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [listCode]);

  const itemArray = useMemo(() => {
    const arr = Object.entries(items || {}).map(([id, v]) => ({ id, ...v }));
    arr.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return arr;
  }, [items]);

  const filtered = useMemo(() => {
    const q = safeTrim(query).toLowerCase();
    return itemArray.filter((it) => {
      const text = `${it.title || ""} ${it.notes || ""} ${it.link || ""}`.toLowerCase();
      const matchQ = !q || text.includes(q);
      const status = it.status || "Open";
      const matchTab =
        tab === "All" ||
        (tab === "Open" && status === "Open") ||
        (tab === "Reserved" && status === "Reserved") ||
        (tab === "Purchased" && status === "Purchased");
      return matchQ && matchTab;
    });
  }, [itemArray, query, tab]);

  const stats = useMemo(() => {
    const all = itemArray.length;
    const open = itemArray.filter((x) => (x.status || "Open") === "Open").length;
    const reserved = itemArray.filter((x) => x.status === "Reserved").length;
    const purchased = itemArray.filter((x) => x.status === "Purchased").length;
    return { all, open, reserved, purchased };
  }, [itemArray]);

  async function createOrOpenList() {
    const c = safeTrim(codeInput).replace(/\s+/g, "-").toUpperCase().slice(0, 40);
    if (!c) return;
    setListCodeToUrl(c);
    setListCode(c);
  }

  async function addItem(e) {
    e.preventDefault();
    if (!listCode) return;

    const t = safeTrim(title);
    if (!t) {
      titleRef.current?.focus();
      return;
    }

    const payload = {
      title: t,
      notes: safeTrim(notes),
      link: safeTrim(link),
      price: safeTrim(price),
      priority,
      status: "Open",
      reservedBy: "",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };

    await push(ref(db, `wishlists/${listCode}/items`), payload);

    setTitle("");
    setNotes("");
    setLink("");
    setPrice("");
    setPriority("Nice-to-have");
    titleRef.current?.focus();
  }

  async function setStatus(id, status) {
    if (!listCode) return;
    const patch = { status, updatedAt: nowISO() };
    if (status !== "Reserved") patch.reservedBy = "";
    await update(ref(db, `wishlists/${listCode}/items/${id}`), patch);
  }

  async function toggleReserve(id, currentStatus, currentReservedBy) {
    if (!listCode) return;
    if (currentStatus === "Reserved") {
      await update(ref(db, `wishlists/${listCode}/items/${id}`), {
        status: "Open",
        reservedBy: "",
        updatedAt: nowISO(),
      });
    } else {
      await update(ref(db, `wishlists/${listCode}/items/${id}`), {
        status: "Reserved",
        reservedBy: currentReservedBy || "Daljeet 💌",
        updatedAt: nowISO(),
      });
    }
  }

  async function updateField(id, patch) {
    if (!listCode) return;
    await update(ref(db, `wishlists/${listCode}/items/${id}`), { ...patch, updatedAt: nowISO() });
  }

  async function deleteItem(id) {
    if (!listCode) return;
    if (!confirm("Delete this wish?")) return;
    await remove(ref(db, `wishlists/${listCode}/items/${id}`));
  }

  function copyLink() {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    alert("Link copied 💗 Send it to Jasleen.");
  }

  return (
    <div className="bg">
      <div className="glow" />
      <div className="wrap">
        <header className="header">
          <div className="brand">
            <div className="crest"><Crown /></div>
            <div>
              <div className="title">Jasleen’s Wishlist</div>
              <div className="subtitle">A royal little list for “Amore mio, per sempre.”</div>
            </div>
          </div>
          <div className="topActions">
            <button className="btn" type="button" onClick={copyLink} disabled={!listCode}>
              Copy Shared Link
            </button>
          </div>
        </header>

        {!listCode ? (
          <section className="card">
            <h2 className="h2">Create your couple list code</h2>
            <p className="muted">
              Pick a code you both know (example: <b>JASLEEN-DALJEET</b>). This becomes your shared link.
            </p>
            <div className="row">
              <input
                className="input"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="JASLEEN-DALJEET"
              />
              <button className="btnPrimary" onClick={createOrOpenList} type="button">
                Open My List 💗
              </button>
            </div>
            <p className="mutedSmall">Tip: once opened, just share the URL with Jasleen.</p>
          </section>
        ) : (
          <>
            <section className="card">
              <div className="cardHead">
                <div className="stats">
                  <span className="stat">All: <b>{stats.all}</b></span>
                  <span className="stat">Open: <b>{stats.open}</b></span>
                  <span className="stat">Reserved: <b>{stats.reserved}</b></span>
                  <span className="stat">Purchased: <b>{stats.purchased}</b></span>
                </div>
                <div className="codeChip">
                  <span className="dot" /> List Code: <b>{listCode}</b>
                </div>
              </div>

              <form className="form" onSubmit={addItem}>
                <div className="grid2">
                  <div>
                    <label className="label">Wish</label>
                    <input
                      ref={titleRef}
                      className="input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Pink pearl earrings ✨"
                    />
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option>Must-have</option>
                      <option>Nice-to-have</option>
                      <option>Someday</option>
                    </select>
                  </div>
                </div>

                <div className="grid2">
                  <div>
                    <label className="label">Link</label>
                    <input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="label">Price</label>
                    <input className="input" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$ / ₹ (optional)" />
                  </div>
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Color, size, why you want it…"
                  />
                </div>

                <div className="row">
                  <button className="btnPrimary" type="submit">Add to Jasleen’s List 💝</button>
                  <span className="mutedSmall">{loading ? "Syncing…" : "Instantly shared across your devices."}</span>
                </div>
              </form>
            </section>

            <section className="card">
              <div className="toolbar">
                <div className="tabs">
                  <Pill active={tab === "All"} onClick={() => setTab("All")}>All</Pill>
                  <Pill active={tab === "Open"} onClick={() => setTab("Open")}>Open</Pill>
                  <Pill active={tab === "Reserved"} onClick={() => setTab("Reserved")}>Reserved</Pill>
                  <Pill active={tab === "Purchased"} onClick={() => setTab("Purchased")}>Purchased</Pill>
                </div>
                <input className="input search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search wishes…" />
              </div>

              {filtered.length === 0 ? (
                <div className="empty">
                  <div className="emptyBig">💗</div>
                  <div className="emptyText">No wishes here yet.</div>
                  <div className="mutedSmall">Add something cute and make it yours.</div>
                </div>
              ) : (
                <div className="list">
                  {filtered.map((it) => (
                    <div key={it.id} className={`item ${it.status === "Purchased" ? "purchased" : ""}`}>
                      <div className="itemTop">
                        <div className="itemTitle">
                          <span className={`badge badge${(it.priority || "").replace("-", "")}`}>{it.priority || "Nice-to-have"}</span>
                          <span className="wishText">{it.title}</span>
                        </div>

                        <div className="itemActions">
                          <button type="button" className="btnSmall" onClick={() => toggleReserve(it.id, it.status, it.reservedBy)}>
                            {it.status === "Reserved" ? "Unreserve" : "Reserve 💌"}
                          </button>
                          <button type="button" className="btnSmall" onClick={() => setStatus(it.id, it.status === "Purchased" ? "Open" : "Purchased")}>
                            {it.status === "Purchased" ? "Undo" : "Purchased ✅"}
                          </button>
                          <button type="button" className="btnSmallDanger" onClick={() => deleteItem(it.id)}>Delete</button>
                        </div>
                      </div>

                      <div className="meta">
                        <span className="chip">Status: <b>{it.status || "Open"}</b></span>
                        {it.price ? <span className="chip">Price: <b>{it.price}</b></span> : null}
                        {it.status === "Reserved" ? (
                          <span className="chip">
                            Reserved by{" "}
                            <input
                              className="inlineInput"
                              value={it.reservedBy || ""}
                              placeholder="Daljeet 💌"
                              onChange={(e) => updateField(it.id, { reservedBy: e.target.value })}
                            />
                          </span>
                        ) : null}
                      </div>

                      {it.link ? (
                        <a className="link" href={it.link} target="_blank" rel="noreferrer">
                          Open link ↗
                        </a>
                      ) : null}

                      {it.notes ? <div className="notes">{it.notes}</div> : null}

                      <div className="time">Added: {it.createdAt ? new Date(it.createdAt).toLocaleString() : "—"}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <footer className="footer">
              <div className="footerLine">
                Made with <span className="heart">❤️</span> by <b>Daljeet</b> for <b>Jasleen</b>.
              </div>
              <div className="mutedSmall">Little original. Little techy. But the love is infinite.</div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

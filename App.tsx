import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Menu as MenuIcon,
  Minus,
  Phone,
  Plus,
  Send,
  ShoppingCart,
  Star,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { MENU_ITEMS } from "./constants";
import { CartItem, ComboInfo, ComboItem, MenuItem } from "./types";
import { cn } from "./utils";

const COMBO_PONUKY = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQer8aeMT5jYlxJ5GemQjl6C0oo7Noedqe0pC41a6FqobbXmc7wzckVddCMs6rOrTjamqa9O0Y0TVc3/pub?gid=0&single=true&output=csv";
const COMBO_INFO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQer8aeMT5jYlxJ5GemQjl6C0oo7Noedqe0pC41a6FqobbXmc7wzckVddCMs6rOrTjamqa9O0Y0TVc3/pub?gid=117799646&single=true&output=csv";

type OrderItemInput = MenuItem | {
  id: string;
  name: string;
  price: number;
  description?: string;
  category?: MenuItem["category"];
  weight?: string;
  allergens?: string;
};

const navItems = ["Obedové menu", "Menu", "Prečo my", "Kde sme", "Kontakt"];
const categories: { id: MenuItem["category"]; label: string }[] = [
  { id: "burgers", label: "Burgre" },
  { id: "pizza", label: "Pizza" },
  { id: "salads", label: "Šaláty & Poké" },
  { id: "soups", label: "Polievky" },
];

function parseCSV(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQ = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === "\"" && text[i + 1] === "\"") {
        field += "\"";
        i++;
      } else if (c === "\"") {
        inQ = false;
      } else {
        field += c;
      }
    } else {
      if (c === "\"") inQ = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (c !== "\r") {
        field += c;
      }
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((x) => x && x.trim()));
}

function csvToObjects<T>(text: string): T[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());

  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    headers.forEach((h, i) => {
      o[h] = (r[i] || "").trim();
    });
    return o as T;
  });
}

function priceFromCombo(value?: string) {
  return parseFloat(value?.replace(/[^\d.,]/g, "").replace(",", ".") || "0");
}

function sectionId(item: string) {
  return item.toLowerCase().replace(" ", "-");
}

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MenuItem["category"]>("burgers");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [comboInfo, setComboInfo] = useState<ComboInfo | null>(null);
  const [isLoadingCombo, setIsLoadingCombo] = useState(true);
  const [orderStatus, setOrderStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchCombo() {
      try {
        const [ponukyRes, infoRes] = await Promise.all([
          fetch(COMBO_PONUKY, { cache: "no-store" }),
          fetch(COMBO_INFO, { cache: "no-store" }),
        ]);

        if (!ponukyRes.ok || !infoRes.ok) throw new Error("Fetch failed");

        const [ponukyTxt, infoTxt] = await Promise.all([
          ponukyRes.text(),
          infoRes.text(),
        ]);

        setComboItems(csvToObjects<ComboItem>(ponukyTxt));

        const infoRows = csvToObjects<{ kluc: string; hodnota: string }>(infoTxt);
        const info: Record<string, string> = {};
        infoRows.forEach((r) => {
          if (r.kluc) info[r.kluc.toLowerCase()] = r.hodnota;
        });
        setComboInfo(info as unknown as ComboInfo);
      } catch (err) {
        console.error("Error loading combo:", err);
      } finally {
        setIsLoadingCombo(false);
      }
    }

    fetchCombo();
  }, []);

  const addToCart = (item: OrderItemInput) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          description: item.description || "",
          price: item.price,
          category: item.category || "burgers",
          weight: item.weight,
          allergens: item.allergens,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const filteredItems = useMemo(
    () => MENU_ITEMS.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  const handleOrderWhatsApp = () => {
    if (!form.name || !form.phone) {
      alert("Prosím vyplňte meno a telefón.");
      return;
    }

    const itemsText = cart
      .map((i) => `• ${i.name} x${i.quantity} — ${(i.price * i.quantity).toFixed(2)}€`)
      .join("\n");

    const msg = `Dobrý deň, objednávka:\n\nMeno: ${form.name}\nTelefón: ${form.phone}\nAdresa: ${form.address || "osobný odber"}\nPoznámka: ${form.note}\n\n${itemsText}\n\nCelkom: ${cartTotal.toFixed(2)}€`;
    window.open(`https://wa.me/421902669123?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleOrderEmail = async () => {
    if (!form.name || !form.phone) {
      alert("Prosím vyplňte meno a telefón.");
      return;
    }

    setOrderStatus("sending");

    const itemsText = cart
      .map((i) => `${i.name} x${i.quantity} — ${(i.price * i.quantity).toFixed(2)}€`)
      .join("\n");

    const payload = {
      _subject: `Nová objednávka — ${form.name}`,
      meno: form.name,
      telefon: form.phone,
      email: form.email,
      adresa: form.address || "osobný odber",
      poznamka: form.note,
      polozky: itemsText,
      celkom: `${cartTotal.toFixed(2)}€`,
    };

    try {
      const res = await fetch("https://formspree.io/f/maqlvjkg", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setOrderStatus("success");
        setCart([]);
        setForm({ name: "", phone: "", email: "", address: "", note: "" });
        setTimeout(() => {
          setOrderStatus("idle");
          setIsCartOpen(false);
        }, 2500);
      } else {
        setOrderStatus("error");
      }
    } catch (err) {
      setOrderStatus("error");
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden selection:bg-brand-accent selection:text-brand-bg">
      <nav
        className={cn(
          "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
          isScrolled ? "bg-brand-bg/90 shadow-xl backdrop-blur-xl border-b border-white/10" : "bg-gradient-to-b from-black/70 to-transparent"
        )}
      >
        <div className="container flex h-20 items-center justify-between gap-4 sm:h-24">
          <a href="#" className="flex items-center gap-3 shrink-0" aria-label="Alcatraz domov">
            <img src="logo.png" alt="Alcatraz Pizza and Burgers" className="h-14 w-auto sm:h-16" />
            <span className="hidden font-display text-3xl tracking-wider text-white sm:block">ALCATRAZ</span>
          </a>

          <div className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${sectionId(item)}`}
                className="text-xs font-bold uppercase tracking-[0.18em] text-brand-text-muted transition-colors hover:text-brand-accent"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition-colors hover:border-brand-accent/40 hover:text-brand-accent"
              aria-label="Otvoriť košík"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-black text-brand-bg">
                  {cartCount}
                </span>
              )}
            </button>

            <a
              href="tel:+421902669123"
              className="hidden items-center gap-2 rounded-2xl bg-brand-accent px-5 py-3 text-sm font-black text-brand-bg transition-colors hover:bg-brand-accent-hover lg:flex"
            >
              <Phone className="h-4 w-4" />
              0902 669 123
            </a>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white md:hidden"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-brand-bg/95 px-5 pt-28 backdrop-blur-xl md:hidden"
          >
            <div className="mx-auto flex max-w-sm flex-col gap-3">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${sectionId(item)}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4 font-display text-3xl tracking-wide text-white transition-colors hover:text-brand-accent"
                >
                  {item}
                </a>
              ))}
              <a
                href="tel:+421902669123"
                className="mt-3 flex items-center justify-center gap-3 rounded-3xl bg-brand-accent px-5 py-4 text-base font-black text-brand-bg"
              >
                <Phone className="h-5 w-5" />
                Zavolať 0902 669 123
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative min-h-[92svh] overflow-hidden pt-28 sm:pt-32 lg:min-h-screen lg:pt-36">
        <div className="absolute inset-0 -z-10">
          <img src="hero_pozadie.webp" alt="Burger Alcatraz" className="h-full w-full object-cover object-[62%_center] opacity-45 sm:opacity-55" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(178,201,193,0.16),transparent_34%),linear-gradient(90deg,rgba(26,26,26,0.98),rgba(26,26,26,0.80)_42%,rgba(26,26,26,0.54)),linear-gradient(180deg,rgba(26,26,26,0.35),#1a1a1a_96%)]" />
        </div>

        <div className="container grid min-h-[calc(92svh-7rem)] items-center pb-10 lg:grid-cols-[1.05fr_0.95fr] lg:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-2xl"
          >
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-brand-gold/25 bg-brand-bg-lighter/65 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-brand-gold backdrop-blur sm:text-xs">
              <Star className="h-3.5 w-3.5 fill-brand-gold" />
              Trenčín — Východná ulica
            </div>

            <p className="mb-3 text-xs font-black uppercase tracking-[0.32em] text-brand-accent sm:text-sm">Pizza & Burgers</p>
            <h1 className="max-w-[11ch] font-display text-[clamp(3.45rem,16vw,5rem)] leading-[0.86] tracking-wide text-white sm:max-w-[12ch] sm:text-[clamp(5rem,10vw,8.4rem)] lg:max-w-[10.5ch]">
              POCTIVÉ <span className="text-brand-accent">BURGRE</span> & TALIANSKA PIZZA
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-brand-text-muted sm:text-lg">
              Smash burgre z čerstvého hovädzieho, pizza z vlastného cesta a šaláty. Na sídlisku Juh s parkovaním pri dverách.
            </p>

            <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row">
              <a href="#menu" className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand-accent px-6 py-4 text-base font-black text-brand-bg shadow-xl shadow-brand-accent/15 transition-colors hover:bg-brand-accent-hover">
                Pozrieť menu
                <ChevronRight className="ml-2 h-5 w-5" />
              </a>
              <a href="tel:+421902669123" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.03] px-6 py-4 text-base font-black text-white backdrop-blur transition-colors hover:border-brand-gold/50 hover:text-brand-gold">
                Objednať telefonicky
              </a>
            </div>

            <div className="mt-8 grid max-w-md grid-cols-1 gap-3 text-sm text-brand-text-muted sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <Clock className="h-4 w-4 text-brand-accent" />
                Po – So: 12:00 – 22:00
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <Clock className="h-4 w-4 text-brand-accent" />
                Ne: 12:00 – 21:00
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      <div className="sticky top-20 z-30 border-y border-white/10 bg-brand-bg/90 backdrop-blur-xl md:hidden">
        <div className="container grid grid-cols-3 gap-2 py-3 text-xs font-black uppercase tracking-[0.12em]">
          <a href="tel:+421902669123" className="rounded-2xl border border-white/10 px-3 py-3 text-center text-brand-text">Zavolať</a>
          <button type="button" onClick={() => setIsCartOpen(true)} className="rounded-2xl bg-brand-accent px-3 py-3 text-center text-brand-bg">Košík {cartCount > 0 ? `(${cartCount})` : ""}</button>
          <a href="#menu" className="rounded-2xl border border-white/10 px-3 py-3 text-center text-brand-text">Menu</a>
        </div>
      </div>

      <section className="section bg-brand-bg-lighter">
        <div className="container grid gap-5 md:grid-cols-3">
          {[
            { title: "Smash Burgre", label: "Špeciality", img: "burger.webp", cat: "burgers" },
            { title: "Pizza", label: "Talianska", img: "Pizza.webp", cat: "pizza" },
            { title: "Šaláty & Poké", label: "Zdravo & čerstvo", img: "Poké.webp", cat: "salads" },
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => {
                setActiveCategory(item.cat as MenuItem["category"]);
                document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="group relative aspect-[1.35/1] overflow-hidden rounded-[2rem] border border-white/10 bg-brand-bg text-left shadow-2xl md:aspect-[4/3]"
            >
              <img src={item.img} alt={item.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/35 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                <div className="mb-2 text-[11px] font-black uppercase tracking-[0.25em] text-brand-accent">{item.label}</div>
                <h2 className="text-4xl text-white sm:text-5xl">{item.title}</h2>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="obedové-menu" className="section overflow-hidden">
        <div className="container">
          <div className="mb-9 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="section-kicker">Denné menu</div>
              <h2 className="section-title">OBEDOVÉ <span className="text-brand-gold">COMBO</span></h2>
              <p className="mt-4 max-w-2xl text-brand-text-muted">Rýchle obedové combo načítané priamo z aktuálnej ponuky. Ak ľudstvo zvládne tabuľku, zvládne aj obed.</p>
            </div>

            {comboInfo && (
              <div className="rounded-[2rem] border border-brand-gold/20 bg-brand-bg-lighter p-5 text-left lg:min-w-80">
                <div className="text-[11px] font-black uppercase tracking-[0.25em] text-brand-text-muted">Cena</div>
                <div className="mt-1 font-display text-6xl leading-none text-brand-gold">{comboInfo.cena}</div>
                <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-text-muted">
                  <Clock className="h-4 w-4" />
                  {comboInfo.cas}
                </div>
                {comboInfo.pondelok && <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-brand-accent">Pondelok — {comboInfo.pondelok}</div>}
              </div>
            )}
          </div>

          {isLoadingCombo ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-[2rem] bg-brand-bg-lighter" />)}
            </div>
          ) : comboItems.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {comboItems.map((item, idx) => (
                <article key={`${item.cislo}-${idx}`} className="card flex flex-col gap-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-gold/10 font-display text-2xl text-brand-gold">{item.cislo || "•"}</div>
                    <div>
                      <h3 className="text-2xl leading-tight text-white">{item.nazov}</h3>
                      <p className="mt-2 text-sm leading-6 text-brand-text-muted">{item.popis}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => addToCart({
                      id: `combo-${idx}`,
                      name: `Obedové combo — ${item.nazov}`,
                      price: priceFromCombo(comboInfo?.cena),
                      description: item.popis,
                      category: "burgers",
                    })}
                    className="mt-auto inline-flex min-h-12 items-center justify-center rounded-2xl border border-brand-accent/25 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-brand-accent transition-colors hover:bg-brand-accent hover:text-brand-bg"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Pridať
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-white/10 bg-brand-bg-lighter p-6 text-brand-text-muted">Obedové menu sa nepodarilo načítať.</div>
          )}
        </div>
      </section>

      <section id="menu" className="section bg-brand-bg-lighter">
        <div className="container">
          <div className="mb-8 max-w-3xl">
            <div className="section-kicker">Naše menu</div>
            <h2 className="section-title">ČO U NÁS DOSTANETE</h2>
            <p className="mt-4 text-brand-text-muted">Všetky burgre podávame s domácimi hranolkami. Alergény sú označené číslami pri každej položke.</p>
          </div>

          <div className="scrollbar-hide -mx-4 mb-7 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "shrink-0 rounded-2xl border px-5 py-3 text-sm font-black uppercase tracking-[0.13em] transition-colors",
                  activeCategory === cat.id
                    ? "border-brand-accent bg-brand-accent text-brand-bg"
                    : "border-white/10 bg-brand-bg text-brand-text-muted hover:text-white"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredItems.map((item) => (
              <article key={item.id} className="menu-card">
                <div className="min-w-0">
                  <h3 className="text-2xl leading-tight text-white sm:text-3xl">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand-text-muted">{item.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-brand-text-muted">
                    {item.weight && <span className="rounded-full bg-white/5 px-3 py-1.5">{item.weight}</span>}
                    {item.allergens && <span className="rounded-full bg-white/5 px-3 py-1.5">Alergény: {item.allergens}</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                  <div className="font-display text-4xl leading-none text-brand-gold">{item.price.toFixed(2)}€</div>
                  <button
                    type="button"
                    onClick={() => addToCart(item)}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-accent text-brand-bg transition-colors hover:bg-brand-accent-hover"
                    aria-label={`Pridať ${item.name}`}
                  >
                    <Plus className="h-6 w-6" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="prečo-my" className="section">
        <div className="container">
          <div className="mb-9 max-w-3xl">
            <div className="section-kicker">Prečo my</div>
            <h2 className="section-title">JEDLO BEZ DIVADLA</h2>
            <p className="mt-4 text-brand-text-muted">Jednoduché veci treba robiť poctivo. Zvyšok je marketingový dymostroj pre ľudí, ktorí predávajú suchú žemľu ako zážitok.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: UtensilsCrossed, title: "Čerstvé suroviny", text: "Hovädzie, vlastné cesto a veci, ktoré majú chuť." },
              { icon: CheckCircle2, title: "Jasné menu", text: "Vieš, čo objednávaš. Žiadna kuchárska poézia bez obsahu." },
              { icon: MapPin, title: "Parkovanie pri dverách", text: "Síd­lisko Juh, Východná ulica. Praktické, ako má byť." },
              { icon: Clock, title: "Dlhé otváracie hodiny", text: "Po–So do 22:00, nedeľa do 21:00." },
            ].map((item) => (
              <article key={item.title} className="card">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-brand-text-muted">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="kde-sme" className="section bg-brand-bg-lighter">
        <div className="container grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <div className="card flex flex-col justify-between gap-8">
            <div>
              <div className="section-kicker">Kde sme</div>
              <h2 className="section-title">TRENČÍN — JUH</h2>
              <p className="mt-4 text-brand-text-muted">Východná 2425/1, Trenčín. Keď nájdeš parkovanie, už si skoro vyhral. Tu ho máš pri dverách.</p>
            </div>

            <div className="space-y-3">
              <a href="https://www.google.com/maps/search/?api=1&query=V%C3%BDchodn%C3%A1+2425%2F1%2C+Tren%C4%8D%C3%ADn" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-2xl bg-brand-accent px-5 py-4 font-black text-brand-bg">
                Navigovať
                <ChevronRight className="h-5 w-5" />
              </a>
              <a href="tel:+421902669123" className="flex items-center justify-between rounded-2xl border border-white/10 px-5 py-4 font-black text-white">
                0902 669 123
                <Phone className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="min-h-[320px] overflow-hidden rounded-[2rem] border border-white/10 bg-brand-bg shadow-2xl sm:min-h-[440px]">
            <iframe
              title="Alcatraz mapa"
              src="https://www.google.com/maps?q=V%C3%BDchodn%C3%A1%202425%2F1%2C%20Tren%C4%8D%C3%ADn&output=embed"
              className="h-full min-h-[320px] w-full sm:min-h-[440px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <section id="kontakt" className="section">
        <div className="container">
          <div className="mb-9 max-w-3xl">
            <div className="section-kicker">Kontakt</div>
            <h2 className="section-title">OBJEDNAJ ALEBO NAPÍŠ</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Telefón", val: "0902 669 123", href: "tel:+421902669123", icon: Phone },
              { label: "Email", val: "alcatraz@alcatraz.sk", href: "mailto:alcatraz@alcatraz.sk", icon: Mail },
              { label: "Facebook", val: "@alcatrazbistro", href: "https://www.facebook.com/alcatrazbistro/", icon: Facebook },
              { label: "Instagram", val: "@alcatraztn", href: "https://www.instagram.com/alcatraztn/", icon: Instagram },
            ].map((item) => (
              <a key={item.label} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="card group">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent transition-transform group-hover:scale-105">
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-text-muted">{item.label}</div>
                <div className="mt-2 break-words text-lg font-bold text-white group-hover:text-brand-accent">{item.val}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-10">
        <div className="container flex flex-col gap-5 text-sm text-brand-text-muted md:flex-row md:items-center md:justify-between">
          <div>© 2026 Alcatraz Pizza & Burgers · Východná 2425/1, Trenčín</div>
          <div className="flex gap-3">
            <a href="https://www.facebook.com/alcatrazbistro/" target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 hover:text-brand-accent"><Facebook className="h-5 w-5" /></a>
            <a href="https://www.instagram.com/alcatraztn/" target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 hover:text-brand-accent"><Instagram className="h-5 w-5" /></a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-5 right-5 z-40 hidden items-center gap-3 rounded-3xl bg-brand-accent px-5 py-4 font-black text-brand-bg shadow-2xl shadow-brand-accent/20 md:flex"
          >
            <ShoppingCart className="h-5 w-5" />
            Košík
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-bg px-1 text-xs text-brand-accent">{cartCount}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ y: "100%", x: 0 }}
              animate={{ y: 0, x: 0 }}
              exit={{ y: "100%", x: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[90svh] flex-col rounded-t-[2rem] border-t border-white/10 bg-brand-bg-lighter shadow-2xl md:inset-x-auto md:bottom-0 md:right-0 md:top-0 md:h-full md:max-h-none md:w-full md:max-w-md md:rounded-none md:border-l md:border-t-0"
            >
              <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
                <div>
                  <h3 className="text-4xl text-white">KOŠÍK</h3>
                  <p className="text-sm text-brand-text-muted">{cartCount} položiek</p>
                </div>
                <button type="button" onClick={() => setIsCartOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 text-white">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                {cart.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center text-brand-text-muted">
                    <ShoppingCart className="h-14 w-14 opacity-30" />
                    <p>Košík je prázdny.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="rounded-3xl border border-white/10 bg-brand-bg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-bold leading-snug text-white">{item.name}</h4>
                            <div className="mt-1 font-display text-2xl text-brand-gold">{(item.price * item.quantity).toFixed(2)}€</div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-brand-bg-lighter p-1">
                            <button type="button" onClick={() => removeFromCart(item.id)} className="flex h-9 w-9 items-center justify-center rounded-xl hover:text-brand-accent"><Minus className="h-4 w-4" /></button>
                            <span className="w-6 text-center font-black">{item.quantity}</span>
                            <button type="button" onClick={() => addToCart(item)} className="flex h-9 w-9 items-center justify-center rounded-xl hover:text-brand-accent"><Plus className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="space-y-5 border-t border-white/10 bg-brand-bg p-5 sm:p-6">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-xs font-black uppercase tracking-[0.22em] text-brand-text-muted">Celkom</span>
                    <span className="font-display text-5xl leading-none text-brand-gold">{cartTotal.toFixed(2)}€</span>
                  </div>

                  <div className="grid gap-3">
                    <input type="text" placeholder="Meno *" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <input type="tel" placeholder="Telefón *" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    <input type="email" placeholder="Email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <input type="text" placeholder="Adresa alebo osobný odber" className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    <textarea placeholder="Poznámka" className="input min-h-20 resize-none" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                  </div>

                  {orderStatus === "success" && <div className="rounded-2xl bg-green-500/15 p-3 text-center text-sm font-bold text-green-300">Objednávka bola odoslaná.</div>}
                  {orderStatus === "error" && <div className="rounded-2xl bg-red-500/15 p-3 text-center text-sm font-bold text-red-300">Chyba pri odosielaní. Skús WhatsApp.</div>}

                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={handleOrderWhatsApp} className="min-h-14 rounded-2xl bg-[#25D366] px-4 py-3 font-black text-white">WhatsApp</button>
                    <button type="button" onClick={handleOrderEmail} disabled={orderStatus === "sending"} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-brand-accent px-4 py-3 font-black text-brand-bg disabled:opacity-60">
                      {orderStatus === "sending" ? "Odosielam..." : <><Send className="h-4 w-4" />Odoslať</>}
                    </button>
                  </div>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

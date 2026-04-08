import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Phone, 
  MapPin, 
  Clock, 
  Mail, 
  Facebook, 
  Instagram, 
  Menu as MenuIcon, 
  X, 
  ShoppingCart, 
  ChevronRight, 
  Plus, 
  Minus,
  Star,
  CheckCircle2,
  UtensilsCrossed,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import { MENU_ITEMS } from "./constants";
import { MenuItem, CartItem, ComboItem, ComboInfo } from "./types";

// --- Constants ---
const COMBO_PONUKY = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQer8aeMT5jYlxJ5GemQjl6C0oo7Noedqe0pC41a6FqobbXmc7wzckVddCMs6rOrTjamqa9O0Y0TVc3/pub?gid=0&single=true&output=csv";
const COMBO_INFO = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQer8aeMT5jYlxJ5GemQjl6C0oo7Noedqe0pC41a6FqobbXmc7wzckVddCMs6rOrTjamqa9O0Y0TVc3/pub?gid=117799646&single=true&output=csv";

// --- Utils ---
function parseCSV(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === "\"" && text[i + 1] === "\"") { field += "\""; i++; }
      else if (c === "\"") { inQ = false; }
      else { field += c; }
    } else {
      if (c === "\"") { inQ = true; }
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { }
      else { field += c; }
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(x => x && x.trim()));
}

function csvToObjects<T>(text: string): T[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).map(r => {
    const o: any = {};
    headers.forEach((h, i) => o[h] = (r[i] || "").trim());
    return o as T;
  });
}

// --- Components ---

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

  // Form state
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    note: ""
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchCombo() {
      try {
        const [ponukyRes, infoRes] = await Promise.all([
          fetch(COMBO_PONUKY, { cache: "no-store" }),
          fetch(COMBO_INFO, { cache: "no-store" })
        ]);
        if (!ponukyRes.ok || !infoRes.ok) throw new Error("Fetch failed");
        const [ponukyTxt, infoTxt] = await Promise.all([ponukyRes.text(), infoRes.text()]);
        setComboItems(csvToObjects<ComboItem>(ponukyTxt));
        const infoRows = csvToObjects<{ kluc: string; hodnota: string }>(infoTxt);
        const info: any = {};
        infoRows.forEach(r => { if (r.kluc) info[r.kluc.toLowerCase()] = r.hodnota; });
        setComboInfo(info as ComboInfo);
      } catch (err) {
        console.error("Error loading combo:", err);
      } finally {
        setIsLoadingCombo(false);
      }
    }
    fetchCombo();
  }, []);

  const addToCart = (item: MenuItem | { name: string; price: number; id: string }) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 } as CartItem];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const handleOrderWhatsApp = () => {
    if (!form.name || !form.phone) {
      alert("Prosím vyplňte meno a telefón.");
      return;
    }
    const itemsText = cart.map(i => `• ${i.name} x${i.quantity} — ${(i.price * i.quantity).toFixed(2)}€`).join("\n");
    const msg = `Dobrý deň, objednávka:\n\nMeno: ${form.name}\nTelefón: ${form.phone}\nAdresa: ${form.address || "osobný odber"}\nPoznámka: ${form.note}\n\n${itemsText}\n\nCelkom: ${cartTotal.toFixed(2)}€`;
    window.open(`https://wa.me/421902669123?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleOrderEmail = async () => {
    if (!form.name || !form.phone) {
      alert("Prosím vyplňte meno a telefón.");
      return;
    }
    setOrderStatus("sending");
    const itemsText = cart.map(i => `${i.name} x${i.quantity} — ${(i.price * i.quantity).toFixed(2)}€`).join("\n");
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
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setOrderStatus("success");
        setCart([]);
        setForm({ name: "", phone: "", email: "", address: "", note: "" });
        setTimeout(() => {
          setOrderStatus("idle");
          setIsCartOpen(false);
        }, 3000);
      } else {
        setOrderStatus("error");
      }
    } catch (err) {
      setOrderStatus("error");
    }
  };

  return (
    <div className="min-h-screen selection:bg-brand-accent selection:text-white">
      {/* --- Navigation --- */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4",
        isScrolled ? "glass py-2 shadow-xl" : "bg-transparent"
      )}>
        <div className="container flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <img src="logo.png" alt="Alcatraz Logo" className="h-12 w-auto" />
            <span className="font-display text-2xl tracking-wider hidden sm:block">ALCATRAZ</span>
          </a>

          <ul className="hidden md:flex items-center gap-8">
            {["Obedové menu", "Menu", "Prečo my", "Kde sme", "Kontakt"].map((item) => (
              <li key={item}>
                <a 
                  href={`#${item.toLowerCase().replace(" ", "-")}`} 
                  className="text-sm font-semibold uppercase tracking-widest text-brand-text-muted hover:text-brand-accent transition-colors"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4">
            <a 
              href="tel:+421902669123" 
              className="hidden sm:flex items-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover-lift shadow-lg shadow-brand-accent/20"
            >
              <Phone className="w-4 h-4" />
              0902 669 123
            </a>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-brand-text hover:text-brand-accent transition-colors"
            >
              {isMobileMenuOpen ? <X /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* --- Mobile Menu --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 glass md:hidden flex flex-col items-center justify-center gap-8 pt-20"
          >
            {["Obedové menu", "Menu", "Prečo my", "Kde sme", "Kontakt"].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-display text-4xl tracking-widest text-brand-text hover:text-brand-accent transition-colors"
              >
                {item}
              </a>
            ))}
            <a 
              href="tel:+421902669123" 
              className="flex items-center gap-3 bg-brand-accent text-white px-8 py-4 rounded-2xl font-bold text-lg"
            >
              <Phone className="w-6 h-6" />
              0902 669 123
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Hero --- */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="hero_pozadie.webp" 
            alt="Hero background" 
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-bg/60 via-brand-bg/80 to-brand-bg" />
        </div>

        <div className="container relative z-10 flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-gold/30 bg-brand-gold/10 text-brand-gold text-xs font-bold uppercase tracking-widest mb-6">
              <Star className="w-3 h-3 fill-brand-gold" />
              Trenčín — Východná ulica
            </div>
            <h1 className="text-6xl md:text-8xl mb-6 leading-none">
              POCTIVÉ <span className="text-brand-accent">BURGRE</span> <br />
              & TALIANSKA PIZZA
            </h1>
            <p className="text-lg text-brand-text-muted mb-10 max-w-lg leading-relaxed">
              Smash burgre z čerstvého hovädzieho, pizza z vlastného cesta a šaláty. Na sídlisku Juh s parkovaním pri dverách.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a href="#menu" className="bg-brand-accent hover:bg-brand-accent-hover text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover-lift shadow-xl shadow-brand-accent/30 text-center">
                Pozrieť menu
              </a>
              <a href="tel:+421902669123" className="border-2 border-white/20 hover:border-brand-gold hover:text-brand-gold text-white px-8 py-4 rounded-xl font-bold text-lg transition-all text-center">
                Objednať telefonicky
              </a>
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-brand-text-muted">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-accent" />
                Po – So: 12:00 – 22:00
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-accent" />
                Ne: 12:00 – 21:00
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Showcase --- */}
      <section className="py-20 bg-brand-bg-lighter">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Smash Burgre", label: "Špeciality", img: "burger.webp", cat: "burgers" },
              { title: "Pizza", label: "Talianska", img: "Pizza.webp", cat: "pizza" },
              { title: "Šaláty & Poké", label: "Zdravo & Čerstvo", img: "Poké.webp", cat: "salads" }
            ].map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ scale: 1.02 }}
                className="relative aspect-[4/3] rounded-3xl overflow-hidden group cursor-pointer shadow-2xl"
                onClick={() => {
                  setActiveCategory(item.cat as any);
                  document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <img 
                  src={item.img} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-bg via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 p-8">
                  <div className="text-brand-accent text-xs font-bold uppercase tracking-widest mb-2">{item.label}</div>
                  <h3 className="text-3xl text-white">{item.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Lunch Combo --- */}
      <section id="obedové-menu" className="py-24 relative overflow-hidden">
        <div className="container">
          <div className="flex flex-col items-center text-center gap-8 mb-16">
            <div>
              <div className="text-brand-accent text-sm font-bold uppercase tracking-[0.3em] mb-4">Denné menu</div>
              <h2 className="text-5xl md:text-7xl">OBEDOVÉ <span className="text-brand-gold">COMBO</span></h2>
            </div>
            {comboInfo && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-6xl font-display text-brand-gold">{comboInfo.cena}</div>
                <div className="flex flex-col items-center text-brand-text-muted">
                  <div className="flex items-center gap-2 mb-1 font-semibold">
                    <Clock className="w-4 h-4" />
                    {comboInfo.cas}
                  </div>
                  {comboInfo.pondelok && (
                    <div className="text-brand-accent text-xs font-bold uppercase tracking-widest opacity-70">
                      Pondelok — {comboInfo.pondelok}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {isLoadingCombo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-brand-bg-lighter rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comboItems.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 bg-brand-bg-lighter rounded-2xl border border-white/5 hover:border-brand-gold/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center font-display text-xl font-bold shrink-0">
                      {item.cislo || "•"}
                    </div>
                    <div>
                      <h4 className="text-xl mb-2 group-hover:text-brand-gold transition-colors">{item.nazov}</h4>
                      <p className="text-sm text-brand-text-muted leading-relaxed mb-6">{item.popis}</p>
                      <button 
                        onClick={() => addToCart({ 
                          id: `combo-${idx}`, 
                          name: `Obedové combo — ${item.nazov}`, 
                          price: parseFloat(comboInfo?.cena.replace(/[^\d.,]/g, "").replace(",", ".") || "0"),
                          description: item.popis,
                          category: "burgers" // dummy
                        })}
                        className="flex items-center gap-2 text-brand-accent font-bold text-sm uppercase tracking-widest hover:text-brand-accent-hover transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Pridať do košíka
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* --- Menu --- */}
      <section id="menu" className="py-24 bg-brand-bg-lighter">
        <div className="container">
          <div className="text-center mb-16">
            <div className="text-brand-accent text-sm font-bold uppercase tracking-[0.3em] mb-4">Naše menu</div>
            <h2 className="text-5xl md:text-7xl mb-6">ČO U NÁS DOSTANETE</h2>
            <p className="text-brand-text-muted max-w-xl mx-auto">
              Všetky burgre podávame s domácimi hranolkami. Alergény sú označené číslami pri každej položke.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {[
              { id: "burgers", label: "Burgre" },
              { id: "pizza", label: "Pizza" },
              { id: "salads", label: "Šaláty & Poké" },
              { id: "soups", label: "Polievky" }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={cn(
                  "px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest transition-all",
                  activeCategory === cat.id 
                    ? "bg-brand-accent text-white shadow-lg shadow-brand-accent/20" 
                    : "bg-brand-bg text-brand-text-muted hover:text-brand-text"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
            {MENU_ITEMS.filter(i => i.category === activeCategory).map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="p-8 bg-brand-bg hover:bg-brand-bg-lighter transition-colors flex flex-col sm:flex-row justify-between gap-6"
              >
                <div className="flex-1">
                  <h4 className="text-2xl mb-2">{item.name}</h4>
                  <p className="text-sm text-brand-text-muted leading-relaxed mb-2">
                    {item.description}
                  </p>
                  <div className="text-[10px] text-brand-text-muted/60 font-bold uppercase tracking-widest">
                    {item.weight} {item.allergens && `· Alergény: ${item.allergens}`}
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4">
                  <div className="text-2xl font-display text-brand-gold">{item.price.toFixed(2)}€</div>
                  <button 
                    onClick={() => addToCart(item)}
                    className="p-2 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-lg transition-all hover-lift"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-brand-bg rounded-2xl border border-white/5 text-xs text-brand-text-muted leading-relaxed">
            <strong>Alergény:</strong> 1 Lepok · 2 Kôrovce · 3 Vajcia · 4 Ryby · 5 Arašidy · 6 Sója · 7 Mlieko · 8 Orechy · 9 Zeler · 10 Horčica · 11 Sezam · 12 Siričitany · 13 Vlčí bôb · 14 Mäkkýše · 15 Hríby · 16 Paradajky
          </div>
        </div>
      </section>

      {/* --- Why Us --- */}
      <section id="prečo-my" className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <div className="text-brand-accent text-sm font-bold uppercase tracking-[0.3em] mb-4">Prečo my</div>
            <h2 className="text-5xl md:text-7xl mb-6">ČO NÁS ODLIŠUJE</h2>
            <div className="flex items-center justify-center gap-2 text-brand-gold font-bold">
              <Star className="w-5 h-5 fill-brand-gold" />
              <span className="text-xl">4,5 ★ na Google z 928+ recenzií</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Smash technika", desc: "Hovädzie mäso smashované na grile — chrumkavá krusta, šťavnatý vnútrok.", icon: UtensilsCrossed },
              { title: "Rozvoz po Trenčíne", desc: "Objednajte telefonicky na 0902 669 123 a privezieme až ku vám.", icon: CheckCircle2 },
              { title: "Parkovanie", desc: "Východná ulica, sídlisko Juh. Parkovisko priamo pred prevádzkou.", icon: MapPin },
              { title: "Rezervácie", desc: "Zavolajte nám a rezervujeme vám stôl na akýkoľvek deň a čas.", icon: Clock }
            ].map((feature, idx) => (
              <div key={idx} className="p-8 bg-brand-bg-lighter rounded-3xl border border-white/5 hover:border-brand-accent/30 transition-all hover-lift">
                <div className="w-12 h-12 bg-brand-accent/10 text-brand-accent rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl mb-3">{feature.title}</h4>
                <p className="text-sm text-brand-text-muted leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Location --- */}
      <section id="kde-sme" className="py-24 bg-brand-bg-lighter">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="rounded-3xl overflow-hidden shadow-2xl h-[500px] border border-white/10">
              <iframe 
                src="https://www.google.com/maps?q=Alcatraz+Pizza+and+Burgers,+Východná,+Trenčín&output=embed" 
                className="w-full h-full grayscale invert opacity-80"
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="p-10 bg-brand-bg rounded-3xl border border-white/5 shadow-xl">
              <h3 className="text-4xl mb-8">OTVÁRACIE HODINY</h3>
              <div className="space-y-4 mb-12">
                {[
                  { day: "Pondelok – Sobota", time: "12:00 – 22:00" },
                  { day: "Nedeľa", time: "12:00 – 21:00" },
                  { day: "Kuchyňa v nedeľu", time: "do 20:30", highlight: true }
                ].map((row, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 border-bottom border-white/5">
                    <span className="text-brand-text-muted font-medium">{row.day}</span>
                    <span className={cn("font-display text-xl", row.highlight ? "text-brand-accent" : "text-brand-gold")}>{row.time}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-brand-accent shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">Adresa</div>
                    <div className="text-lg">Východná 2425/1, Trenčín</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-brand-accent shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1">Telefón</div>
                    <a href="tel:+421902669123" className="text-lg hover:text-brand-accent transition-colors">0902 669 123</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Contact --- */}
      <section id="kontakt" className="py-24">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Telefón", val: "0902 669 123", href: "tel:+421902669123", icon: Phone },
              { label: "Email", val: "alcatraz@alcatraz.sk", href: "mailto:alcatraz@alcatraz.sk", icon: Mail },
              { label: "Facebook", val: "@alcatrazbistro", href: "https://www.facebook.com/alcatrazbistro/", icon: Facebook },
              { label: "Instagram", val: "@alcatraztn", href: "https://www.instagram.com/alcatraztn/", icon: Instagram }
            ].map((item, idx) => (
              <a 
                key={idx}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="p-8 bg-brand-bg-lighter rounded-3xl border border-white/5 hover:border-brand-accent/30 transition-all text-center group"
              >
                <div className="w-14 h-14 bg-brand-accent/10 text-brand-accent rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-2">{item.label}</div>
                <div className="text-lg font-semibold group-hover:text-brand-accent transition-colors">{item.val}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-12 border-t border-white/5">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-sm text-brand-text-muted">
            © 2026 Alcatraz Pizza & Burgers · Východná 2425/1, Trenčín
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-lg border border-white/5 flex items-center justify-center text-brand-text-muted hover:text-brand-accent hover:border-brand-accent transition-all">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-lg border border-white/5 flex items-center justify-center text-brand-text-muted hover:text-brand-accent hover:border-brand-accent transition-all">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>

      {/* --- Cart FAB --- */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 20 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-8 right-8 z-40 bg-brand-accent text-white px-6 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-2xl shadow-brand-accent/40 hover-lift"
          >
            <ShoppingCart className="w-6 h-6" />
            <span>Košík</span>
            <span className="bg-white text-brand-accent w-6 h-6 rounded-full flex items-center justify-center text-xs">{cartCount}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* --- Cart Drawer --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md z-[70] bg-brand-bg-lighter shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-3xl">KOŠÍK</h3>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:text-brand-accent transition-colors">
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-brand-text-muted gap-4">
                    <ShoppingCart className="w-16 h-16 opacity-20" />
                    <p>Košík je prázdny</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 py-4 border-b border-white/5">
                      <div className="flex-1">
                        <h5 className="font-bold mb-1">{item.name}</h5>
                        <div className="text-brand-gold font-display text-lg">{(item.price * item.quantity).toFixed(2)}€</div>
                      </div>
                      <div className="flex items-center gap-3 bg-brand-bg rounded-lg p-1 border border-white/5">
                        <button onClick={() => removeFromCart(item.id)} className="p-1 hover:text-brand-accent transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="p-1 hover:text-brand-accent transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-brand-bg border-t border-white/5 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-brand-text-muted font-bold uppercase tracking-widest text-xs">Celkom</span>
                    <span className="text-4xl font-display text-brand-gold">{cartTotal.toFixed(2)}€</span>
                  </div>

                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Meno *" 
                      className="w-full bg-brand-bg-lighter border border-white/10 rounded-xl p-3 outline-none focus:border-brand-accent transition-colors"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                    <input 
                      type="tel" 
                      placeholder="Telefón *" 
                      className="w-full bg-brand-bg-lighter border border-white/10 rounded-xl p-3 outline-none focus:border-brand-accent transition-colors"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                    <input 
                      type="text" 
                      placeholder="Adresa (alebo osobný odber)" 
                      className="w-full bg-brand-bg-lighter border border-white/10 rounded-xl p-3 outline-none focus:border-brand-accent transition-colors"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                    />
                    <textarea 
                      placeholder="Poznámka..." 
                      className="w-full bg-brand-bg-lighter border border-white/10 rounded-xl p-3 outline-none focus:border-brand-accent transition-colors resize-none h-20"
                      value={form.note}
                      onChange={e => setForm({ ...form, note: e.target.value })}
                    />
                  </div>

                  {orderStatus === "success" && (
                    <div className="p-4 bg-green-500/20 text-green-400 rounded-xl text-sm font-bold text-center">
                      Objednávka bola úspešne odoslaná!
                    </div>
                  )}
                  {orderStatus === "error" && (
                    <div className="p-4 bg-red-500/20 text-red-400 rounded-xl text-sm font-bold text-center">
                      Chyba pri odosielaní. Skúste WhatsApp.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={handleOrderWhatsApp}
                      className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe59] text-white py-4 rounded-xl font-bold transition-all"
                    >
                      WhatsApp
                    </button>
                    <button 
                      onClick={handleOrderEmail}
                      disabled={orderStatus === "sending"}
                      className="flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      {orderStatus === "sending" ? "Odosielam..." : (
                        <>
                          <Send className="w-4 h-4" />
                          Odoslať
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

import { MenuItem } from "./types";

export const MENU_ITEMS: MenuItem[] = [
  // BURGERS
  {
    id: "alcatraz-burger",
    name: "Alcatraz Burger",
    description: "130g mleté hovädzie, mayo, šalát, grilovaná slanina, cheddar, vajíčko, grilovaná cibuľka",
    price: 14.30,
    weight: "380g",
    allergens: "1,3,7",
    category: "burgers"
  },
  {
    id: "hot-chilli-smash",
    name: "Hot Chilli Smash Burger",
    description: "130g hovädzie v dvoch plackách, mayo, grilovaná slaninka, cheddar, čerstvá cibuľka, jalapeños",
    price: 14.30,
    weight: "380g",
    allergens: "1,3,7",
    category: "burgers"
  },
  {
    id: "chicken-burger",
    name: "Chicken Burger",
    description: "130g grilované kuracie prsia, mayo, šalát, mozzarella, grilovaná slaninka, cheddar, paradajka",
    price: 13.30,
    weight: "380g",
    allergens: "1,3,7",
    category: "burgers"
  },
  {
    id: "ultimate-burger",
    name: "Ultimate Burger",
    description: "130g mleté hovädzie, mayo, šalát, cheddar, grilovaná slaninka, BBQ omáčka, červená cibuľka, kyslá uhorka",
    price: 14.30,
    weight: "390g",
    allergens: "1,3,7,10",
    category: "burgers"
  },
  {
    id: "bacon-smash",
    name: "Bacon Smash Burger",
    description: "130g hovädzie v dvoch plackách, mayo, šalát, cheddar, grilovaná slaninka, čerstvá cibuľka",
    price: 14.40,
    weight: "380g",
    allergens: "1,3,7",
    category: "burgers"
  },
  {
    id: "cheese-smash",
    name: "Cheese Smash Burger",
    description: "130g hovädzie v dvoch plackách, mayo, šalát, dvojitý cheddar, grilovaná slaninka, grilovaný roztekajúci syr",
    price: 14.40,
    weight: "390g",
    allergens: "1,3,7",
    category: "burgers"
  },
  {
    id: "pulled-duck",
    name: "Burger s trhaným kačacím stehnom",
    description: "150g konfitované kačacie stehno, cibulové chutney, domáca paštéta",
    price: 13.50,
    weight: "390g",
    allergens: "1,7,10,11",
    category: "burgers"
  },
  {
    id: "veggie-burger",
    name: "Veggie Burger",
    description: "Grilovaný údený syr, grilovaná cuketa a šampióny, rukola, brusnicová mayo, viedenská cibuľka",
    price: 13.30,
    weight: "370g",
    allergens: "1,3,7",
    category: "burgers"
  },
  // PIZZA
  {
    id: "pizza-stangle",
    name: "Pizza štangle",
    description: "Chrumkavé pizza tyčinky",
    price: 6.50,
    weight: "320g",
    allergens: "1,7",
    category: "pizza"
  },
  {
    id: "margherita",
    name: "Margherita",
    description: "Par. omáčka, mozzarella, čerstvé cherry",
    price: 11.20,
    weight: "600g",
    allergens: "1,7,16",
    category: "pizza"
  },
  {
    id: "prosciutto",
    name: "Prosciutto",
    description: "Par. omáčka, mozzarella, šunka",
    price: 11.30,
    weight: "650g",
    allergens: "1,7,16",
    category: "pizza"
  },
  {
    id: "prosciutto-e-funghi",
    name: "Prosciutto e Funghi",
    description: "Par. omáčka, mozzarella, šunka, šampióny",
    price: 11.30,
    weight: "680g",
    allergens: "1,7,15,16",
    category: "pizza"
  },
  {
    id: "cinque-formaggi",
    name: "Cinque Formaggi",
    description: "Par. omáčka, gouda, mozzarella, niva, údený syr, parmezán",
    price: 11.70,
    weight: "680g",
    allergens: "1,7,16",
    category: "pizza"
  },
  {
    id: "quattro-stagioni",
    name: "Quattro Stagioni",
    description: "Par. omáčka, mozzarella, šunka, artičoky, kapary, olivy, šampióny",
    price: 11.40,
    weight: "700g",
    allergens: "1,7,15,16",
    category: "pizza"
  },
  {
    id: "quattro-carne",
    name: "Quattro Carne",
    description: "Par. omáčka, mozzarella, šunka, talianska saláma, slanina, klobása",
    price: 11.70,
    weight: "700g",
    allergens: "1,7",
    category: "pizza"
  },
  {
    id: "toto",
    name: "Toto",
    description: "Par. omáčka, mozzarella, talianska saláma, šampióny, jalapeños, červená cibuľka",
    price: 12.40,
    weight: "700g",
    allergens: "1,7,15,16",
    category: "pizza"
  },
  {
    id: "fatoria",
    name: "Fatoria",
    description: "Par. omáčka, mozzarella, šunka, niva, olivy, kuracie mäso",
    price: 11.70,
    weight: "720g",
    allergens: "1,7,10,16",
    category: "pizza"
  },
  {
    id: "prosciutto-crudo-rucola",
    name: "Prosciutto Crudo Rucola",
    description: "Par. omáčka, mozzarella, prosciutto crudo, cherry, čerstvá rukola",
    price: 13.00,
    weight: "700g",
    allergens: "1,7,16",
    category: "pizza"
  },
  {
    id: "hercules",
    name: "Hercules",
    description: "Par. omáčka, mozzarella, saláma, kukurica, jalapeños, paprika, gorgonzola",
    price: 11.20,
    weight: "720g",
    allergens: "1,7,16",
    category: "pizza"
  },
  {
    id: "hawaii",
    name: "Hawaii",
    description: "Par. omáčka, syr, šunka, ananás",
    price: 11.30,
    weight: "620g",
    allergens: "1,7,16",
    category: "pizza"
  },
  {
    id: "alcatraz-pizza",
    name: "Alcatraz Pizza",
    description: "BBQ základ, syr, 150g hovädzie mäso, vajíčko, jalapeños, červená cibuľka, cesnak",
    price: 15.20,
    weight: "750g",
    allergens: "1,3,7",
    category: "pizza"
  },
  // SALADS
  {
    id: "goat-cheese-salad",
    name: "Šalát s kozím syrom",
    description: "Zmes listového šalátu, karamelizovaná hruška, čerstvé hrozno, grilovaný kozí syr, vlašské orechy, figy, javorový sirup",
    price: 13.20,
    weight: "380g",
    allergens: "1,7,8",
    category: "salads"
  },
  {
    id: "double-cheese-salad",
    name: "Double Cheese Salad",
    description: "Zmes listového šalátu, cherry, uhorka, redkvička, grilovaná niva, kuracie mäso, parmezán",
    price: 13.50,
    weight: "400g",
    allergens: "7",
    category: "salads"
  },
  {
    id: "chicken-poke",
    name: "Chicken Poké",
    description: "Jazmínová ryža, grilované kura v teriyaki, edamame, wakame, avokádo, mrkva, uhorka, redkvička, granátové jablko, kešu, sezam. Japonská majonéza a sriracha.",
    price: 13.90,
    weight: "400g",
    allergens: "3,6,8,11",
    category: "salads"
  },
  // SOUPS
  {
    id: "beef-broth",
    name: "Domáci hovädzí vývar",
    description: "S rezancami a zeleninou",
    price: 3.50,
    weight: "0,3l",
    category: "soups"
  },
  {
    id: "soup-of-the-day",
    name: "Polievka dňa",
    description: "Podľa dennej ponuky",
    price: 3.50,
    weight: "0,3l",
    category: "soups"
  }
];

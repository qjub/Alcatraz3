export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  weight?: string;
  allergens?: string;
  category: "burgers" | "pizza" | "salads" | "soups";
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface ComboItem {
  cislo: string;
  nazov: string;
  popis: string;
}

export interface ComboInfo {
  cena: string;
  cas: string;
  popis: string;
  pondelok?: string;
}

export type OptionItem = {
  value: string;
  label: string;
  priceModifier: number;
  hex?: string;
  icon?: string;
};

export type ProductOptions = {
  configuration: OptionItem[];
  fabricColor: OptionItem[];
  frameType: OptionItem[];
  armShape: OptionItem[];
  legStyle: OptionItem[];
};

export type ProductRecord = {
  id: string;
  name: string;
  basePrice: number;
  retailPrice: number;
  category: string;
  images: string[];
  availableOptions: ProductOptions;
};

export type SelectedOptions = {
  configuration: string;
  fabricColor: string;
  frameType: string;
  armShape: string;
  legStyle: string;
};

export type CartStateItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  selectedOptions: SelectedOptions;
};

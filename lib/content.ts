import data from "./content.json";

export type Lang = "ar" | "en";

export interface ConceptItem {
  key: string;
  title: string;
  desc: string;
  url: string;
  img: string;
}

/* One stop in the gallery: client work hangs in a frame, a live Sarmadax
   product stands on a plinth, and the concepts share one frame. */
export interface Project {
  key: string;
  kind: "work" | "product" | "concepts";
  title: string;
  desc: string;
  challenge: string;
  solution: string;
  features: string[];
  url: string;
  img: string;
  /* products */
  phone?: string;
  audience?: string;
  price?: string;
  cta?: string;
  /* concepts */
  items?: ConceptItem[];
}

export type Content = Omit<typeof data.ar, "projects"> & { projects: Project[] };
export const content: Record<Lang, Content> = {
  ar: data.ar as unknown as Content,
  en: data.en as unknown as Content,
};
export const skills: string[] = data.skills;
export const contactInfo = {
  email: data.email,
  whatsapp: data.whatsapp,
  whatsappLink: data.whatsappLink,
};

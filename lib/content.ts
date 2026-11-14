import data from "./content.json";

export type Lang = "ar" | "en";
export type Content = typeof data.ar;
export const content: Record<Lang, Content> = { ar: data.ar, en: data.en };
export const skills: string[] = data.skills;
export const contactInfo = {
  email: data.email,
  whatsapp: data.whatsapp,
  whatsappLink: data.whatsappLink,
};

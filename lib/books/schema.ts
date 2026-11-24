// Rules for the cookbook form (browser + server).
import * as z from "zod";
import { contentLanguage, imagePath, optionalText, requiredText } from "@/lib/validation";

export const cookbookSchema = z.object({
  title: requiredText(200),
  author: optionalText(200),
  language: contentLanguage,
  notes: optionalText(5000),
  cover_image_path: imagePath("covers").nullable(),
});

export type CookbookInput = z.infer<typeof cookbookSchema>;

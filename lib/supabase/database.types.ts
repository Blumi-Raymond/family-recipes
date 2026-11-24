// Types that mirror supabase/migrations/ (initial schema + groups + recipe form).
// Written by hand for now. When the schema changes, update this file
// (later we can generate it automatically with the Supabase CLI).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ContentLanguage = "he" | "en";
export type KosherType = "dairy" | "meat" | "pareve";
export type RecipeSourceType = "manual" | "scan" | "import";
export type TagCategory = "protein" | "dish" | "occasion" | "other";
export type GroupRole = "owner" | "member";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          ui_language: ContentLanguage;
          created_at: string;
          updated_at: string;
        };
        // Members may only change their name and language (enforced in the database)
        Insert: {
          id: string;
          display_name?: string;
          ui_language?: ContentLanguage;
        };
        Update: {
          display_name?: string;
          ui_language?: ContentLanguage;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          is_personal: boolean; // the user's private group ("My kitchen")
          created_by: string | null;
          created_at: string;
        };
        // Created by the database (sign-up trigger). Sharing comes later.
        Insert: never;
        Update: never;
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: GroupRole;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      cookbooks: {
        Row: {
          id: string;
          group_id: string;
          title: string;
          author: string | null;
          language: ContentLanguage;
          cover_image_path: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id?: string; // default: my personal group
          title: string;
          author?: string | null;
          language?: ContentLanguage;
          cover_image_path?: string | null;
          notes?: string | null;
        };
        Update: {
          title?: string;
          author?: string | null;
          language?: ContentLanguage;
          cover_image_path?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      source_pages: {
        Row: {
          id: string;
          group_id: string;
          cookbook_id: string | null;
          page_number: number | null;
          image_path: string;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id?: string; // default: my personal group
          cookbook_id?: string | null;
          page_number?: number | null;
          image_path: string;
        };
        Update: {
          cookbook_id?: string | null;
          page_number?: number | null;
          image_path?: string;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          group_id: string;
          title: string;
          description: string | null;
          language: ContentLanguage;
          kosher_type: KosherType;
          yield_text: string | null;
          servings: number | null;
          prep_minutes: number | null;
          cook_minutes: number | null;
          total_minutes: number | null;
          notes: string | null;
          cookbook_id: string | null;
          page_number: number | null; // page in the cookbook
          source_note: string | null;
          source_type: RecipeSourceType;
          created_by: string | null;
          updated_by: string | null; // set by a database trigger
          created_at: string;
          updated_at: string;
          deleted_at: string | null; // set = recipe is in the trash
          deleted_by: string | null; // set by a database trigger
        };
        Insert: {
          id?: string;
          group_id?: string; // default: my personal group
          title: string;
          kosher_type: KosherType; // required, no default
          description?: string | null;
          language?: ContentLanguage;
          yield_text?: string | null;
          servings?: number | null;
          prep_minutes?: number | null;
          cook_minutes?: number | null;
          total_minutes?: number | null;
          notes?: string | null;
          cookbook_id?: string | null;
          page_number?: number | null;
          source_note?: string | null;
          source_type?: RecipeSourceType;
        };
        Update: {
          title?: string;
          kosher_type?: KosherType;
          description?: string | null;
          language?: ContentLanguage;
          yield_text?: string | null;
          servings?: number | null;
          prep_minutes?: number | null;
          cook_minutes?: number | null;
          total_minutes?: number | null;
          notes?: string | null;
          cookbook_id?: string | null;
          page_number?: number | null;
          source_note?: string | null;
          source_type?: RecipeSourceType;
          deleted_at?: string | null; // "delete" = move to trash
        };
        Relationships: [
          {
            foreignKeyName: "recipes_cookbook_id_fkey";
            columns: ["cookbook_id"];
            isOneToOne: false;
            referencedRelation: "cookbooks";
            referencedColumns: ["id"];
          },
        ];
      };
      recipe_source_pages: {
        Row: { recipe_id: string; page_id: string; position: number };
        Insert: { recipe_id: string; page_id: string; position?: number };
        Update: { position?: number };
        Relationships: [];
      };
      recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          position: number;
          section: string | null;
          original_text: string | null;
          quantity: number | null;
          quantity_max: number | null;
          unit: string | null;
          name: string;
          note: string | null;
          is_optional: boolean;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          position: number;
          name: string;
          section?: string | null;
          original_text?: string | null;
          quantity?: number | null;
          quantity_max?: number | null;
          unit?: string | null;
          note?: string | null;
          is_optional?: boolean;
        };
        Update: {
          position?: number;
          name?: string;
          section?: string | null;
          original_text?: string | null;
          quantity?: number | null;
          quantity_max?: number | null;
          unit?: string | null;
          note?: string | null;
          is_optional?: boolean;
        };
        Relationships: [];
      };
      recipe_steps: {
        Row: {
          id: string;
          recipe_id: string;
          position: number;
          section: string | null;
          instruction: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          position: number;
          instruction: string;
          section?: string | null;
        };
        Update: {
          position?: number;
          instruction?: string;
          section?: string | null;
        };
        Relationships: [];
      };
      recipe_photos: {
        Row: {
          id: string;
          recipe_id: string;
          image_path: string;
          is_cover: boolean;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          image_path: string;
          is_cover?: boolean;
        };
        Update: { image_path?: string; is_cover?: boolean };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          slug: string;
          name_he: string;
          name_en: string;
          category: TagCategory;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_he: string;
          name_en: string;
          category?: TagCategory;
        };
        Update: {
          slug?: string;
          name_he?: string;
          name_en?: string;
          category?: TagCategory;
        };
        Relationships: [];
      };
      recipe_tags: {
        Row: { recipe_id: string; tag_id: string };
        Insert: { recipe_id: string; tag_id: string };
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      // Recipes that are not in the trash. The app reads from here by default.
      active_recipes: {
        Row: Database["public"]["Tables"]["recipes"]["Row"];
        Relationships: [];
      };
    };
    Functions: {
      is_group_member: { Args: { p_group_id: string }; Returns: boolean };
      personal_group_id: { Args: Record<string, never>; Returns: string };
      // null = email not registered; otherwise providers, e.g. ["email"], ["google"]
      login_methods: { Args: { p_email: string }; Returns: string[] | null };
      // Saves a whole recipe in one transaction; returns its id.
      // Shape of p_recipe: see lib/recipes/schema.ts (RecipeInput).
      save_recipe: { Args: { p_recipe: Json }; Returns: string };
    };
    Enums: {
      content_language: ContentLanguage;
      kosher_type: KosherType;
      recipe_source_type: RecipeSourceType;
      group_role: GroupRole;
    };
    CompositeTypes: Record<string, never>;
  };
};

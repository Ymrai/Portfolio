export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      portfolio_info: {
        Row: {
          id: number;
          name: string;
          tagline: string | null;
          bio_short: string | null;
          email: string | null;
          github_url: string | null;
          linkedin_url: string | null;
          resume_url: string | null;
          avatar_url: string | null;
          updated_at: string;
          home_intro_text: string | null;
          home_case_studies_title: string | null;
          home_case_studies_subtitle: string | null;
          home_case_studies_description: string | null;
          more_page_title: string | null;
          more_page_subtitle: string | null;
          more_page_description: string | null;
          about_page_title: string | null;
          about_page_subtitle: string | null;
          footer_title: string | null;
          footer_subtitle: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          tagline?: string | null;
          bio_short?: string | null;
          email?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          resume_url?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
          home_intro_text?: string | null;
          home_case_studies_title?: string | null;
          home_case_studies_subtitle?: string | null;
          home_case_studies_description?: string | null;
          more_page_title?: string | null;
          more_page_subtitle?: string | null;
          more_page_description?: string | null;
          about_page_title?: string | null;
          about_page_subtitle?: string | null;
          footer_title?: string | null;
          footer_subtitle?: string | null;
        };
        Update: {
          name?: string;
          tagline?: string | null;
          bio_short?: string | null;
          email?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          resume_url?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
          home_intro_text?: string | null;
          home_case_studies_title?: string | null;
          home_case_studies_subtitle?: string | null;
          home_case_studies_description?: string | null;
          more_page_title?: string | null;
          more_page_subtitle?: string | null;
          more_page_description?: string | null;
          about_page_title?: string | null;
          about_page_subtitle?: string | null;
          footer_title?: string | null;
          footer_subtitle?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          title: string;
          slug: string;
          company: string | null;
          case_study_title: string | null;
          client: string | null;
          industry: string | null;
          category: string | null;
          role: string | null;
          team: string | null;
          duration: string | null;
          card_bg_color: string | null;
          hero_bg_color: string | null;
          hero_image_url: string | null;
          description: string | null;
          long_description: string | null;
          tech_stack: string[];
          live_url: string | null;
          github_url: string | null;
          image_url: string | null;
          gallery_images: string[];
          case_study: Json | null;
          sections: Json | null;
          featured: boolean;
          order_index: number;
          status: "draft" | "published";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          company?: string | null;
          case_study_title?: string | null;
          client?: string | null;
          industry?: string | null;
          category?: string | null;
          role?: string | null;
          team?: string | null;
          duration?: string | null;
          card_bg_color?: string | null;
          hero_bg_color?: string | null;
          hero_image_url?: string | null;
          description?: string | null;
          long_description?: string | null;
          tech_stack?: string[];
          live_url?: string | null;
          github_url?: string | null;
          image_url?: string | null;
          gallery_images?: string[];
          case_study?: Json | null;
          sections?: Json | null;
          featured?: boolean;
          order_index?: number;
          status?: "draft" | "published";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          company?: string | null;
          case_study_title?: string | null;
          client?: string | null;
          industry?: string | null;
          category?: string | null;
          role?: string | null;
          team?: string | null;
          duration?: string | null;
          card_bg_color?: string | null;
          hero_bg_color?: string | null;
          hero_image_url?: string | null;
          description?: string | null;
          long_description?: string | null;
          tech_stack?: string[];
          live_url?: string | null;
          github_url?: string | null;
          image_url?: string | null;
          gallery_images?: string[];
          case_study?: Json | null;
          sections?: Json | null;
          featured?: boolean;
          order_index?: number;
          status?: "draft" | "published";
          updated_at?: string;
        };
        Relationships: [];
      };
      more_projects: {
        Row: {
          id: string;
          title: string;
          slug: string | null;
          description: string | null;
          industry: string | null;
          kind: string | null;
          tech_stack: string[];
          cover_image_url: string | null;
          gallery_images: string[];
          sections: Json | null;
          live_url: string | null;
          github_url: string | null;
          order_index: number;
          status: "draft" | "published";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug?: string | null;
          description?: string | null;
          industry?: string | null;
          kind?: string | null;
          tech_stack?: string[];
          cover_image_url?: string | null;
          gallery_images?: string[];
          sections?: Json | null;
          live_url?: string | null;
          github_url?: string | null;
          order_index?: number;
          status?: "draft" | "published";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string | null;
          description?: string | null;
          industry?: string | null;
          kind?: string | null;
          tech_stack?: string[];
          cover_image_url?: string | null;
          gallery_images?: string[];
          sections?: Json | null;
          live_url?: string | null;
          github_url?: string | null;
          order_index?: number;
          status?: "draft" | "published";
          updated_at?: string;
        };
        Relationships: [];
      };
      about_me: {
        Row: {
          id: number;
          bio: string | null;
          skills: string[];
          experience: Json;
          education: Json;
          interests: string[];
          updated_at: string;
        };
        Insert: {
          id?: number;
          bio?: string | null;
          skills?: string[];
          experience?: Json;
          education?: Json;
          interests?: string[];
          updated_at?: string;
        };
        Update: {
          bio?: string | null;
          skills?: string[];
          experience?: Json;
          education?: Json;
          interests?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          id: string;
          value: string;
        };
        Insert: {
          id: string;
          value: string;
        };
        Update: {
          id?: string;
          value?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

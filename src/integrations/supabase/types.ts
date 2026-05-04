export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academy_applications: {
        Row: {
          admin_notes: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          program_id: string | null
          program_title: string | null
          qualification: string | null
          status: Database["public"]["Enums"]["academy_application_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          program_id?: string | null
          program_title?: string | null
          qualification?: string | null
          status?: Database["public"]["Enums"]["academy_application_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          program_id?: string | null
          program_title?: string | null
          qualification?: string | null
          status?: Database["public"]["Enums"]["academy_application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "academy_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_programs: {
        Row: {
          category: Database["public"]["Enums"]["academy_program_category"]
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          duration: string | null
          id: string
          level: Database["public"]["Enums"]["academy_program_level"]
          publish_status: Database["public"]["Enums"]["content_status"]
          status: Database["public"]["Enums"]["academy_program_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["academy_program_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          duration?: string | null
          id?: string
          level?: Database["public"]["Enums"]["academy_program_level"]
          publish_status?: Database["public"]["Enums"]["content_status"]
          status?: Database["public"]["Enums"]["academy_program_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["academy_program_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          duration?: string | null
          id?: string
          level?: Database["public"]["Enums"]["academy_program_level"]
          publish_status?: Database["public"]["Enums"]["content_status"]
          status?: Database["public"]["Enums"]["academy_program_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          contact_type: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: Database["public"]["Enums"]["message_status"]
          subject: string | null
        }
        Insert: {
          contact_type?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
        }
        Update: {
          contact_type?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string | null
        }
        Relationships: []
      }
      dialogue_initiatives: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          id: string
          initiative_date: string | null
          initiative_type: Database["public"]["Enums"]["dialogue_initiative_type"]
          publish_status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          initiative_date?: string | null
          initiative_type?: Database["public"]["Enums"]["dialogue_initiative_type"]
          publish_status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          initiative_date?: string | null
          initiative_type?: Database["public"]["Enums"]["dialogue_initiative_type"]
          publish_status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dialogue_requests: {
        Row: {
          admin_notes: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          organization: string | null
          request_kind: string
          status: Database["public"]["Enums"]["dialogue_request_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          organization?: string | null
          request_kind?: string
          status?: Database["public"]["Enums"]["dialogue_request_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          organization?: string | null
          request_kind?: string
          status?: Database["public"]["Enums"]["dialogue_request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          cover_image: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_datetime: string | null
          event_type: string
          id: string
          is_featured: boolean
          live_link: string | null
          location: string | null
          online_link: string | null
          organizer_source: string
          publish_status: Database["public"]["Enums"]["content_status"]
          registration_link: string | null
          replay_link: string | null
          slug: string
          start_datetime: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_datetime?: string | null
          event_type: string
          id?: string
          is_featured?: boolean
          live_link?: string | null
          location?: string | null
          online_link?: string | null
          organizer_source?: string
          publish_status?: Database["public"]["Enums"]["content_status"]
          registration_link?: string | null
          replay_link?: string | null
          slug: string
          start_datetime: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_datetime?: string | null
          event_type?: string
          id?: string
          is_featured?: boolean
          live_link?: string | null
          location?: string | null
          online_link?: string | null
          organizer_source?: string
          publish_status?: Database["public"]["Enums"]["content_status"]
          registration_link?: string | null
          replay_link?: string | null
          slug?: string
          start_datetime?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      fatwa_arbitration_requests: {
        Row: {
          admin_notes: string | null
          attachment_url: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_urgent: boolean
          message: string
          phone: string | null
          request_type: Database["public"]["Enums"]["fatwa_request_type"]
          response_text: string | null
          status: Database["public"]["Enums"]["fatwa_request_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          attachment_url?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_urgent?: boolean
          message: string
          phone?: string | null
          request_type?: Database["public"]["Enums"]["fatwa_request_type"]
          response_text?: string | null
          status?: Database["public"]["Enums"]["fatwa_request_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          attachment_url?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_urgent?: boolean
          message?: string
          phone?: string | null
          request_type?: Database["public"]["Enums"]["fatwa_request_type"]
          response_text?: string | null
          status?: Database["public"]["Enums"]["fatwa_request_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      library_items: {
        Row: {
          category: string
          cover_image: string | null
          created_at: string
          created_by: string | null
          description: string | null
          downloads_count: number
          external_url: string | null
          file_url: string | null
          id: string
          is_featured: boolean
          language: string | null
          pages_count: number | null
          published_at: string | null
          publisher_source: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          downloads_count?: number
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean
          language?: string | null
          pages_count?: number | null
          published_at?: string | null
          publisher_source?: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          downloads_count?: number
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean
          language?: string | null
          pages_count?: number | null
          published_at?: string | null
          publisher_source?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_streams: {
        Row: {
          auto_archive: boolean
          created_at: string
          created_by: string | null
          description: string | null
          embed_url: string | null
          ended_at: string | null
          expires_at: string | null
          hide_from_homepage: boolean
          hide_from_videos: boolean
          id: string
          internal_notes: string | null
          live_url: string | null
          notify_admin: boolean
          notify_subscribers: boolean
          platform: string
          publisher_source: string
          replay_url: string | null
          scheduled_at: string | null
          show_on_homepage: boolean
          show_on_videos_page: boolean
          slug: string
          started_at: string | null
          status: Database["public"]["Enums"]["live_stream_status"]
          thumbnail: string | null
          title: string
          updated_at: string
        }
        Insert: {
          auto_archive?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          embed_url?: string | null
          ended_at?: string | null
          expires_at?: string | null
          hide_from_homepage?: boolean
          hide_from_videos?: boolean
          id?: string
          internal_notes?: string | null
          live_url?: string | null
          notify_admin?: boolean
          notify_subscribers?: boolean
          platform?: string
          publisher_source?: string
          replay_url?: string | null
          scheduled_at?: string | null
          show_on_homepage?: boolean
          show_on_videos_page?: boolean
          slug: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["live_stream_status"]
          thumbnail?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          auto_archive?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          embed_url?: string | null
          ended_at?: string | null
          expires_at?: string | null
          hide_from_homepage?: boolean
          hide_from_videos?: boolean
          id?: string
          internal_notes?: string | null
          live_url?: string | null
          notify_admin?: boolean
          notify_subscribers?: boolean
          platform?: string
          publisher_source?: string
          replay_url?: string | null
          scheduled_at?: string | null
          show_on_homepage?: boolean
          show_on_videos_page?: boolean
          slug?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["live_stream_status"]
          thumbnail?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      media_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          folder: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          folder?: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          folder?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          category: string
          content: string | null
          cover_image: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          gallery: Json | null
          id: string
          is_featured: boolean
          keywords: string | null
          pdf_attachment: string | null
          published_at: string | null
          publisher_source: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          gallery?: Json | null
          id?: string
          is_featured?: boolean
          keywords?: string | null
          pdf_attachment?: string | null
          published_at?: string | null
          publisher_source?: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          gallery?: Json | null
          id?: string
          is_featured?: boolean
          keywords?: string | null
          pdf_attachment?: string | null
          published_at?: string | null
          publisher_source?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_campaigns: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          status: Database["public"]["Enums"]["campaign_status"]
          title: string
          type: Database["public"]["Enums"]["campaign_type"]
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          title: string
          type?: Database["public"]["Enums"]["campaign_type"]
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          status?: Database["public"]["Enums"]["campaign_status"]
          title?: string
          type?: Database["public"]["Enums"]["campaign_type"]
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
          status: Database["public"]["Enums"]["subscriber_status"]
          subscribed_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"]
          subscribed_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          status?: Database["public"]["Enums"]["subscriber_status"]
          subscribed_at?: string
        }
        Relationships: []
      }
      research_items: {
        Row: {
          abstract: string | null
          author: string | null
          category: Database["public"]["Enums"]["research_category"]
          created_at: string
          created_by: string | null
          display_order: number
          external_url: string | null
          file_url: string | null
          id: string
          publish_status: Database["public"]["Enums"]["content_status"]
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          abstract?: string | null
          author?: string | null
          category?: Database["public"]["Enums"]["research_category"]
          created_at?: string
          created_by?: string | null
          display_order?: number
          external_url?: string | null
          file_url?: string | null
          id?: string
          publish_status?: Database["public"]["Enums"]["content_status"]
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          abstract?: string | null
          author?: string | null
          category?: Database["public"]["Enums"]["research_category"]
          created_at?: string
          created_by?: string | null
          display_order?: number
          external_url?: string | null
          file_url?: string | null
          id?: string
          publish_status?: Database["public"]["Enums"]["content_status"]
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      research_submissions: {
        Row: {
          abstract: string
          admin_notes: string | null
          attachment_url: string | null
          category: Database["public"]["Enums"]["research_category"]
          created_at: string
          email: string
          full_name: string
          id: string
          status: Database["public"]["Enums"]["research_submission_status"]
          title: string
          updated_at: string
        }
        Insert: {
          abstract: string
          admin_notes?: string | null
          attachment_url?: string | null
          category?: Database["public"]["Enums"]["research_category"]
          created_at?: string
          email: string
          full_name: string
          id?: string
          status?: Database["public"]["Enums"]["research_submission_status"]
          title: string
          updated_at?: string
        }
        Update: {
          abstract?: string
          admin_notes?: string | null
          attachment_url?: string | null
          category?: Database["public"]["Enums"]["research_category"]
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          status?: Database["public"]["Enums"]["research_submission_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          content: string | null
          cover_image: string | null
          created_at: string
          display_order: number
          id: string
          intro: string | null
          page_key: string
          sections: Json
          seo_description: string | null
          seo_title: string | null
          show_in_footer: boolean
          show_in_header: boolean
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          cover_image?: string | null
          created_at?: string
          display_order?: number
          id?: string
          intro?: string | null
          page_key: string
          sections?: Json
          seo_description?: string | null
          seo_title?: string | null
          show_in_footer?: boolean
          show_in_header?: boolean
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          cover_image?: string | null
          created_at?: string
          display_order?: number
          id?: string
          intro?: string | null
          page_key?: string
          sections?: Json
          seo_description?: string | null
          seo_title?: string | null
          show_in_footer?: boolean
          show_in_header?: boolean
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          embed_url: string | null
          id: string
          is_featured: boolean
          live_status: Database["public"]["Enums"]["live_status"] | null
          platform: string | null
          publisher_source: string
          scheduled_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          thumbnail: string | null
          title: string
          type: Database["public"]["Enums"]["video_type"]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          embed_url?: string | null
          id?: string
          is_featured?: boolean
          live_status?: Database["public"]["Enums"]["live_status"] | null
          platform?: string | null
          publisher_source?: string
          scheduled_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail?: string | null
          title: string
          type?: Database["public"]["Enums"]["video_type"]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          embed_url?: string | null
          id?: string
          is_featured?: boolean
          live_status?: Database["public"]["Enums"]["live_status"] | null
          platform?: string | null
          publisher_source?: string
          scheduled_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          thumbnail?: string | null
          title?: string
          type?: Database["public"]["Enums"]["video_type"]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_first_super_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_publish: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      public_has_any_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      academy_application_status: "new" | "reviewing" | "accepted" | "rejected"
      academy_program_category: "course" | "diploma" | "ijaza"
      academy_program_level: "beginner" | "intermediate" | "advanced"
      academy_program_status: "available" | "soon" | "closed"
      app_role: "super_admin" | "admin" | "editor" | "media_manager"
      campaign_status: "draft" | "ready" | "sent"
      campaign_type: "news" | "event" | "library" | "live" | "general"
      content_status: "draft" | "published" | "archived"
      dialogue_initiative_type:
        | "meeting"
        | "conference"
        | "seminar"
        | "initiative"
      dialogue_request_status: "new" | "reviewing" | "contacted" | "closed"
      event_status: "upcoming" | "live" | "completed" | "cancelled"
      fatwa_request_status:
        | "new"
        | "under_review"
        | "answered"
        | "closed"
        | "rejected"
      fatwa_request_type:
        | "fatwa"
        | "arbitration"
        | "family_consult"
        | "financial_consult"
        | "other"
      live_status: "scheduled" | "live" | "completed" | "cancelled"
      live_stream_status:
        | "draft"
        | "scheduled"
        | "live"
        | "completed"
        | "cancelled"
      message_status: "new" | "read" | "replied" | "archived" | "spam"
      research_category: "sharia" | "intellectual" | "contemporary" | "reports"
      research_submission_status: "new" | "reviewing" | "approved" | "rejected"
      subscriber_status: "active" | "unsubscribed"
      video_type: "video" | "live" | "recording"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      academy_application_status: ["new", "reviewing", "accepted", "rejected"],
      academy_program_category: ["course", "diploma", "ijaza"],
      academy_program_level: ["beginner", "intermediate", "advanced"],
      academy_program_status: ["available", "soon", "closed"],
      app_role: ["super_admin", "admin", "editor", "media_manager"],
      campaign_status: ["draft", "ready", "sent"],
      campaign_type: ["news", "event", "library", "live", "general"],
      content_status: ["draft", "published", "archived"],
      dialogue_initiative_type: [
        "meeting",
        "conference",
        "seminar",
        "initiative",
      ],
      dialogue_request_status: ["new", "reviewing", "contacted", "closed"],
      event_status: ["upcoming", "live", "completed", "cancelled"],
      fatwa_request_status: [
        "new",
        "under_review",
        "answered",
        "closed",
        "rejected",
      ],
      fatwa_request_type: [
        "fatwa",
        "arbitration",
        "family_consult",
        "financial_consult",
        "other",
      ],
      live_status: ["scheduled", "live", "completed", "cancelled"],
      live_stream_status: [
        "draft",
        "scheduled",
        "live",
        "completed",
        "cancelled",
      ],
      message_status: ["new", "read", "replied", "archived", "spam"],
      research_category: ["sharia", "intellectual", "contemporary", "reports"],
      research_submission_status: ["new", "reviewing", "approved", "rejected"],
      subscriber_status: ["active", "unsubscribed"],
      video_type: ["video", "live", "recording"],
    },
  },
} as const

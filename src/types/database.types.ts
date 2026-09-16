export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DayOfWeekEnum =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export type BookingStatusEnum = "pending" | "approved" | "rejected" | "cancelled";

export type EducationLevelEnum =
  | "preparatory"
  | "elementary"
  | "advanced"
  | "diploma"
  | "general";

export type ContactUrgencyEnum =
  | "normal"
  | "spiritual_urgent"
  | "confession_request"
  | "emergency";

export type StaffRoleEnum = "admin" | "secretary" | "servant" | "priest";

export type ExceptionActionEnum = "cancelled" | "added" | "modified";

export type AlertSeverityEnum = "info" | "warning" | "urgent";

export type StreamStatusEnum = "scheduled" | "live" | "completed";

export type ApplicationStatusEnum =
  | "pending"
  | "contacted"
  | "accepted"
  | "rejected"
  | "waitlisted";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name_ar: string;
          role: StaffRoleEnum;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name_ar: string;
          role?: StaffRoleEnum;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name_ar?: string;
          role?: StaffRoleEnum;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      altars: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string | null;
          patron_saint: string;
          consecration_date: string | null;
          description_ar: string;
          historical_notes: string | null;
          image_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en?: string | null;
          patron_saint: string;
          consecration_date?: string | null;
          description_ar: string;
          historical_notes?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name_ar?: string;
          name_en?: string | null;
          patron_saint?: string;
          consecration_date?: string | null;
          description_ar?: string;
          historical_notes?: string | null;
          image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clergy: {
        Row: {
          id: string;
          clerical_name_ar: string;
          clerical_name_en: string | null;
          rank_title_ar: string;
          ordination_date: string;
          hegumen_date: string | null;
          feast_day: string | null;
          responsibilities_ar: string;
          confession_hours_ar: string;
          phone_office: string | null;
          whatsapp_number: string | null;
          email: string | null;
          photo_url: string | null;
          bio_ar: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerical_name_ar: string;
          clerical_name_en?: string | null;
          rank_title_ar?: string;
          ordination_date: string;
          hegumen_date?: string | null;
          feast_day?: string | null;
          responsibilities_ar: string;
          confession_hours_ar: string;
          phone_office?: string | null;
          whatsapp_number?: string | null;
          email?: string | null;
          photo_url?: string | null;
          bio_ar?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerical_name_ar?: string;
          clerical_name_en?: string | null;
          rank_title_ar?: string;
          ordination_date?: string;
          hegumen_date?: string | null;
          feast_day?: string | null;
          responsibilities_ar?: string;
          confession_hours_ar?: string;
          phone_office?: string | null;
          whatsapp_number?: string | null;
          email?: string | null;
          photo_url?: string | null;
          bio_ar?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mass_schedules: {
        Row: {
          id: string;
          altar_id: string;
          celebrant_priest_id: string | null;
          day_of_week: DayOfWeekEnum;
          title_ar: string;
          start_time: string;
          end_time: string;
          target_group_ar: string;
          notes_ar: string | null;
          is_seasonal: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          altar_name_ar?: string | null;
          target_audience_ar?: string | null;
        };
        Insert: {
          id?: string;
          altar_id: string;
          celebrant_priest_id?: string | null;
          day_of_week: DayOfWeekEnum;
          title_ar: string;
          start_time: string;
          end_time: string;
          target_group_ar?: string;
          notes_ar?: string | null;
          is_seasonal?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          altar_id?: string;
          celebrant_priest_id?: string | null;
          day_of_week?: DayOfWeekEnum;
          title_ar?: string;
          start_time?: string;
          end_time?: string;
          target_group_ar?: string;
          notes_ar?: string | null;
          is_seasonal?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mass_schedules_altar_id_fkey";
            columns: ["altar_id"];
            isOneToOne: false;
            referencedRelation: "altars";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mass_schedules_celebrant_priest_id_fkey";
            columns: ["celebrant_priest_id"];
            isOneToOne: false;
            referencedRelation: "clergy";
            referencedColumns: ["id"];
          },
        ];
      };
      clinic_specialties: {
        Row: {
          id: string;
          name_ar: string;
          name_en: string;
          slug: string;
          description_ar: string | null;
          room_number: string | null;
          icon_name: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          room_location?: string | null;
          equipment_notes?: string | null;
        };
        Insert: {
          id?: string;
          name_ar: string;
          name_en: string;
          slug: string;
          description_ar?: string | null;
          room_number?: string | null;
          icon_name?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name_ar?: string;
          name_en?: string;
          slug?: string;
          description_ar?: string | null;
          room_number?: string | null;
          icon_name?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      church_meetings: {
        Row: {
          id: string;
          name_ar: string;
          slug: string;
          target_age_ar: string;
          patron_saint: string | null;
          motto_verse_ar: string;
          bible_reference: string;
          day_of_week: DayOfWeekEnum;
          start_time: string;
          end_time: string;
          location_hall_ar: string;
          supervising_priest_id: string | null;
          servant_in_charge_ar: string;
          whatsapp_group_link: string | null;
          telegram_channel_link: string | null;
          description_ar: string;
          cover_image_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          meeting_time_ar?: string | null;
          location_room_ar?: string | null;
          supervisor_priest_ar?: string | null;
        };
        Insert: {
          id?: string;
          name_ar: string;
          slug: string;
          target_age_ar: string;
          patron_saint?: string | null;
          motto_verse_ar: string;
          bible_reference: string;
          day_of_week: DayOfWeekEnum;
          start_time: string;
          end_time: string;
          location_hall_ar: string;
          supervising_priest_id?: string | null;
          servant_in_charge_ar: string;
          whatsapp_group_link?: string | null;
          telegram_channel_link?: string | null;
          description_ar: string;
          cover_image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name_ar?: string;
          slug?: string;
          target_age_ar?: string;
          patron_saint?: string | null;
          motto_verse_ar?: string;
          bible_reference?: string;
          day_of_week?: DayOfWeekEnum;
          start_time?: string;
          end_time?: string;
          location_hall_ar?: string;
          supervising_priest_id?: string | null;
          servant_in_charge_ar?: string;
          whatsapp_group_link?: string | null;
          telegram_channel_link?: string | null;
          description_ar?: string;
          cover_image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "church_meetings_supervising_priest_id_fkey";
            columns: ["supervising_priest_id"];
            isOneToOne: false;
            referencedRelation: "clergy";
            referencedColumns: ["id"];
          },
        ];
      };
      schools_academies: {
        Row: {
          id: string;
          name_ar: string;
          slug: string;
          category_type: string;
          curriculum_summary_ar: string;
          academic_stages_count: number;
          registration_open: boolean;
          registration_start_date: string | null;
          registration_deadline: string | null;
          responsible_servant_ar: string;
          study_schedule_ar: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          admission_requirements_ar?: string | null;
          duration_ar?: string | null;
          description_ar?: string | null;
          schedule_ar?: string | null;
        };
        Insert: {
          id?: string;
          name_ar: string;
          slug: string;
          category_type: string;
          curriculum_summary_ar: string;
          academic_stages_count?: number;
          registration_open?: boolean;
          registration_start_date?: string | null;
          registration_deadline?: string | null;
          responsible_servant_ar: string;
          study_schedule_ar: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name_ar?: string;
          slug?: string;
          category_type?: string;
          curriculum_summary_ar?: string;
          academic_stages_count?: number;
          registration_open?: boolean;
          registration_start_date?: string | null;
          registration_deadline?: string | null;
          responsible_servant_ar?: string;
          study_schedule_ar?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          name_ar: string;
          slug: string;
          category: string;
          description_ar: string;
          target_audience_ar: string;
          schedule_text_ar: string;
          location_ar: string;
          responsible_servant_ar: string;
          whatsapp_link: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          schedule_ar?: string | null;
          target_age_ar?: string | null;
        };
        Insert: {
          id?: string;
          name_ar: string;
          slug: string;
          category: string;
          description_ar: string;
          target_audience_ar: string;
          schedule_text_ar: string;
          location_ar: string;
          responsible_servant_ar: string;
          whatsapp_link?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name_ar?: string;
          slug?: string;
          category?: string;
          description_ar?: string;
          target_audience_ar?: string;
          schedule_text_ar?: string;
          location_ar?: string;
          responsible_servant_ar?: string;
          whatsapp_link?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      public_services: {
        Row: {
          id: string;
          name_ar: string;
          slug: string;
          service_type: string;
          description_ar: string;
          working_hours_ar: string;
          location_ar: string;
          contact_phone: string | null;
          contact_whatsapp: string | null;
          guidelines_ar: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          operating_hours_ar?: string | null;
        };
        Insert: {
          id?: string;
          name_ar: string;
          slug: string;
          service_type: string;
          description_ar: string;
          working_hours_ar: string;
          location_ar: string;
          contact_phone?: string | null;
          contact_whatsapp?: string | null;
          guidelines_ar?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name_ar?: string;
          slug?: string;
          service_type?: string;
          description_ar?: string;
          working_hours_ar?: string;
          location_ar?: string;
          contact_phone?: string | null;
          contact_whatsapp?: string | null;
          guidelines_ar?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      condolence_bookings: {
        Row: {
          id: string;
          booking_reference_code: string;
          deceased_full_name: string;
          applicant_name: string;
          applicant_phone: string;
          applicant_national_id: string | null;
          relationship_to_deceased: string;
          event_date: string;
          slot_time: string;
          hall_name: string;
          special_requests: string | null;
          status: BookingStatusEnum;
          rejection_reason: string | null;
          approved_by_priest_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_reference_code: string;
          deceased_full_name: string;
          applicant_name: string;
          applicant_phone: string;
          applicant_national_id?: string | null;
          relationship_to_deceased: string;
          event_date: string;
          slot_time?: string;
          hall_name?: string;
          special_requests?: string | null;
          status?: BookingStatusEnum;
          rejection_reason?: string | null;
          approved_by_priest_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_reference_code?: string;
          deceased_full_name?: string;
          applicant_name?: string;
          applicant_phone?: string;
          applicant_national_id?: string | null;
          relationship_to_deceased?: string;
          event_date?: string;
          slot_time?: string;
          hall_name?: string;
          special_requests?: string | null;
          status?: BookingStatusEnum;
          rejection_reason?: string | null;
          approved_by_priest_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "condolence_bookings_approved_by_priest_id_fkey";
            columns: ["approved_by_priest_id"];
            isOneToOne: false;
            referencedRelation: "clergy";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          id: string;
          sender_name: string;
          sender_phone: string;
          sender_email: string | null;
          urgency: ContactUrgencyEnum;
          assigned_priest_id: string | null;
          message_content: string;
          is_read: boolean;
          admin_response_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_name: string;
          sender_phone: string;
          sender_email?: string | null;
          urgency?: ContactUrgencyEnum;
          assigned_priest_id?: string | null;
          message_content: string;
          is_read?: boolean;
          admin_response_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_name?: string;
          sender_phone?: string;
          sender_email?: string | null;
          urgency?: ContactUrgencyEnum;
          assigned_priest_id?: string | null;
          message_content?: string;
          is_read?: boolean;
          admin_response_notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_messages_assigned_priest_id_fkey";
            columns: ["assigned_priest_id"];
            isOneToOne: false;
            referencedRelation: "clergy";
            referencedColumns: ["id"];
          },
        ];
      };
      news_articles: {
        Row: {
          id: string;
          title_ar: string;
          slug: string;
          excerpt_ar: string;
          body_markdown_ar: string;
          featured_image_url: string | null;
          category: string;
          is_published: boolean;
          published_at: string;
          author_name: string;
          created_at: string;
          updated_at: string;
          summary_ar?: string | null;
        };
        Insert: {
          id?: string;
          title_ar: string;
          slug: string;
          excerpt_ar: string;
          body_markdown_ar: string;
          featured_image_url?: string | null;
          category?: string;
          is_published?: boolean;
          published_at?: string;
          author_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title_ar?: string;
          slug?: string;
          excerpt_ar?: string;
          body_markdown_ar?: string;
          featured_image_url?: string | null;
          category?: string;
          is_published?: boolean;
          published_at?: string;
          author_name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      donation_accounts: {
        Row: {
          id: string;
          bank_name_ar: string;
          bank_name_en: string;
          account_title_ar: string;
          account_number: string;
          iban_number: string;
          swift_code: string;
          purpose_category_ar: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          bank_name_ar: string;
          bank_name_en: string;
          account_title_ar: string;
          account_number: string;
          iban_number: string;
          swift_code: string;
          purpose_category_ar: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          bank_name_ar?: string;
          bank_name_en?: string;
          account_title_ar?: string;
          account_number?: string;
          iban_number?: string;
          swift_code?: string;
          purpose_category_ar?: string;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      mass_exceptions: {
        Row: {
          id: string;
          exception_date: string;
          altar_id: string | null;
          original_schedule_id: string | null;
          action: ExceptionActionEnum;
          title_ar: string;
          start_time: string | null;
          end_time: string | null;
          notes_ar: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exception_date: string;
          altar_id?: string | null;
          original_schedule_id?: string | null;
          action?: ExceptionActionEnum;
          title_ar: string;
          start_time?: string | null;
          end_time?: string | null;
          notes_ar?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exception_date?: string;
          altar_id?: string | null;
          original_schedule_id?: string | null;
          action?: ExceptionActionEnum;
          title_ar?: string;
          start_time?: string | null;
          end_time?: string | null;
          notes_ar?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mass_exceptions_altar_id_fkey";
            columns: ["altar_id"];
            isOneToOne: false;
            referencedRelation: "altars";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mass_exceptions_original_schedule_id_fkey";
            columns: ["original_schedule_id"];
            isOneToOne: false;
            referencedRelation: "mass_schedules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mass_exceptions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      site_alerts: {
        Row: {
          id: string;
          message_ar: string;
          severity: AlertSeverityEnum;
          placement: string;
          starts_at: string;
          ends_at: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_ar: string;
          severity?: AlertSeverityEnum;
          placement?: string;
          starts_at?: string;
          ends_at?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_ar?: string;
          severity?: AlertSeverityEnum;
          placement?: string;
          starts_at?: string;
          ends_at?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_alerts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      stream_events: {
        Row: {
          id: string;
          title_ar: string;
          platform: string;
          stream_url: string;
          starts_at: string;
          ends_at: string | null;
          status: StreamStatusEnum;
          is_archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title_ar: string;
          platform?: string;
          stream_url: string;
          starts_at: string;
          ends_at?: string | null;
          status?: StreamStatusEnum;
          is_archived?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title_ar?: string;
          platform?: string;
          stream_url?: string;
          starts_at?: string;
          ends_at?: string | null;
          status?: StreamStatusEnum;
          is_archived?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      program_applications: {
        Row: {
          id: string;
          program_slug: string;
          applicant_name: string;
          applicant_birth_date: string | null;
          applicant_stage_ar: string | null;
          guardian_name: string | null;
          guardian_phone: string;
          confession_father_ar: string | null;
          requested_level_ar: string | null;
          notes_ar: string | null;
          status: ApplicationStatusEnum;
          admin_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          program_slug: string;
          applicant_name: string;
          applicant_birth_date?: string | null;
          applicant_stage_ar?: string | null;
          guardian_name?: string | null;
          guardian_phone: string;
          confession_father_ar?: string | null;
          requested_level_ar?: string | null;
          notes_ar?: string | null;
          status?: ApplicationStatusEnum;
          admin_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          program_slug?: string;
          applicant_name?: string;
          applicant_birth_date?: string | null;
          applicant_stage_ar?: string | null;
          guardian_name?: string | null;
          guardian_phone?: string;
          confession_father_ar?: string | null;
          requested_level_ar?: string | null;
          notes_ar?: string | null;
          status?: ApplicationStatusEnum;
          admin_notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      job_applications: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string | null;
          profession_ar: string;
          experience_years: number | null;
          cv_url: string | null;
          notes_ar: string | null;
          status: ApplicationStatusEnum;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone: string;
          email?: string | null;
          profession_ar: string;
          experience_years?: number | null;
          cv_url?: string | null;
          notes_ar?: string | null;
          status?: ApplicationStatusEnum;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string;
          email?: string | null;
          profession_ar?: string;
          experience_years?: number | null;
          cv_url?: string | null;
          notes_ar?: string | null;
          status?: ApplicationStatusEnum;
          created_at?: string;
        };
        Relationships: [];
      };
      clinic_alert_subscriptions: {
        Row: {
          id: string;
          phone: string;
          specialty_id: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          specialty_id: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          specialty_id?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clinic_alert_subscriptions_specialty_id_fkey";
            columns: ["specialty_id"];
            isOneToOne: false;
            referencedRelation: "clinic_specialties";
            referencedColumns: ["id"];
          },
        ];
      };
      bible_books: {
        Row: {
          id: string;
          canonical_order: number;
          name_ar: string;
          name_en: string | null;
          testament: "old" | "new";
          is_deuterocanonical: boolean;
          chapters_count: number;
          slug: string;
        };
        Insert: {
          id?: string;
          canonical_order: number;
          name_ar: string;
          name_en?: string | null;
          testament: "old" | "new";
          is_deuterocanonical?: boolean;
          chapters_count: number;
          slug: string;
        };
        Update: {
          id?: string;
          canonical_order?: number;
          name_ar?: string;
          name_en?: string | null;
          testament?: "old" | "new";
          is_deuterocanonical?: boolean;
          chapters_count?: number;
          slug?: string;
        };
        Relationships: [];
      };
      bible_verses: {
        Row: {
          id: string;
          book_id: string;
          chapter: number;
          verse: number;
          text_ar: string;
          text_normalized: string | null;
        };
        Insert: {
          id?: string;
          book_id: string;
          chapter: number;
          verse: number;
          text_ar: string;
          text_normalized?: string | null;
        };
        Update: {
          id?: string;
          book_id?: string;
          chapter?: number;
          verse?: number;
          text_ar?: string;
          text_normalized?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bible_verses_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "bible_books";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      track_condolence_booking: {
        Args: {
          p_ref: string;
        };
        Returns: {
          booking_reference_code: string;
          event_date: string;
          slot_time: string;
          hall_name: string;
          status: BookingStatusEnum;
          rejection_reason: string | null;
        }[];
      };
      search_bible: {
        Args: {
          query: string;
          limit_count?: number;
        };
        Returns: {
          book_slug: string;
          book_name: string;
          chapter: number;
          verse: number;
          text_ar: string;
        }[];
      };
      is_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      normalize_arabic: {
        Args: {
          txt: string;
        };
        Returns: string;
      };
    };
    Enums: {
      day_of_week_enum: DayOfWeekEnum;
      booking_status_enum: BookingStatusEnum;
      education_level_enum: EducationLevelEnum;
      contact_urgency_enum: ContactUrgencyEnum;
      staff_role_enum: StaffRoleEnum;
      exception_action_enum: ExceptionActionEnum;
      alert_severity_enum: AlertSeverityEnum;
      stream_status_enum: StreamStatusEnum;
      application_status_enum: ApplicationStatusEnum;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

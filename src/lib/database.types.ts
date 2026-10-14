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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      archivos: {
        Row: {
          categoria: string
          created_at: string
          id: string
          mime: string | null
          nombre: string
          obra_id: string
          storage_path: string
          subido_por: string | null
          tamano: number | null
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          mime?: string | null
          nombre: string
          obra_id: string
          storage_path: string
          subido_por?: string | null
          tamano?: number | null
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          mime?: string | null
          nombre?: string
          obra_id?: string
          storage_path?: string
          subido_por?: string | null
          tamano?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "archivos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archivos_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          dni_cuit: string | null
          domicilio: string | null
          email: string | null
          id: string
          nombre: string
          notas: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dni_cuit?: string | null
          domicilio?: string | null
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dni_cuit?: string | null
          domicilio?: string | null
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cronograma_etapas: {
        Row: {
          clave: boolean
          cronograma_id: string
          fin: string
          id: string
          inicio: string
          nombre: string
          orden: number
        }
        Insert: {
          clave?: boolean
          cronograma_id: string
          fin: string
          id?: string
          inicio: string
          nombre: string
          orden?: number
        }
        Update: {
          clave?: boolean
          cronograma_id?: string
          fin?: string
          id?: string
          inicio?: string
          nombre?: string
          orden?: number
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_etapas_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "cronogramas"
            referencedColumns: ["id"]
          },
        ]
      }
      cronogramas: {
        Row: {
          created_at: string
          id: string
          obra_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          obra_id: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          obra_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cronogramas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_versiones: {
        Row: {
          bloques: Json
          contenido: Json
          created_at: string
          created_by: string | null
          datos: Json
          documento_id: string
          id: string
          nota: string | null
          numero: number
        }
        Insert: {
          bloques: Json
          contenido: Json
          created_at?: string
          created_by?: string | null
          datos: Json
          documento_id: string
          id?: string
          nota?: string | null
          numero: number
        }
        Update: {
          bloques?: Json
          contenido?: Json
          created_at?: string
          created_by?: string | null
          datos?: Json
          documento_id?: string
          id?: string
          nota?: string | null
          numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "documento_versiones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_versiones_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          contenido: Json
          created_at: string
          created_by: string | null
          datos: Json
          id: string
          obra_id: string
          tipo: string
          titulo: string
          updated_at: string
          version_actual: number
        }
        Insert: {
          contenido: Json
          created_at?: string
          created_by?: string | null
          datos?: Json
          id?: string
          obra_id: string
          tipo: string
          titulo: string
          updated_at?: string
          version_actual?: number
        }
        Update: {
          contenido?: Json
          created_at?: string
          created_by?: string | null
          datos?: Json
          id?: string
          obra_id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          version_actual?: number
        }
        Relationships: [
          {
            foreignKeyName: "documentos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_colaboradores: {
        Row: {
          contacto: string | null
          id: string
          nombre: string | null
          obra_id: string
          orden: number
          rol: string | null
          staff_id: string | null
        }
        Insert: {
          contacto?: string | null
          id?: string
          nombre?: string | null
          obra_id: string
          orden?: number
          rol?: string | null
          staff_id?: string | null
        }
        Update: {
          contacto?: string | null
          id?: string
          nombre?: string | null
          obra_id?: string
          orden?: number
          rol?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obra_colaboradores_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obra_colaboradores_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_especialidades: {
        Row: {
          contacto: string | null
          especialidad: string
          id: string
          obra_id: string
          orden: number
          responsable: string | null
        }
        Insert: {
          contacto?: string | null
          especialidad: string
          id?: string
          obra_id: string
          orden?: number
          responsable?: string | null
        }
        Update: {
          contacto?: string | null
          especialidad?: string
          id?: string
          obra_id?: string
          orden?: number
          responsable?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obra_especialidades_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_sectores: {
        Row: {
          id: string
          nombre: string
          obra_id: string
          orden: number
          sup_cubierta: number | null
          sup_descubierta: number | null
          sup_semicubierta: number | null
        }
        Insert: {
          id?: string
          nombre: string
          obra_id: string
          orden?: number
          sup_cubierta?: number | null
          sup_descubierta?: number | null
          sup_semicubierta?: number | null
        }
        Update: {
          id?: string
          nombre?: string
          obra_id?: string
          orden?: number
          sup_cubierta?: number | null
          sup_descubierta?: number | null
          sup_semicubierta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "obra_sectores_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          asistente_paso: number
          borrador: boolean
          cliente_id: string | null
          created_at: string
          created_by: string | null
          direccion: string | null
          estado: string
          id: string
          localidad: string | null
          notas: string | null
          obra_duracion_meses: number | null
          obra_inicio: string | null
          provincia: string | null
          proyecto_duracion_meses: number | null
          proyecto_inicio: string | null
          servicios: string[]
          sup_cubierta: number | null
          sup_descubierta: number | null
          sup_semicubierta: number | null
          tipologia: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          asistente_paso?: number
          borrador?: boolean
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          estado?: string
          id?: string
          localidad?: string | null
          notas?: string | null
          obra_duracion_meses?: number | null
          obra_inicio?: string | null
          provincia?: string | null
          proyecto_duracion_meses?: number | null
          proyecto_inicio?: string | null
          servicios?: string[]
          sup_cubierta?: number | null
          sup_descubierta?: number | null
          sup_semicubierta?: number | null
          tipologia?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          asistente_paso?: number
          borrador?: boolean
          cliente_id?: string | null
          created_at?: string
          created_by?: string | null
          direccion?: string | null
          estado?: string
          id?: string
          localidad?: string | null
          notas?: string | null
          obra_duracion_meses?: number | null
          obra_inicio?: string | null
          provincia?: string | null
          proyecto_duracion_meses?: number | null
          proyecto_inicio?: string | null
          servicios?: string[]
          sup_cubierta?: number | null
          sup_descubierta?: number | null
          sup_semicubierta?: number | null
          tipologia?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "obras_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      plantillas: {
        Row: {
          clave: string
          contenido: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          clave: string
          contenido: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          clave?: string
          contenido?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plantillas_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          cover: string | null
          created_at: string
          credits: Json | null
          id: string
          images: string[] | null
          location: string | null
          m2: number | null
          order: number
          slug: string
          status: string | null
          title: string
          videos: string[] | null
          visible: boolean | null
          year: number | null
        }
        Insert: {
          cover?: string | null
          created_at?: string
          credits?: Json | null
          id?: string
          images?: string[] | null
          location?: string | null
          m2?: number | null
          order?: number
          slug: string
          status?: string | null
          title: string
          videos?: string[] | null
          visible?: boolean | null
          year?: number | null
        }
        Update: {
          cover?: string | null
          created_at?: string
          credits?: Json | null
          id?: string
          images?: string[] | null
          location?: string | null
          m2?: number | null
          order?: number
          slug?: string
          status?: string | null
          title?: string
          videos?: string[] | null
          visible?: boolean | null
          year?: number | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          activo: boolean
          created_at: string
          email: string | null
          id: string
          nombre: string
          rol: string
          usuario: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email?: string | null
          id: string
          nombre: string
          rol?: string
          usuario: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string
          rol?: string
          usuario?: string
        }
        Relationships: []
      }
      tarea_eventos: {
        Row: {
          actor_id: string | null
          created_at: string
          detalle: string | null
          id: string
          tarea_id: string
          tipo: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          detalle?: string | null
          id?: string
          tarea_id: string
          tipo: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          detalle?: string | null
          id?: string
          tarea_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarea_eventos_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarea_eventos_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas: {
        Row: {
          aprobada_at: string | null
          aprobada_por: string | null
          checklist: Json
          comentario_cierre: string | null
          completada_at: string | null
          completada_por: string | null
          created_at: string
          created_by: string | null
          cronograma_etapa_id: string | null
          descripcion: string | null
          estado: string
          evidencia: string | null
          fecha: string | null
          horas_reales: number | null
          id: string
          obra_id: string | null
          responsable_id: string | null
          revisor_id: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          aprobada_at?: string | null
          aprobada_por?: string | null
          checklist?: Json
          comentario_cierre?: string | null
          completada_at?: string | null
          completada_por?: string | null
          created_at?: string
          created_by?: string | null
          cronograma_etapa_id?: string | null
          descripcion?: string | null
          estado?: string
          evidencia?: string | null
          fecha?: string | null
          horas_reales?: number | null
          id?: string
          obra_id?: string | null
          responsable_id?: string | null
          revisor_id?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          aprobada_at?: string | null
          aprobada_por?: string | null
          checklist?: Json
          comentario_cierre?: string | null
          completada_at?: string | null
          completada_por?: string | null
          created_at?: string
          created_by?: string | null
          cronograma_etapa_id?: string | null
          descripcion?: string | null
          estado?: string
          evidencia?: string | null
          fecha?: string | null
          horas_reales?: number | null
          id?: string
          obra_id?: string | null
          responsable_id?: string | null
          revisor_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_aprobada_por_fkey"
            columns: ["aprobada_por"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_completada_por_fkey"
            columns: ["completada_por"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_cronograma_etapa_id_fkey"
            columns: ["cronograma_etapa_id"]
            isOneToOne: false
            referencedRelation: "cronograma_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_revisor_id_fkey"
            columns: ["revisor_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      visor_links: {
        Row: {
          archivo_id: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          signed_url: string
          token: string
        }
        Insert: {
          archivo_id: string
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          signed_url: string
          token?: string
        }
        Update: {
          archivo_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          signed_url?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "visor_links_archivo_id_fkey"
            columns: ["archivo_id"]
            isOneToOne: false
            referencedRelation: "archivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visor_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      crear_version_documento: {
        Args: {
          p_bloques: Json
          p_contenido: Json
          p_datos: Json
          p_documento_id: string
          p_nota?: string
        }
        Returns: number
      }
      guardar_cronograma: {
        Args: { p_etapas: Json; p_obra_id: string; p_tipo: string }
        Returns: string
      }
      is_staff: { Args: never; Returns: boolean }
      reemplazar_listas_obra: {
        Args: {
          p_colaboradores?: Json
          p_especialidades?: Json
          p_obra_id: string
          p_sectores?: Json
        }
        Returns: undefined
      }
      visor_compartido: {
        Args: { p_token: string }
        Returns: {
          expires_at: string
          nombre: string
          obra: string
          signed_url: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

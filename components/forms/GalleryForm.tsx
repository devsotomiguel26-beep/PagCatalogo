'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Category {
  id: string;
  name: string;
}

interface GalleryFormData {
  title: string;
  slug: string;
  category_id: string;
  event_type: string;
  tournament: string;
  event_date: string;
  location: string;
  status: string;
  watermark_path?: string | null;
}

interface GalleryFormProps {
  initialData?: Partial<GalleryFormData>;
  onSubmit: (data: GalleryFormData, watermarkFile?: File | null) => Promise<void>;
  submitLabel?: string;
  isSubmitting?: boolean;
  galleryId?: string; // Para preview de watermark existente
}

export default function GalleryForm({
  initialData,
  onSubmit,
  submitLabel = 'Guardar',
  isSubmitting = false,
  galleryId,
}: GalleryFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<GalleryFormData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    category_id: initialData?.category_id || '',
    event_type: initialData?.event_type || 'partido',
    tournament: initialData?.tournament || '',
    event_date: initialData?.event_date || '',
    location: initialData?.location || '',
    status: initialData?.status || 'draft',
    watermark_path: initialData?.watermark_path || null,
  });

  // Estados para manejo de marca de agua personalizada
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [watermarkPreview, setWatermarkPreview] = useState<string | null>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  const eventTypes = [
    { value: 'partido', label: 'Partido' },
    { value: 'torneo', label: 'Torneo' },
    { value: 'evento', label: 'Evento especial' },
    { value: 'entrenamiento', label: 'Entrenamiento' },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Cargar preview de watermark existente
    if (initialData?.watermark_path && galleryId) {
      const { data: urlData } = supabase.storage
        .from('gallery-images')
        .getPublicUrl(initialData.watermark_path);

      setWatermarkPreview(urlData.publicUrl);
    }
  }, [initialData?.watermark_path, galleryId]);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');

    if (!error && data) {
      setCategories(data);
      // Si no hay categoría seleccionada y hay categorías disponibles, seleccionar la primera
      if (!formData.category_id && data.length > 0) {
        setFormData((prev) => ({ ...prev, category_id: data[0].id }));
      }
    }
  }

  // Generar slug automáticamente desde el título
  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guiones
      .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newTitle = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title: newTitle,
      // Solo autogenerar slug si está vacío o si estamos creando (no hay initialData)
      slug: !initialData?.slug ? generateSlug(newTitle) : prev.slug,
    }));
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleWatermarkSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validar que sea PNG
    if (!file.type.includes('png')) {
      alert('Solo se permiten archivos PNG con transparencia');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 5MB.');
      return;
    }

    setWatermarkFile(file);
    setWatermarkPreview(URL.createObjectURL(file));
  }

  function removeCustomWatermark() {
    if (!confirm('¿Eliminar la marca de agua personalizada? Se usará la marca global.')) {
      return;
    }

    setWatermarkFile(null);
    setWatermarkPreview(null);
    setFormData((prev) => ({ ...prev, watermark_path: null }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(formData, watermarkFile);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          value={formData.title}
          onChange={handleTitleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
          placeholder="Ej: Partido Sub-10 vs Colo Colo"
        />
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
          Slug (URL amigable) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          required
          value={formData.slug}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 font-mono text-sm"
          placeholder="partido-sub-10-vs-colo-colo"
        />
        <p className="mt-1 text-xs text-gray-500">
          Este será la URL: /galerias/{formData.slug || 'tu-slug'}
        </p>
      </div>

      {/* Grid de 2 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categoría */}
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
            Categoría <span className="text-red-500">*</span>
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            value={formData.category_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Seleccionar categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de evento */}
        <div>
          <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Evento <span className="text-red-500">*</span>
          </label>
          <select
            id="event_type"
            name="event_type"
            required
            value={formData.event_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
          >
            {eventTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha del evento */}
        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha del Evento <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="event_date"
            name="event_date"
            required
            value={formData.event_date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Estado */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Estado <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            name="status"
            required
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
          >
            <option value="draft">Borrador (no visible)</option>
            <option value="published">Publicado (visible)</option>
          </select>
        </div>
      </div>

      {/* Torneo/Evento (opcional) */}
      <div>
        <label htmlFor="tournament" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre del Torneo/Evento (opcional)
        </label>
        <input
          type="text"
          id="tournament"
          name="tournament"
          value={formData.tournament}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
          placeholder="Ej: Copa Primavera 2024"
        />
      </div>

      {/* Lugar (opcional) */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Lugar (opcional)
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
          placeholder="Ej: Estadio Municipal de Puente Alto"
        />
      </div>

      {/* Marca de Agua Personalizada (opcional) */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Marca de Agua Personalizada (Opcional)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Si no subes una marca de agua personalizada, se usará la marca de agua global del club.
        </p>

        <div className="space-y-4">
          {/* Preview actual */}
          {watermarkPreview && (
            <div className="relative inline-block">
              <img
                src={watermarkPreview}
                alt="Marca de agua personalizada"
                className="h-32 w-auto border border-gray-300 rounded bg-gray-100 p-2"
              />
              <button
                type="button"
                onClick={removeCustomWatermark}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Botón para subir */}
          <div>
            <input
              ref={watermarkInputRef}
              type="file"
              accept="image/png"
              onChange={handleWatermarkSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => watermarkInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg className="mr-2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {watermarkPreview ? 'Cambiar marca de agua' : 'Subir marca de agua'}
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Solo PNG con transparencia. Máximo 5MB. Recomendado: 1000-2000px de ancho.
            </p>
          </div>
        </div>
      </div>

      {/* Botón Submit */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

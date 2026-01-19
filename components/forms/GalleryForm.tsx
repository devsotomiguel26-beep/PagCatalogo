'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Category {
  id: string;
  name: string;
}

interface Photographer {
  id: string;
  name: string;
  active: boolean;
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
  photographer_id?: string | null;
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
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
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
    photographer_id: initialData?.photographer_id || null,
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
    fetchPhotographers();
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

  async function fetchPhotographers() {
    const { data, error } = await supabase
      .from('photographers')
      .select('id, name, active')
      .eq('active', true)
      .order('name');

    if (!error && data) {
      setPhotographers(data);
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
    // Convertir string vacío a null para photographer_id
    const finalValue = name === 'photographer_id' && value === '' ? null : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
          Título de la Galería <span className="text-devil-600">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleTitleChange}
            className="w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-devil-600 focus:border-devil-600 transition-colors placeholder:text-gray-400"
            placeholder="Ej: Partido Sub-10 vs Colo Colo"
          />
        </div>
      </div>

      {/* Slug */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-900 mb-2">
          URL Personalizada <span className="text-devil-600">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <input
            type="text"
            id="slug"
            name="slug"
            required
            value={formData.slug}
            onChange={handleChange}
            className="w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-devil-600 focus:border-devil-600 transition-colors font-mono text-sm placeholder:text-gray-400"
            placeholder="partido-sub-10-vs-colo-colo"
          />
        </div>
        {/* Preview del slug más visible */}
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">Vista previa de la URL:</span>
          </p>
          <p className="mt-1 font-mono text-sm text-devil-600 break-all">
            https://fotos.diablosrojoscl.com/galerias/{formData.slug || 'tu-slug'}
          </p>
        </div>
      </div>

      {/* Grid de 2 columnas para campos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categoría */}
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-900 mb-2">
            Categoría <span className="text-devil-600">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <select
              id="category_id"
              name="category_id"
              required
              value={formData.category_id}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-devil-600 focus:border-devil-600 transition-colors appearance-none cursor-pointer"
            >
              <option value="" className="text-gray-400">Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="text-gray-900">
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            💡 Selecciona "Todas" para eventos que incluyen múltiples categorías
          </p>
        </div>

        {/* Tipo de evento */}
        <div>
          <label htmlFor="event_type" className="block text-sm font-medium text-gray-900 mb-2">
            Tipo de Evento <span className="text-devil-600">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <select
              id="event_type"
              name="event_type"
              required
              value={formData.event_type}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-devil-600 focus:border-devil-600 transition-colors appearance-none cursor-pointer"
            >
              {eventTypes.map((type) => (
                <option key={type.value} value={type.value} className="text-gray-900">
                  {type.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Fotógrafo asignado */}
        <div>
          <label htmlFor="photographer_id" className="block text-sm font-medium text-gray-900 mb-2">
            Fotógrafo Asignado <span className="text-gray-400">(opcional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <select
              id="photographer_id"
              name="photographer_id"
              value={formData.photographer_id || ''}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-devil-600 focus:border-devil-600 transition-colors appearance-none cursor-pointer"
            >
              <option value="" className="text-gray-600">Sin asignar (Director)</option>
              {photographers.map((photographer) => (
                <option key={photographer.id} value={photographer.id} className="text-gray-900">
                  {photographer.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            💡 Selecciona el fotógrafo que tomó las fotos de este evento. Las ganancias se asignarán automáticamente.
          </p>
        </div>

        {/* Fecha del evento */}
        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-gray-900 mb-2">
            Fecha del Evento <span className="text-devil-600">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              type="date"
              id="event_date"
              name="event_date"
              required
              value={formData.event_date}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-devil-600 focus:border-devil-600 transition-colors"
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-900 mb-2">
            Estado de Publicación <span className="text-devil-600">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <select
              id="status"
              name="status"
              required
              value={formData.status}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-devil-600 focus:border-devil-600 transition-colors appearance-none cursor-pointer"
            >
              <option value="draft" className="text-gray-900">📝 Borrador (no visible al público)</option>
              <option value="published" className="text-gray-900">✅ Publicado (visible al público)</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Campos opcionales - Grid completo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Torneo/Evento (opcional) */}
        <div>
          <label htmlFor="tournament" className="block text-sm font-medium text-gray-900 mb-2">
            Nombre del Torneo/Evento <span className="text-gray-400">(opcional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <input
              type="text"
              id="tournament"
              name="tournament"
              value={formData.tournament}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-devil-600 focus:border-devil-600 transition-colors placeholder:text-gray-400"
              placeholder="Ej: Copa Primavera 2024"
            />
          </div>
        </div>

        {/* Lugar (opcional) */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-900 mb-2">
            Lugar <span className="text-gray-400">(opcional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-devil-600 focus:border-devil-600 transition-colors placeholder:text-gray-400"
              placeholder="Ej: Estadio Municipal de Puente Alto"
            />
          </div>
        </div>
      </div>

      {/* Marca de Agua Personalizada (opcional) */}
      <div className="border-t border-gray-200 pt-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Marca de Agua Personalizada (Opcional)
              </h3>
              <p className="text-sm text-blue-700">
                Si no subes una marca, se usará el logo oficial de Diablos Rojos. Sube una marca personalizada solo si este evento tiene un sponsor o logo especial.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Preview actual */}
          {watermarkPreview && (
            <div className="relative inline-block">
              <div className="border-2 border-gray-300 rounded-lg bg-gray-50 p-4">
                <img
                  src={watermarkPreview}
                  alt="Marca de agua personalizada"
                  className="h-32 w-auto"
                />
              </div>
              <button
                type="button"
                onClick={removeCustomWatermark}
                className="absolute -top-2 -right-2 bg-devil-600 text-white rounded-full p-2 hover:bg-devil-700 shadow-lg transition-all hover:scale-110"
                title="Eliminar marca de agua"
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
              className="inline-flex items-center px-5 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-devil-600 transition-all"
            >
              <svg className="mr-2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {watermarkPreview ? 'Cambiar marca de agua' : 'Subir marca de agua personalizada'}
            </button>
            <p className="mt-2 text-xs text-gray-500">
              📄 Solo PNG con transparencia • 📦 Máximo 5MB • 📐 Recomendado: 1000-2000px de ancho
            </p>
          </div>
        </div>
      </div>

      {/* Botón Submit - Más prominente */}
      <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
        <p className="text-sm text-gray-500">
          Los campos con <span className="text-devil-600 font-semibold">*</span> son obligatorios
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-8 py-4 bg-devil-600 text-white font-semibold text-base rounded-lg hover:bg-devil-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-devil-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </>
          ) : (
            <>
              {submitLabel}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

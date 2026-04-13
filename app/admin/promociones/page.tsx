'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  type: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  fixed_price_per_photo: number | null;
  scope: string;
  scope_gallery_id: string | null;
  scope_category_id: string | null;
  scope_event_type: string | null;
  min_photos: number;
  max_uses: number | null;
  current_uses: number;
  requires_code: boolean;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  priority: number;
  stackable: boolean;
  created_at: string;
  promo_codes: PromoCode[];
  scope_gallery: { id: string; title: string } | null;
  scope_category: { id: string; name: string } | null;
}

interface PromoCode {
  id: string;
  code: string;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
}

interface Gallery {
  id: string;
  title: string;
}

interface Category {
  id: string;
  name: string;
}

const TYPE_LABELS: Record<string, string> = {
  percentage_discount: 'Descuento %',
  fixed_discount: 'Descuento Fijo',
  fixed_price_per_photo: 'Precio Fijo/Foto',
  full_gallery: 'Galería Completa',
};

const SCOPE_LABELS: Record<string, string> = {
  global: 'Global',
  gallery: 'Galería',
  category: 'Categoría',
  event_type: 'Tipo de Evento',
};

const EVENT_TYPES = ['partido', 'torneo', 'evento', 'entrenamiento'];

interface PromoFormData {
  name: string;
  description: string;
  type: string;
  discount_percentage: number | '';
  discount_amount: number | '';
  fixed_price_per_photo: number | '';
  scope: string;
  scope_gallery_id: string;
  scope_category_id: string;
  scope_event_type: string;
  min_photos: number;
  max_uses: number | '';
  requires_code: boolean;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  priority: number;
  stackable: boolean;
  codes: string; // Códigos separados por coma
}

const emptyForm: PromoFormData = {
  name: '',
  description: '',
  type: 'percentage_discount',
  discount_percentage: '',
  discount_amount: '',
  fixed_price_per_photo: '',
  scope: 'global',
  scope_gallery_id: '',
  scope_category_id: '',
  scope_event_type: '',
  min_photos: 1,
  max_uses: '',
  requires_code: false,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: '',
  is_active: true,
  priority: 0,
  stackable: false,
  codes: '',
};

function getPromoStatus(promo: Promotion): { label: string; color: string } {
  if (!promo.is_active) return { label: 'Desactivada', color: 'bg-gray-100 text-gray-600' };
  const now = new Date();
  if (new Date(promo.starts_at) > now) return { label: 'Programada', color: 'bg-blue-100 text-blue-700' };
  if (promo.ends_at && new Date(promo.ends_at) < now) return { label: 'Expirada', color: 'bg-yellow-100 text-yellow-700' };
  if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) return { label: 'Agotada', color: 'bg-orange-100 text-orange-700' };
  return { label: 'Activa', color: 'bg-green-100 text-green-700' };
}

function getDiscountDisplay(promo: Promotion): string {
  switch (promo.type) {
    case 'percentage_discount': return `${promo.discount_percentage}% OFF`;
    case 'fixed_discount': return `-$${(promo.discount_amount || 0).toLocaleString('es-CL')}`;
    case 'fixed_price_per_photo': return `$${(promo.fixed_price_per_photo || 0).toLocaleString('es-CL')}/foto`;
    case 'full_gallery': return `$${(promo.fixed_price_per_photo || 0).toLocaleString('es-CL')}/foto`;
    default: return '-';
  }
}

export default function PromocionesPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoFormData>(emptyForm);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Datos para selects
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filtro
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchPromotions();
    fetchSelectData();
  }, []);

  async function fetchPromotions() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promotions');
      const result = await res.json();
      if (result.success) {
        setPromotions(result.data || []);
      }
    } catch {
      setMessage({ type: 'error', text: 'Error cargando promociones' });
    } finally {
      setLoading(false);
    }
  }

  async function fetchSelectData() {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const [galResult, catResult] = await Promise.all([
        supabase.from('galleries').select('id, title').order('title'),
        supabase.from('categories').select('id, name').order('name'),
      ]);

      if (galResult.data) setGalleries(galResult.data);
      if (catResult.data) setCategories(catResult.data);
    } catch {}
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, starts_at: new Date().toISOString().slice(0, 16) });
    setFormError('');
    setShowModal(true);
  }

  function openEdit(promo: Promotion) {
    setEditingId(promo.id);
    setForm({
      name: promo.name,
      description: promo.description || '',
      type: promo.type,
      discount_percentage: promo.discount_percentage || '',
      discount_amount: promo.discount_amount || '',
      fixed_price_per_photo: promo.fixed_price_per_photo || '',
      scope: promo.scope,
      scope_gallery_id: promo.scope_gallery_id || '',
      scope_category_id: promo.scope_category_id || '',
      scope_event_type: promo.scope_event_type || '',
      min_photos: promo.min_photos,
      max_uses: promo.max_uses || '',
      requires_code: promo.requires_code,
      starts_at: promo.starts_at ? new Date(promo.starts_at).toISOString().slice(0, 16) : '',
      ends_at: promo.ends_at ? new Date(promo.ends_at).toISOString().slice(0, 16) : '',
      is_active: promo.is_active,
      priority: promo.priority,
      stackable: promo.stackable,
      codes: promo.promo_codes?.map(c => c.code).join(', ') || '',
    });
    setFormError('');
    setShowModal(true);
  }

  async function handleSave() {
    setFormSaving(true);
    setFormError('');

    const payload: Record<string, any> = {
      name: form.name,
      description: form.description || null,
      type: form.type,
      discount_percentage: form.type === 'percentage_discount' ? Number(form.discount_percentage) : null,
      discount_amount: form.type === 'fixed_discount' ? Number(form.discount_amount) : null,
      fixed_price_per_photo: ['fixed_price_per_photo', 'full_gallery'].includes(form.type) ? Number(form.fixed_price_per_photo) : null,
      scope: form.scope,
      scope_gallery_id: form.scope === 'gallery' ? form.scope_gallery_id : null,
      scope_category_id: form.scope === 'category' ? form.scope_category_id : null,
      scope_event_type: form.scope === 'event_type' ? form.scope_event_type : null,
      min_photos: form.min_photos || 1,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      requires_code: form.requires_code,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      is_active: form.is_active,
      priority: form.priority,
      stackable: form.stackable,
    };

    // Si es creación y hay códigos, incluirlos
    if (!editingId && form.codes.trim()) {
      payload.codes = form.codes.split(',').map((c: string) => ({
        code: c.trim(),
      })).filter((c: { code: string }) => c.code.length > 0);

      if (payload.codes.length > 0) {
        payload.requires_code = true;
      }
    }

    try {
      const url = editingId
        ? `/api/admin/promotions/${editingId}`
        : '/api/admin/promotions';

      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        setShowModal(false);
        setMessage({ type: 'success', text: editingId ? 'Promoción actualizada' : 'Promoción creada exitosamente' });
        await fetchPromotions();
      } else {
        setFormError(result.error);
      }
    } catch {
      setFormError('Error guardando promoción');
    } finally {
      setFormSaving(false);
    }
  }

  async function handleToggle(promo: Promotion) {
    try {
      const res = await fetch(`/api/admin/promotions/${promo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !promo.is_active }),
      });
      const result = await res.json();
      if (result.success) await fetchPromotions();
      else setMessage({ type: 'error', text: result.error });
    } catch {
      setMessage({ type: 'error', text: 'Error actualizando promoción' });
    }
  }

  async function handleDelete(promo: Promotion) {
    if (!confirm(`¿Eliminar la promoción "${promo.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/promotions/${promo.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        await fetchPromotions();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error eliminando promoción' });
    }
  }

  // Manejo de códigos para promo existente
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [codesPromoId, setCodesPromoId] = useState<string>('');
  const [codesPromoName, setCodesPromoName] = useState<string>('');
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [newCode, setNewCode] = useState('');
  const [codesSaving, setCodesSaving] = useState(false);

  function openCodes(promo: Promotion) {
    setCodesPromoId(promo.id);
    setCodesPromoName(promo.name);
    setPromoCodes(promo.promo_codes || []);
    setNewCode('');
    setShowCodesModal(true);
  }

  async function handleAddCode() {
    if (!newCode.trim()) return;
    setCodesSaving(true);

    try {
      const res = await fetch(`/api/admin/promotions/${codesPromoId}/codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode.trim() }),
      });
      const result = await res.json();
      if (result.success) {
        setPromoCodes([result.data, ...promoCodes]);
        setNewCode('');
        await fetchPromotions();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error creando código' });
    } finally {
      setCodesSaving(false);
    }
  }

  async function handleDeleteCode(codeId: string) {
    try {
      const res = await fetch(`/api/admin/promotions/${codesPromoId}/codes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code_id: codeId }),
      });
      const result = await res.json();
      if (result.success) {
        setPromoCodes(promoCodes.filter(c => c.id !== codeId));
        await fetchPromotions();
      }
    } catch {}
  }

  // Filtrar promociones
  const filteredPromos = promotions.filter(p => {
    if (statusFilter === 'all') return true;
    return getPromoStatus(p).label.toLowerCase() === statusFilter;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
          <span className="ml-3 text-gray-600">Cargando promociones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li><Link href="/admin/dashboard" className="hover:text-red-600">Dashboard</Link></li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Promociones</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promociones</h1>
          <p className="mt-2 text-gray-600">
            Crea ofertas, descuentos temporales y códigos promocionales
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          + Nueva Promoción
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          <div className="flex justify-between items-center">
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {['all', 'activa', 'programada', 'expirada', 'agotada', 'desactivada'].map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === f
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Lista de promociones */}
      {filteredPromos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">
            {statusFilter === 'all' ? 'No hay promociones creadas' : `No hay promociones con estado "${statusFilter}"`}
          </p>
          {statusFilter === 'all' && (
            <button onClick={openCreate} className="text-red-600 font-medium hover:text-red-700">
              Crear primera promoción
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPromos.map((promo) => {
            const status = getPromoStatus(promo);
            return (
              <div key={promo.id} className={`bg-white rounded-lg shadow p-5 border-l-4 ${promo.is_active ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{promo.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {TYPE_LABELS[promo.type]}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {SCOPE_LABELS[promo.scope]}
                        {promo.scope_gallery && `: ${promo.scope_gallery.title}`}
                        {promo.scope_category && `: ${promo.scope_category.name}`}
                        {promo.scope_event_type && `: ${promo.scope_event_type}`}
                      </span>
                    </div>

                    {promo.description && (
                      <p className="text-sm text-gray-600 mb-2">{promo.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="font-semibold text-lg text-gray-900">
                        {getDiscountDisplay(promo)}
                      </span>

                      {promo.min_photos > 1 && (
                        <span>Min: {promo.min_photos} fotos</span>
                      )}

                      <span>
                        Inicio: {new Date(promo.starts_at).toLocaleDateString('es-CL')}
                      </span>

                      {promo.ends_at && (
                        <span>
                          Término: {new Date(promo.ends_at).toLocaleDateString('es-CL')}
                        </span>
                      )}

                      <span>
                        Usos: {promo.current_uses}{promo.max_uses ? `/${promo.max_uses}` : ''}
                      </span>

                      {promo.promo_codes && promo.promo_codes.length > 0 && (
                        <span className="text-blue-600">
                          {promo.promo_codes.length} código{promo.promo_codes.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Mostrar códigos */}
                    {promo.promo_codes && promo.promo_codes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {promo.promo_codes.map(code => (
                          <span
                            key={code.id}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-mono ${
                              code.is_active ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400 line-through'
                            }`}
                          >
                            {code.code}
                            {code.max_uses && (
                              <span className="ml-1 text-gray-400">({code.current_uses}/{code.max_uses})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => openCodes(promo)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1"
                      title="Gestionar códigos"
                    >
                      Códigos
                    </button>
                    <button
                      onClick={() => openEdit(promo)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggle(promo)}
                      className={`text-xs font-medium px-2 py-1 ${promo.is_active ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                    >
                      {promo.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(promo)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Crear/Editar Promoción */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingId ? 'Editar Promoción' : 'Nueva Promoción'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{formError}</div>
            )}

            <div className="space-y-5">
              {/* Nombre y descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Especial Torneo de Verano"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción visible para los clientes"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                />
              </div>

              {/* Tipo de descuento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Descuento *</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                >
                  <option value="percentage_discount">Descuento porcentual (%)</option>
                  <option value="fixed_discount">Descuento fijo (CLP)</option>
                  <option value="fixed_price_per_photo">Precio fijo por foto</option>
                  <option value="full_gallery">Galería completa (precio especial/foto)</option>
                </select>
              </div>

              {/* Valor según tipo */}
              <div>
                {form.type === 'percentage_discount' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje de descuento</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={form.discount_percentage}
                        onChange={e => setForm({ ...form, discount_percentage: parseInt(e.target.value) || '' })}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                )}
                {form.type === 'fixed_discount' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto de descuento (CLP)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        min={1}
                        step={100}
                        value={form.discount_amount}
                        onChange={e => setForm({ ...form, discount_amount: parseInt(e.target.value) || '' })}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                )}
                {(form.type === 'fixed_price_per_photo' || form.type === 'full_gallery') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio por foto (CLP)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={form.fixed_price_per_photo}
                        onChange={e => setForm({ ...form, fixed_price_per_photo: parseInt(e.target.value) || '' })}
                        className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                      />
                      <span className="text-gray-500">/foto</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Alcance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alcance</label>
                <select
                  value={form.scope}
                  onChange={e => setForm({ ...form, scope: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                >
                  <option value="global">Global (todas las galerías)</option>
                  <option value="gallery">Galería específica</option>
                  <option value="category">Categoría</option>
                  <option value="event_type">Tipo de evento</option>
                </select>
              </div>

              {form.scope === 'gallery' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Galería</label>
                  <select
                    value={form.scope_gallery_id}
                    onChange={e => setForm({ ...form, scope_gallery_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  >
                    <option value="">Seleccionar galería...</option>
                    {galleries.map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.scope === 'category' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={form.scope_category_id}
                    onChange={e => setForm({ ...form, scope_category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  >
                    <option value="">Seleccionar categoría...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.scope === 'event_type' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de evento</label>
                  <select
                    value={form.scope_event_type}
                    onChange={e => setForm({ ...form, scope_event_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  >
                    <option value="">Seleccionar tipo...</option>
                    {EVENT_TYPES.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Condiciones */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min. fotos requeridas</label>
                  <input
                    type="number"
                    min={1}
                    value={form.min_photos}
                    onChange={e => setForm({ ...form, min_photos: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máx. usos <span className="text-gray-400">(vacío = ilimitado)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_uses}
                    onChange={e => setForm({ ...form, max_uses: parseInt(e.target.value) || '' })}
                    placeholder="Ilimitado"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  />
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio *</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={e => setForm({ ...form, starts_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha término <span className="text-gray-400">(vacío = sin límite)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={e => setForm({ ...form, ends_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  />
                </div>
              </div>

              {/* Opciones avanzadas */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <input
                    type="number"
                    min={0}
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">Mayor = se aplica primero</p>
                </div>
                <div className="flex items-center pt-6">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="ml-2 text-sm">Activa</span>
                </div>
                <div className="flex items-center pt-6">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, requires_code: !form.requires_code })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.requires_code ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.requires_code ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="ml-2 text-sm">Requiere código</span>
                </div>
              </div>

              {/* Códigos (solo en creación) */}
              {!editingId && form.requires_code && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Códigos promocionales <span className="text-gray-400">(separados por coma)</span>
                  </label>
                  <input
                    type="text"
                    value={form.codes}
                    onChange={e => setForm({ ...form, codes: e.target.value })}
                    placeholder="Ej: VERANO2026, TORNEO50, DESCUENTO10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">Se convertirán a mayúsculas automáticamente</p>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={formSaving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {formSaving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Promoción'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Gestionar Códigos */}
      {showCodesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Códigos Promocionales</h3>
                <p className="text-sm text-gray-500">{codesPromoName}</p>
              </div>
              <button onClick={() => setShowCodesModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Agregar código */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
                placeholder="NUEVO_CODIGO"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
                onKeyDown={e => e.key === 'Enter' && handleAddCode()}
              />
              <button
                onClick={handleAddCode}
                disabled={codesSaving || !newCode.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {codesSaving ? '...' : 'Agregar'}
              </button>
            </div>

            {/* Lista de códigos */}
            {promoCodes.length === 0 ? (
              <p className="text-center text-gray-400 py-4 text-sm">Sin códigos</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {promoCodes.map(code => (
                  <div key={code.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className={`font-mono text-sm ${code.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                        {code.code}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {code.current_uses} uso{code.current_uses !== 1 ? 's' : ''}
                        {code.max_uses && ` / ${code.max_uses}`}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteCode(code.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

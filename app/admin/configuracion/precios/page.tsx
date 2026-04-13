'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PricingConfig {
  id: string;
  base_price_per_photo: number;
  pricing_tiers_enabled: boolean;
  currency: string;
}

interface PricingTier {
  id: string;
  name: string;
  min_photos: number;
  max_photos: number | null;
  price_per_photo: number;
  discount_percentage: number;
  sort_order: number;
  is_active: boolean;
}

interface TierFormData {
  name: string;
  min_photos: number | '';
  max_photos: number | '' | null;
  price_per_photo: number | '';
  discount_percentage: number | '';
  sort_order: number;
  is_active: boolean;
}

const emptyTierForm: TierFormData = {
  name: '',
  min_photos: '',
  max_photos: '',
  price_per_photo: '',
  discount_percentage: '',
  sort_order: 0,
  is_active: true,
};

export default function PreciosPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado del formulario de config global
  const [basePrice, setBasePrice] = useState<number>(2000);
  const [tiersEnabled, setTiersEnabled] = useState<boolean>(true);

  // Estado del modal de tier
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierForm, setTierForm] = useState<TierFormData>(emptyTierForm);
  const [tierSaving, setTierSaving] = useState(false);
  const [tierError, setTierError] = useState('');

  useEffect(() => {
    fetchPricingData();
  }, []);

  async function fetchPricingData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pricing');
      const result = await res.json();

      if (result.success) {
        setConfig(result.data.config);
        setTiers(result.data.tiers);
        setBasePrice(result.data.config.base_price_per_photo);
        setTiersEnabled(result.data.config.pricing_tiers_enabled);
      } else {
        setMessage({ type: 'error', text: result.error || 'Error cargando datos' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error conectando con el servidor' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveConfig() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base_price_per_photo: basePrice,
          pricing_tiers_enabled: tiersEnabled,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setConfig(result.data);
        setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error guardando configuración' });
    } finally {
      setSaving(false);
    }
  }

  function openCreateTier() {
    setEditingTierId(null);
    setTierForm({
      ...emptyTierForm,
      sort_order: tiers.length,
    });
    setTierError('');
    setShowTierModal(true);
  }

  function openEditTier(tier: PricingTier) {
    setEditingTierId(tier.id);
    setTierForm({
      name: tier.name,
      min_photos: tier.min_photos,
      max_photos: tier.max_photos,
      price_per_photo: tier.price_per_photo,
      discount_percentage: tier.discount_percentage,
      sort_order: tier.sort_order,
      is_active: tier.is_active,
    });
    setTierError('');
    setShowTierModal(true);
  }

  async function handleSaveTier() {
    setTierSaving(true);
    setTierError('');

    const payload = {
      ...(editingTierId ? { id: editingTierId } : {}),
      name: tierForm.name,
      min_photos: Number(tierForm.min_photos),
      max_photos: tierForm.max_photos === '' || tierForm.max_photos === null ? null : Number(tierForm.max_photos),
      price_per_photo: Number(tierForm.price_per_photo),
      discount_percentage: Number(tierForm.discount_percentage) || 0,
      sort_order: tierForm.sort_order,
      is_active: tierForm.is_active,
    };

    try {
      const res = await fetch('/api/admin/pricing/tiers', {
        method: editingTierId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.success) {
        setShowTierModal(false);
        setMessage({ type: 'success', text: editingTierId ? 'Tier actualizado' : 'Tier creado exitosamente' });
        await fetchPricingData();
      } else {
        setTierError(result.error);
      }
    } catch {
      setTierError('Error guardando tier');
    } finally {
      setTierSaving(false);
    }
  }

  async function handleDeleteTier(tier: PricingTier) {
    if (!confirm(`¿Eliminar el tier "${tier.name}"? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch('/api/admin/pricing/tiers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tier.id }),
      });

      const result = await res.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Tier eliminado' });
        await fetchPricingData();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error eliminando tier' });
    }
  }

  async function handleToggleTier(tier: PricingTier) {
    try {
      const res = await fetch('/api/admin/pricing/tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tier.id, is_active: !tier.is_active }),
      });

      const result = await res.json();
      if (result.success) {
        await fetchPricingData();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Error actualizando tier' });
    }
  }

  // Preview: calcular precios para cantidades de ejemplo
  function getPreviewPrice(photoCount: number) {
    if (!tiersEnabled) {
      return { price: basePrice, total: basePrice * photoCount, discount: 0, tierName: 'Precio Normal' };
    }

    const activeTiers = tiers
      .filter(t => t.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);

    const tier = activeTiers.find(t => {
      const meetsMin = photoCount >= t.min_photos;
      const meetsMax = t.max_photos === null || photoCount <= t.max_photos;
      return meetsMin && meetsMax;
    });

    if (!tier) {
      return { price: basePrice, total: basePrice * photoCount, discount: 0, tierName: 'Sin tier' };
    }

    return {
      price: tier.price_per_photo,
      total: tier.price_per_photo * photoCount,
      discount: tier.discount_percentage,
      tierName: tier.name,
    };
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
          <span className="ml-3 text-gray-600">Cargando configuración de precios...</span>
        </div>
      </div>
    );
  }

  const previewCounts = [1, 3, 5, 8, 10, 12, 15, 20];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <Link href="/admin/dashboard" className="hover:text-red-600">Dashboard</Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/admin/configuracion" className="hover:text-red-600">Configuración</Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Precios y Descuentos</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Precios y Descuentos</h1>
        <p className="mt-2 text-gray-600">
          Configura el precio base por foto y los packs de descuento por volumen. Los cambios se aplican inmediatamente.
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex justify-between items-center">
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-current opacity-60 hover:opacity-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Card: Configuración Global */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuración Global</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio base por foto (CLP)
            </label>
            <input
              type="number"
              min={100}
              step={100}
              value={basePrice}
              onChange={(e) => setBasePrice(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              Precio sin descuento. Se usa cuando no aplica ningún tier.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sistema de descuentos por volumen
            </label>
            <div className="flex items-center mt-2">
              <button
                onClick={() => setTiersEnabled(!tiersEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  tiersEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    tiersEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`ml-3 text-sm font-medium ${tiersEnabled ? 'text-green-700' : 'text-gray-500'}`}>
                {tiersEnabled ? 'Activado' : 'Desactivado'}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Si está desactivado, todas las fotos se cobran al precio base.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>

      {/* Card: Tiers de Descuento */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tiers de Descuento</h2>
            <p className="text-sm text-gray-600 mt-1">
              Define los packs de descuento según la cantidad de fotos seleccionadas
            </p>
          </div>
          <button
            onClick={openCreateTier}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            + Agregar Tier
          </button>
        </div>

        {tiers.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay tiers configurados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Orden</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Nombre</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">Rango</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600">$/Foto</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600">Descuento</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-600">Estado</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr key={tier.id} className={`border-b border-gray-100 ${!tier.is_active ? 'opacity-50' : ''}`}>
                    <td className="py-3 px-2 text-gray-500">{tier.sort_order}</td>
                    <td className="py-3 px-2 font-medium text-gray-900">{tier.name}</td>
                    <td className="py-3 px-2 text-gray-600">
                      {tier.min_photos} - {tier.max_photos ?? '...'}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900">
                      ${tier.price_per_photo.toLocaleString('es-CL')}
                    </td>
                    <td className="py-3 px-2 text-right">
                      {tier.discount_percentage > 0 ? (
                        <span className="text-green-600 font-medium">{tier.discount_percentage}%</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleToggleTier(tier)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          tier.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {tier.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditTier(tier)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteTier(tier)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card: Preview en vivo */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Vista Previa del Cliente</h2>
        <p className="text-sm text-gray-600 mb-4">
          Así se verán los precios para distintas cantidades de fotos
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {previewCounts.map((count) => {
            const preview = getPreviewPrice(count);
            return (
              <div
                key={count}
                className={`rounded-lg border-2 p-4 text-center ${
                  preview.discount > 0
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">
                  {count} {count === 1 ? 'foto' : 'fotos'}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  ${preview.total.toLocaleString('es-CL')}
                </div>
                <div className="text-xs text-gray-500">
                  ${preview.price.toLocaleString('es-CL')}/foto
                </div>
                {preview.discount > 0 && (
                  <div className="mt-1 text-xs font-semibold text-green-600">
                    {preview.discount}% OFF
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-400">{preview.tierName}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Crear/Editar Tier */}
      {showTierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTierId ? 'Editar Tier' : 'Nuevo Tier de Descuento'}
              </h3>
              <button onClick={() => setShowTierModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {tierError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {tierError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={tierForm.name}
                  onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                  placeholder="Ej: Pack 5-9 Fotos"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min. fotos</label>
                  <input
                    type="number"
                    min={1}
                    value={tierForm.min_photos}
                    onChange={(e) => setTierForm({ ...tierForm, min_photos: parseInt(e.target.value) || '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max. fotos <span className="text-gray-400">(vacío = sin límite)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={tierForm.max_photos === null ? '' : tierForm.max_photos}
                    onChange={(e) => setTierForm({ ...tierForm, max_photos: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Sin límite"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio por foto (CLP)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={tierForm.price_per_photo}
                    onChange={(e) => setTierForm({ ...tierForm, price_per_photo: parseInt(e.target.value) || '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={tierForm.discount_percentage}
                    onChange={(e) => setTierForm({ ...tierForm, discount_percentage: parseInt(e.target.value) || '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                  <input
                    type="number"
                    min={0}
                    value={tierForm.sort_order}
                    onChange={(e) => setTierForm({ ...tierForm, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <div className="flex items-center mt-2">
                    <button
                      type="button"
                      onClick={() => setTierForm({ ...tierForm, is_active: !tierForm.is_active })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        tierForm.is_active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          tierForm.is_active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="ml-2 text-sm">{tierForm.is_active ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTierModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTier}
                disabled={tierSaving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {tierSaving ? 'Guardando...' : editingTierId ? 'Actualizar' : 'Crear Tier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';

interface PhotoUploadAreaProps {
  galleryId: string;
  onUploadComplete: () => void;
}

interface UploadingFile {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function PhotoUploadArea({ galleryId, onUploadComplete }: PhotoUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    // Filtrar solo imágenes
    const imageFiles = files.filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      alert('Por favor, selecciona solo archivos de imagen (JPG, PNG, etc.)');
      return;
    }

    // Crear previews
    const newFiles: UploadingFile[] = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
    }));

    setUploadingFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadingFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const uploadFiles = async () => {
    if (uploadingFiles.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < uploadingFiles.length; i++) {
      const fileData = uploadingFiles[i];

      // Solo subir archivos pendientes
      if (fileData.status !== 'pending') continue;

      // Actualizar estado a "uploading"
      setUploadingFiles((prev) => {
        const newFiles = [...prev];
        newFiles[i] = { ...newFiles[i], status: 'uploading', progress: 0 };
        return newFiles;
      });

      try {
        // Generar nombre de archivo único
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileExtension = fileData.file.name.split('.').pop();
        const fileName = `${timestamp}-${randomString}.${fileExtension}`;
        const storagePath = `galleries/${galleryId}/${fileName}`;

        // Subir a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gallery-images')
          .upload(storagePath, fileData.file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('gallery-images')
          .getPublicUrl(storagePath);

        if (!urlData.publicUrl) {
          throw new Error('No se pudo obtener la URL pública');
        }

        // Guardar en la base de datos
        const { error: dbError } = await supabase.from('photos').insert([
          {
            gallery_id: galleryId,
            storage_path: storagePath,
            public_url: urlData.publicUrl,
          },
        ]);

        if (dbError) {
          throw dbError;
        }

        // Actualizar estado a "success"
        setUploadingFiles((prev) => {
          const newFiles = [...prev];
          newFiles[i] = { ...newFiles[i], status: 'success', progress: 100 };
          return newFiles;
        });
      } catch (error: any) {
        console.error('Error uploading file:', error);

        // Actualizar estado a "error"
        setUploadingFiles((prev) => {
          const newFiles = [...prev];
          newFiles[i] = {
            ...newFiles[i],
            status: 'error',
            error: error.message || 'Error al subir la foto',
          };
          return newFiles;
        });
      }
    }

    setIsUploading(false);

    // Limpiar archivos exitosos después de 2 segundos
    setTimeout(() => {
      setUploadingFiles((prev) =>
        prev.filter((f) => f.status !== 'success')
      );
      onUploadComplete();
    }, 2000);
  };

  const clearAll = () => {
    uploadingFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setUploadingFiles([]);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        <svg
          className={`mx-auto h-12 w-12 ${
            isDragging ? 'text-red-500' : 'text-gray-400'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        <p className="mt-2 text-sm text-gray-600">
          <span className="font-semibold text-red-600">Haz click para seleccionar</span> o
          arrastra y suelta las fotos aquí
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Soporta múltiples archivos (JPG, PNG, etc.)
        </p>
      </div>

      {/* Files List */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-900">
              {uploadingFiles.length} {uploadingFiles.length === 1 ? 'archivo' : 'archivos'}{' '}
              {uploadingFiles.filter((f) => f.status === 'pending').length > 0 &&
                'listo para subir'}
            </h3>
            <button
              onClick={clearAll}
              disabled={isUploading}
              className="text-sm text-gray-600 hover:text-red-600 disabled:opacity-50"
            >
              Limpiar todo
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {uploadingFiles.map((fileData, index) => (
              <div key={index} className="relative group">
                {/* Preview */}
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={fileData.preview}
                    alt={fileData.file.name}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />

                  {/* Overlay de estado */}
                  {fileData.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="text-xs">Subiendo...</p>
                      </div>
                    </div>
                  )}

                  {fileData.status === 'success' && (
                    <div className="absolute inset-0 bg-green-500 bg-opacity-75 flex items-center justify-center">
                      <svg
                        className="h-12 w-12 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}

                  {fileData.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                      <svg
                        className="h-12 w-12 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Nombre y botón eliminar */}
                <div className="mt-1 flex justify-between items-start">
                  <p className="text-xs text-gray-600 truncate flex-1">
                    {fileData.file.name}
                  </p>
                  {fileData.status === 'pending' && (
                    <button
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                      className="ml-2 text-gray-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Error message */}
                {fileData.error && (
                  <p className="text-xs text-red-600 mt-1">{fileData.error}</p>
                )}
              </div>
            ))}
          </div>

          {/* Upload Button */}
          {uploadingFiles.filter((f) => f.status === 'pending').length > 0 && (
            <button
              onClick={uploadFiles}
              disabled={isUploading}
              className="w-full py-3 px-4 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Subiendo fotos...
                </span>
              ) : (
                `Subir ${uploadingFiles.filter((f) => f.status === 'pending').length} ${
                  uploadingFiles.filter((f) => f.status === 'pending').length === 1
                    ? 'foto'
                    : 'fotos'
                }`
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

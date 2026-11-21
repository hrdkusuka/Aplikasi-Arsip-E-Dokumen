import React from 'react';
import { X, Download, FileText, MapPin, UserCheck, Calendar } from 'lucide-react';
import { FileAttachment, MasterArchiveLocation } from '../types';
import { formatFileSize, formatIndonesianDate } from '../utils/archiveHelpers';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  noArsip: string;
  categoryLabel: string;
  attachment?: FileAttachment;
  archiveLocation?: MasterArchiveLocation;
  metadataPairs: { label: string; value: string }[];
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  noArsip,
  categoryLabel,
  attachment,
  archiveLocation,
  metadataPairs,
}) => {
  if (!isOpen) return null;

  const isImage =
    attachment?.type.startsWith('image/') ||
    attachment?.dataUrl.startsWith('data:image/');
  const isPdf =
    attachment?.type === 'application/pdf' ||
    attachment?.dataUrl.startsWith('data:application/pdf');

  const handleDownload = () => {
    if (!attachment?.dataUrl) return;
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.name || `${noArsip.replace(/\//g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>{categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-medium text-sky-400">{noArsip}</span>
            </div>
            <h3 className="mt-0.5 text-lg font-semibold tracking-tight text-white">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {attachment?.dataUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-500"
              >
                <Download className="h-3.5 w-3.5" />
                Unduh Berkas Asli
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="Tutup modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-12">
          {/* Left: File Preview Canvas */}
          <div className="flex flex-col lg:col-span-7">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">
                Pratinjau Lampiran Digital
              </span>
              {attachment && (
                <span className="font-mono">
                  {attachment.name} · {formatFileSize(attachment.size)}
                </span>
              )}
            </div>

            <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-3">
              {attachment?.dataUrl ? (
                isImage ? (
                  <img
                    src={attachment.dataUrl}
                    alt={attachment.name}
                    referrerPolicy="no-referrer"
                    className="max-h-[420px] w-full rounded object-contain shadow-xs"
                  />
                ) : isPdf ? (
                  <iframe
                    src={attachment.dataUrl}
                    title={attachment.name}
                    className="h-[420px] w-full rounded border-0 bg-white"
                  />
                ) : (
                  <div className="flex flex-col items-center p-6 text-center">
                    <FileText className="h-12 w-12 text-blue-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      {attachment.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Tipe berkas: {attachment.type} · Ukuran: {formatFileSize(attachment.size)}
                    </p>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Unduh Berkas untuk Membuka
                    </button>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center p-6 text-center text-slate-500">
                  <FileText className="h-10 w-10 text-slate-400" />
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    Belum ada berkas digital yang diunggah
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">
                    Anda dapat mengunggah scan PDF atau gambar dokumen melalui tombol Edit pada baris dokumen ini.
                  </p>
                </div>
              )}
            </div>

            {/* Physical Archive Location Box */}
            {archiveLocation && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-800">
                  Lokasi Penyimpanan Dokumen Fisik Asli
                </div>
                <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                    <div>
                      <span className="font-semibold text-slate-900">
                        {archiveLocation.namaLokasi}
                      </span>
                      <p className="text-slate-600">{archiveLocation.lokasi}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <UserCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>
                      Penanggungjawab Arsip:{' '}
                      <strong className="font-medium text-slate-900">
                        {archiveLocation.penanggungJawab}
                      </strong>
                    </span>
                  </div>
                  {attachment?.uploadedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>
                        Tanggal Unggah Digital:{' '}
                        <span className="font-mono text-slate-800">
                          {formatIndonesianDate(attachment.uploadedAt)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Structured Metadata Details */}
          <div className="flex flex-col lg:col-span-5">
            <h4 className="mb-2 text-xs font-semibold text-slate-700">
              Rincian Atribut Dokumen Arsip
            </h4>
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
              {metadataPairs.map((pair, idx) => (
                <div key={idx} className="px-3.5 py-2.5">
                  <div className="text-[11px] text-slate-500">{pair.label}</div>
                  <div className="mt-0.5 text-xs font-medium text-slate-900 break-words">
                    {pair.value || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

"use client";

// apps/admin/src/app/(protected)/videos/AdminVideosTable.tsx
// Management table for Parish Videos with live modals, toggling, and deletion.

import React, { useState } from "react";
import {
  Video,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Globe,
  Lock,
} from "lucide-react";
import type { ParishVideo, VideoProvider } from "@church-site/domain";
import {
  deleteVideoAction,
  toggleVideoActiveAction,
  toggleVideoPublicAction,
} from "@/actions/admin-video-actions";
import { AdminVideoModal } from "./AdminVideoModal";

export interface AdminVideosTableProps {
  initialVideos: ParishVideo[];
  canWrite: boolean;
  canDelete: boolean;
}

const PROVIDER_BADGES: Record<
  VideoProvider,
  { label: string; bg: string; text: string; border: string }
> = {
  youtube: {
    label: "يوتيوب",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  facebook: {
    label: "فيسبوك",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  direct: {
    label: "مباشر",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
};

export function AdminVideosTable({
  initialVideos,
  canWrite,
  canDelete,
}: AdminVideosTableProps) {
  const [videos, setVideos] = useState<ParishVideo[]>(initialVideos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ParishVideo | null>(null);

  const [togglingActiveId, setTogglingActiveId] = useState<string | null>(null);
  const [togglingPublicId, setTogglingPublicId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [notification, setNotification] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  function handleOpenCreate() {
    setEditingVideo(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(video: ParishVideo) {
    setEditingVideo(video);
    setIsModalOpen(true);
  }

  function handleSaved(saved: ParishVideo) {
    setVideos((prev) => {
      const idx = prev.findIndex((v) => v.id === saved.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });

    setNotification({
      tone: "success",
      message: editingVideo ? "تم تعديل الفيديو بنجاح." : "تمت إضافة الفيديو بنجاح.",
    });
  }

  async function handleToggleActive(video: ParishVideo) {
    if (!canWrite) return;
    const nextState = !video.isActive;
    const prevList = [...videos];

    // Optimistic update
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, isActive: nextState } : v))
    );
    setTogglingActiveId(video.id);

    try {
      const res = await toggleVideoActiveAction(video.id, nextState);
      if (!res.success) {
        setVideos(prevList);
        setNotification({ tone: "error", message: res.message });
      } else {
        setNotification({ tone: "success", message: res.message });
      }
    } catch {
      setVideos(prevList);
      setNotification({ tone: "error", message: "تعذر تغيير حالة تفعيل الفيديو." });
    } finally {
      setTogglingActiveId(null);
    }
  }

  async function handleTogglePublic(video: ParishVideo) {
    if (!canWrite) return;
    const nextState = !video.isPublic;
    const prevList = [...videos];

    // Optimistic update
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, isPublic: nextState } : v))
    );
    setTogglingPublicId(video.id);

    try {
      const res = await toggleVideoPublicAction(video.id, nextState);
      if (!res.success) {
        setVideos(prevList);
        setNotification({ tone: "error", message: res.message });
      } else {
        setNotification({ tone: "success", message: res.message });
      }
    } catch {
      setVideos(prevList);
      setNotification({ tone: "error", message: "تعذر تغيير حالة النشر." });
    } finally {
      setTogglingPublicId(null);
    }
  }

  async function handleDelete(video: ParishVideo) {
    if (!canDelete) return;
    const confirmed = window.confirm(
      `هل أنت متأكد من رغبتك في حذف فيديو «${video.titleAr}»؟ لا يمكن التراجع عن هذا الإجراء.`
    );
    if (!confirmed) return;

    setDeletingId(video.id);
    try {
      const res = await deleteVideoAction(video.id);
      if (!res.success) {
        setNotification({ tone: "error", message: res.message });
      } else {
        setVideos((prev) => prev.filter((v) => v.id !== video.id));
        setNotification({ tone: "success", message: res.message });
      }
    } catch {
      setNotification({ tone: "error", message: "حدث خطأ أثناء حذف الفيديو." });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar: Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Video className="w-5 h-5 text-copticGold-600" />
            <h1 className="font-heading font-bold text-lg text-slate-900">
              فيديوهات الكنيسة (Parish Videos)
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            إدارة وتضمين مقاطع الفيديو الخارجية (YouTube / Facebook / مباشر) في صفحة «عن الكنيسة».
          </p>
        </div>

        {canWrite && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-copticGold-500 hover:bg-copticGold-600 text-slate-950 font-heading font-bold text-xs rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة فيديو جديد</span>
          </button>
        )}
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs animate-fade-in ${
            notification.tone === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.tone === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Videos Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {videos.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Video className="w-6 h-6" />
            </div>
            <p className="font-heading font-bold text-sm text-slate-700">
              لا توجد فيديوهات مسجلة بعد
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              يمكنك إضافة مقاطع فيديو عن الكنيسة أو القداسات والفعاليات المنشورة على YouTube أو Facebook لتظهر على الموقع العام.
            </p>
            {canWrite && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول فيديو</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-bold">
                  <th className="py-3 px-4">الفيديو والعنوان</th>
                  <th className="py-3 px-4 text-center">المزود</th>
                  <th className="py-3 px-4 text-center">الترتيب</th>
                  <th className="py-3 px-4 text-center">النشر العام</th>
                  <th className="py-3 px-4 text-center">التفعيل</th>
                  <th className="py-3 px-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {videos.map((video) => {
                  const badge = PROVIDER_BADGES[video.provider] || PROVIDER_BADGES.direct;
                  const isTogglingActive = togglingActiveId === video.id;
                  const isTogglingPublic = togglingPublicId === video.id;
                  const isDeleting = deletingId === video.id;

                  return (
                    <tr
                      key={video.id}
                      className="hover:bg-slate-50/60 transition duration-150"
                    >
                      {/* Title & Description */}
                      <td className="py-4 px-4 max-w-xs sm:max-w-md">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-slate-900 line-clamp-1">
                              {video.titleAr}
                            </span>
                            <a
                              href={video.sourceUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-slate-400 hover:text-copticGold-600 transition shrink-0"
                              title="فتح الرابط الأصلي"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          {video.titleEn && (
                            <p className="text-[11px] text-slate-500 font-english line-clamp-1">
                              {video.titleEn}
                            </p>
                          )}
                          {video.descriptionAr && (
                            <p className="text-[11px] text-slate-400 line-clamp-1">
                              {video.descriptionAr}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Provider Badge */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Sort Order */}
                      <td className="py-4 px-4 text-center text-slate-600 font-mono">
                        {video.sortOrder}
                      </td>

                      {/* Public Toggle */}
                      <td className="py-4 px-4 text-center">
                        {canWrite ? (
                          <button
                            type="button"
                            onClick={() => handleTogglePublic(video)}
                            disabled={isTogglingPublic}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                              video.isPublic
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            {isTogglingPublic ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : video.isPublic ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                            <span>{video.isPublic ? "منشور" : "مخفي"}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {video.isPublic ? "منشور" : "مخفي"}
                          </span>
                        )}
                      </td>

                      {/* Active Toggle */}
                      <td className="py-4 px-4 text-center">
                        {canWrite ? (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(video)}
                            disabled={isTogglingActive}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                              video.isActive
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                            }`}
                          >
                            {isTogglingActive ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : video.isActive ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span>{video.isActive ? "نشط" : "معطل"}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {video.isActive ? "نشط" : "معطل"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          {canWrite && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(video)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                              title="تعديل الفيديو"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(video)}
                              disabled={isDeleting}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                              title="حذف الفيديو (للمسؤول فقط)"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Video Create/Edit Modal */}
      <AdminVideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSaved}
        initialData={editingVideo}
      />
    </div>
  );
}

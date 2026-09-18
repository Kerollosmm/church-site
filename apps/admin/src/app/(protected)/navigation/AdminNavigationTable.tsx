"use client";

// apps/admin/src/app/(protected)/navigation/AdminNavigationTable.tsx
// Management table for Navigation Menu Items with hierarchical display, drag/reorder, and live editing.

import React, { useState } from "react";
import {
  Compass,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  CornerDownLeft,
} from "lucide-react";
import type { NavigationMenuItem, NavSection } from "@church-site/domain";
import {
  deleteNavItemAction,
  reorderNavItemsAction,
  toggleNavItemAction,
} from "@/actions/admin-navigation-actions";
import { AdminNavModal } from "./AdminNavModal";

export interface AdminNavigationTableProps {
  initialItems: NavigationMenuItem[];
  canWrite: boolean;
}

export function AdminNavigationTable({
  initialItems,
  canWrite,
}: AdminNavigationTableProps) {
  const [items, setItems] = useState<NavigationMenuItem[]>(initialItems);
  const [selectedSection, setSelectedSection] = useState<NavSection>("main");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NavigationMenuItem | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const [notification, setNotification] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  function handleOpenCreate() {
    setEditingItem(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(item: NavigationMenuItem) {
    setEditingItem(item);
    setIsModalOpen(true);
  }

  function handleSaved(saved: NavigationMenuItem) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });

    setNotification({
      tone: "success",
      message: `تم حفظ عنصر «${saved.labelAr}» بنجاح.`,
    });
    setTimeout(() => setNotification(null), 4000);
  }

  async function handleToggleActive(item: NavigationMenuItem) {
    if (!canWrite || togglingId) return;
    setTogglingId(item.id);
    setNotification(null);

    const nextState = !item.isActive;

    try {
      const res = await toggleNavItemAction(item.id, nextState);
      if (res.success && res.data) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? res.data! : i))
        );
        setNotification({
          tone: "success",
          message: res.message,
        });
      } else {
        setNotification({
          tone: "error",
          message: res.message || "فشل تغيير حالة العنصر.",
        });
      }
    } catch (err) {
      setNotification({
        tone: "error",
        message: err instanceof Error ? err.message : "حدث خطأ غير متوقع.",
      });
    } finally {
      setTogglingId(null);
      setTimeout(() => setNotification(null), 4000);
    }
  }

  async function handleDelete(item: NavigationMenuItem) {
    if (!canWrite || deletingId) return;

    const confirmed = window.confirm(
      `هل أنت متأكد من رغبتك في حذف عنصر «${item.labelAr}»؟ سيتم فك ارتباط أي عناصر فرعية تابعة له.`
    );
    if (!confirmed) return;

    setDeletingId(item.id);
    setNotification(null);

    try {
      const res = await deleteNavItemAction(item.id);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        setNotification({
          tone: "success",
          message: res.message,
        });
      } else {
        setNotification({
          tone: "error",
          message: res.message || "فشل حذف العنصر.",
        });
      }
    } catch (err) {
      setNotification({
        tone: "error",
        message: err instanceof Error ? err.message : "حدث خطأ غير متوقع.",
      });
    } finally {
      setDeletingId(null);
      setTimeout(() => setNotification(null), 4000);
    }
  }

  async function handleMove(item: NavigationMenuItem, direction: "up" | "down") {
    if (!canWrite || reordering) return;

    // Siblings with same section and parentId
    const siblings = items
      .filter((i) => i.section === item.section && i.parentId === item.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const currentIndex = siblings.findIndex((s) => s.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const other = siblings[targetIndex];

    const updatedSiblings = [...siblings];
    updatedSiblings[currentIndex] = { ...other, sortOrder: item.sortOrder };
    updatedSiblings[targetIndex] = { ...item, sortOrder: other.sortOrder };

    // Swap orders
    const reorderPayload = [
      { id: item.id, sort_order: other.sortOrder },
      { id: other.id, sort_order: item.sortOrder },
    ];

    setReordering(true);
    setNotification(null);

    try {
      const res = await reorderNavItemsAction({ items: reorderPayload });
      if (res.success) {
        setItems((prev) =>
          prev.map((i) => {
            if (i.id === item.id) return { ...i, sortOrder: other.sortOrder };
            if (i.id === other.id) return { ...i, sortOrder: item.sortOrder };
            return i;
          })
        );
      } else {
        setNotification({
          tone: "error",
          message: res.message || "فشل إعادة الترتيب.",
        });
      }
    } catch (err) {
      setNotification({
        tone: "error",
        message: err instanceof Error ? err.message : "حدث خطأ غير متوقع.",
      });
    } finally {
      setReordering(false);
      setTimeout(() => setNotification(null), 4000);
    }
  }

  // Hierarchical sort for current section:
  // Root items first by sortOrder, each immediately followed by its children
  const sectionItems = items.filter((i) => i.section === selectedSection);
  const rootItems = sectionItems
    .filter((i) => !i.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const flatHierarchicalList: { item: NavigationMenuItem; isChild: boolean; parentName?: string }[] = [];
  for (const root of rootItems) {
    flatHierarchicalList.push({ item: root, isChild: false });
    const children = sectionItems
      .filter((i) => i.parentId === root.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const child of children) {
      flatHierarchicalList.push({ item: child, isChild: true, parentName: root.labelAr });
    }
  }

  const potentialParents = items.filter((i) => i.section === selectedSection && !i.parentId);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-xs transition-all ${
            notification.tone === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.tone === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-xs"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Control bar: Section Tabs & Add button */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setSelectedSection("main")}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition ${
              selectedSection === "main"
                ? "bg-white text-copticNavy shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            القائمة الرئيسية (Main Navbar) (
            {items.filter((i) => i.section === "main").length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedSection("secondary")}
            className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition ${
              selectedSection === "secondary"
                ? "bg-white text-copticNavy shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            القائمة الثانوية (Secondary) (
            {items.filter((i) => i.section === "secondary").length})
          </button>
        </div>

        {canWrite && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-copticNavy hover:bg-copticNavy-800 text-white font-heading font-bold text-xs shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة عنصر جديد</span>
          </button>
        )}
      </div>

      {/* Navigation Items Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {flatHierarchicalList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Compass className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-heading font-bold text-slate-600 text-sm">
              لا توجد عناصر مسجلة في هذا القسم.
            </p>
            {canWrite && (
              <button
                onClick={handleOpenCreate}
                className="text-xs text-copticNavy font-bold hover:underline"
              >
                إضافة أول عنصر الآن
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-heading font-bold text-slate-500">
                  <th className="py-3.5 px-4">الترتيب</th>
                  <th className="py-3.5 px-4">عنوان الرابط</th>
                  <th className="py-3.5 px-4">المفتاح التعريفي (Key)</th>
                  <th className="py-3.5 px-4">المسار (Href)</th>
                  <th className="py-3.5 px-4 text-center">الحالة</th>
                  <th className="py-3.5 px-4 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {flatHierarchicalList.map(({ item, isChild, parentName }) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/60 transition group ${
                      isChild ? "bg-slate-50/40" : ""
                    }`}
                  >
                    {/* Sort Order & Move Arrows */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                      <div className="flex items-center gap-1.5">
                        {canWrite && (
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMove(item, "up")}
                              disabled={reordering}
                              className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition disabled:opacity-30"
                              title="تحريك لأعلى"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMove(item, "down")}
                              disabled={reordering}
                              className="p-0.5 hover:bg-slate-200 rounded text-slate-500 transition disabled:opacity-30"
                              title="تحريك لأسفل"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <span>#{item.sortOrder}</span>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {isChild && (
                          <div className="flex items-center gap-1 text-slate-400 pr-2">
                            <CornerDownLeft className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div>
                          <span className="font-heading font-bold text-copticNavy text-sm">
                            {item.labelAr}
                          </span>
                          {item.labelEn && (
                            <span className="text-[11px] text-slate-400 font-english block">
                              {item.labelEn}
                            </span>
                          )}
                          {isChild && parentName && (
                            <span className="text-[10px] text-copticGold-800 bg-copticGold-50 px-2 py-0.5 rounded-full border border-copticGold-200 inline-block mt-0.5 font-medium">
                              قائمة منسدلة تحت: {parentName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Key */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {item.key}
                    </td>

                    {/* Href */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span>{item.href}</span>
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          title="فحص الرابط"
                          className="text-slate-400 hover:text-copticNavy transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {canWrite ? (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          disabled={togglingId === item.id}
                          className="inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {togglingId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                                item.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              {item.isActive ? "نشط" : "معطل"}
                            </span>
                          )}
                        </button>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.isActive ? "نشط" : "معطل"}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        {canWrite && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-slate-500 hover:text-copticNavy hover:bg-slate-100 rounded-lg transition"
                              title="تعديل العنصر"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-50"
                              title="حذف العنصر"
                            >
                              {deletingId === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <AdminNavModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleSaved}
        initialData={editingItem}
        availableParents={potentialParents}
      />
    </div>
  );
}

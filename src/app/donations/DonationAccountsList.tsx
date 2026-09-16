"use client";

import React, { useState } from "react";
import { PageHero } from "@/components/layout/PageHero";
import {
  DollarSign,
  Copy,
  Check,
  Building,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import type { Tables } from "@/types/database.types";

export interface DonationAccountsListProps {
  /** Official bank accounts from `getDonationAccounts()` (database or seeded fallback). */
  accounts: Tables<"donation_accounts">[];
}

export function DonationAccountsList({ accounts }: DonationAccountsListProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="min-h-screen bg-alabasterBg pb-16">
      <PageHero
        title="الحسابات البنكية وقنوات العطاء الرسمي"
        englishTitle="Official Parish Bank Accounts & Donations"
        description="المساهمة الرسمية لدعم المذبح، خدمة إخوة الرب المتعففين، المستوصف الخيري، وأعمال الصيانة الكنسية عبر البنوك المصرية المعتمدة."
        breadcrumbs={[{ label: "التبرعات والعطاء" }]}
        icon={<DollarSign className="w-8 h-8 text-copticGold-300" />}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Transparency Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-copticGold-300 shadow-xs flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-copticNavy text-copticGold-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-8 h-8 text-copticGold-300" />
          </div>
          <div className="space-y-1 text-center md:text-right">
            <h3 className="font-heading font-bold text-lg text-copticNavy">
              شفافية وأمانة كنسية كاملة
            </h3>
            <p className="text-xs sm:text-sm text-slateText-secondary leading-relaxed">
              جميع الحسابات الموضحة أدناه مسجلة رسمياً لدى البنك المركزي المصري باسم <strong>«كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود بالعصافرة»</strong>، وتخضع للمراجعة المالية الدورية من بطريركية الأقباط الأرثوذكس بالإسكندرية.
            </p>
          </div>
        </div>

        {/* Bank Accounts Grid */}
        <div className="space-y-6">
          <h3 className="font-heading font-bold text-xl text-copticNavy">
            الحسابات البنكية الرسمية المعتمدة
          </h3>

          {accounts.length === 0 ? (
            <p className="bg-white rounded-3xl p-6 border-2 border-copticGold-200 text-xs sm:text-sm text-slateText-secondary">
              لا توجد حسابات بنكية منشورة حالياً، ويرجى التواصل مع سكرتارية الكنيسة للتبرع.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-white rounded-3xl p-6 border-2 border-copticGold-300 hover:border-copticNavy transition shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-copticGold-100 text-copticNavy flex items-center justify-center font-heading font-bold text-sm">
                        <Building className="w-5 h-5 text-copticNavy" />
                      </div>
                      <span className="text-xs font-bold text-copticGold-800 bg-copticGold-50 px-2.5 py-0.5 rounded-full border border-copticGold-200 font-english">
                        EGP
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-lg text-copticNavy mb-1">
                      {acc.bank_name_ar}
                    </h4>
                    <p className="text-xs text-copticGold-700 font-medium mb-4">
                      {acc.purpose_category_ar}
                    </p>

                    <div className="space-y-3 text-xs">
                      {/* Account Number */}
                      <div className="bg-copticGold-50/70 p-3 rounded-xl border border-copticGold-200">
                        <div className="flex items-center justify-between text-slateText-muted mb-1">
                          <span>رقم الحساب البنكي:</span>
                          <button
                            onClick={() => copyToClipboard(acc.account_number, `acc-${acc.id}`)}
                            className="text-copticNavy hover:text-copticGold-800 flex items-center gap-1 font-bold"
                            title="نسخ رقم الحساب"
                          >
                            {copiedKey === `acc-${acc.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedKey === `acc-${acc.id}` ? "تم" : "نسخ"}</span>
                          </button>
                        </div>
                        <span className="font-english font-bold text-copticNavy text-sm tracking-wider block" dir="ltr">
                          {acc.account_number}
                        </span>
                      </div>

                      {/* IBAN */}
                      <div className="bg-copticGold-50/70 p-3 rounded-xl border border-copticGold-200">
                        <div className="flex items-center justify-between text-slateText-muted mb-1">
                          <span>رقم الآيبان (IBAN):</span>
                          <button
                            onClick={() => copyToClipboard(acc.iban_number, `iban-${acc.id}`)}
                            className="text-copticNavy hover:text-copticGold-800 flex items-center gap-1 font-bold"
                            title="نسخ IBAN"
                          >
                            {copiedKey === `iban-${acc.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedKey === `iban-${acc.id}` ? "تم" : "نسخ"}</span>
                          </button>
                        </div>
                        <span className="font-english font-bold text-copticNavy text-xs tracking-wider block break-all" dir="ltr">
                          {acc.iban_number}
                        </span>
                      </div>

                      {/* Swift Code */}
                      <div className="bg-copticGold-50/70 p-3 rounded-xl border border-copticGold-200">
                        <div className="flex items-center justify-between text-slateText-muted mb-1">
                          <span>رمز السويفت (SWIFT):</span>
                          <button
                            onClick={() => copyToClipboard(acc.swift_code, `swift-${acc.id}`)}
                            className="text-copticNavy hover:text-copticGold-800 flex items-center gap-1 font-bold"
                            title="نسخ Swift"
                          >
                            {copiedKey === `swift-${acc.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedKey === `swift-${acc.id}` ? "تم" : "نسخ"}</span>
                          </button>
                        </div>
                        <span className="font-english font-bold text-copticNavy text-xs tracking-wider block" dir="ltr">
                          {acc.swift_code}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-copticGold-100 mt-4 text-[11px] text-slateText-muted text-center">
                    اسم الحساب: {acc.account_title_ar}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Biblical Verse and Receipt Notice */}
        <div className="bg-copticNavy-900 text-white rounded-3xl p-6 sm:p-8 border border-copticGold-400 space-y-4">
          <div className="text-center font-scripture text-lg sm:text-xl text-amber-100">
            «كُلُّ وَاحِدٍ كَمَا يَنْوِي بِقَلْبِهِ، لَيْسَ عَنْ حُزْنٍ أَوِ اضْطِرَارٍ. لأَنَّ الْمُعْطِيَ الْمَسْرُورَ يُحِبُّهُ اللهُ.»
            <span className="block font-heading text-xs text-copticGold-300 mt-1 font-bold">
              (٢ كورنثوس ٩: ٧)
            </span>
          </div>

          <div className="border-t border-copticGold-500/30 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-copticGold-400" />
              <span>للحصول على إيصال استلام رسمي، يرجى إرسال صورة التحويل البنكي لواتساب الإدارة المالية.</span>
            </div>
            <a
              href="https://wa.me/201200000000"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-copticGold-300 hover:text-white"
            >
              واتساب السكرتارية المالية: 01200000000
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

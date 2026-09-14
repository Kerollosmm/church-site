import React from "react";
import Link from "next/link";
import { UserCheck, MessageSquare, ArrowLeft, Heart } from "lucide-react";

export function WelcomeFromClergy() {
  return (
    <div className="my-10 bg-white border border-copticGold-300 rounded-3xl p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-copticNavy-700 border-2 border-copticGold-400 flex items-center justify-center text-copticGold-300 shrink-0 shadow-md">
          <UserCheck className="w-10 h-10 text-copticGold-300" />
        </div>

        <div className="flex-1 text-center md:text-right">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-copticGold-800 bg-copticGold-100 px-3 py-1 rounded-full mb-2">
            <Heart className="w-3.5 h-3.5 text-copticGold-700" />
            <span>رسالة محبة ورعاية</span>
          </div>
          <h2 className="font-heading font-bold text-xl sm:text-2xl text-copticNavy mb-2">
            كلمة مجمع الآباء الكهنة
          </h2>
          <p className="text-sm text-slateText-secondary leading-relaxed mb-4">
            «نعمة لكم وسلام من الله أبينا والرب يسوع المسيح». يرحب مجمع كهنة كنيسة القديسين مكسيموس ودوماديوس والأنبا موسى الأسود بجميع أبناء الكنيسة وزائريها الأحباء. نفتح قلوبنا وأبواب كنيستنا لكل نفس تطلب الخلاص والمشورة والبركة، ويسعدنا خدمتكم في كافة الصلوات والاجتماعات ومواعيد الاعترافات.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <Link
              href="/about/clergy"
              className="inline-flex items-center gap-1.5 bg-copticNavy text-white hover:bg-copticNavy-700 font-bold text-xs px-4 py-2 rounded-xl transition"
            >
              <span>دليل الآباء الكهنة ومواعيد الاعترافات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 bg-copticGold-100 hover:bg-copticGold-200 text-copticNavy-900 font-bold text-xs px-4 py-2 rounded-xl transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-copticGold-800" />
              <span>إرسال طلب صلاة أو استفسار رعوي</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

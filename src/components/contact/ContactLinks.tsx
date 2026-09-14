import React from "react";
import { Phone, MessageCircle, Users, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toWhatsAppUrl } from "@/lib/utils/parish-contact";

export interface ContactLinksProps {
  /** Local landline or mobile number, e.g. "03-5551237". */
  phone?: string | null;
  /** Local mobile number used for direct WhatsApp chat, e.g. "01220000004". */
  whatsappNumber?: string | null;
  /** Full https://chat.whatsapp.com/... group invite URL. */
  whatsappGroupUrl?: string | null;
  className?: string;
}

export function ContactLinks({
  phone,
  whatsappNumber,
  whatsappGroupUrl,
  className,
}: ContactLinksProps) {
  const items: Array<{ key: string; label: string; href: string; icon: React.ReactNode; external: boolean }> = [];

  if (phone) {
    items.push({
      key: "phone",
      label: "اتصال",
      href: `tel:${phone}`,
      icon: <Phone className="w-4 h-4 text-copticGold-700" />,
      external: false,
    });
  }

  if (whatsappNumber) {
    items.push({
      key: "whatsapp",
      label: "واتساب",
      href: toWhatsAppUrl(whatsappNumber),
      icon: <MessageCircle className="w-4 h-4 text-copticGold-700" />,
      external: true,
    });
  }

  if (whatsappGroupUrl) {
    items.push({
      key: "whatsapp-group",
      label: "مجموعة واتساب",
      href: whatsappGroupUrl,
      icon: <Users className="w-4 h-4 text-copticGold-700" />,
      external: true,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="inline-flex items-center gap-2 bg-alabasterBg border border-copticGold-200 hover:border-copticGold-400 hover:bg-copticGold-50 px-4 py-2.5 rounded-xl text-xs font-bold text-copticNavy transition"
        >
          {item.icon}
          <span>{item.label}</span>
          {item.external && <ExternalLink className="w-3.5 h-3.5 text-slateText-muted" />}
        </a>
      ))}
    </div>
  );
}

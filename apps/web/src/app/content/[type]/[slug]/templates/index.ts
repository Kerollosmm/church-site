import React from "react";
import { DefaultTemplate, type ContentTemplateProps } from "./default";
import { ArticleTemplate } from "./article";

export type { ContentTemplateProps };

export const TEMPLATES: Record<string, React.ComponentType<ContentTemplateProps>> = {
  default: DefaultTemplate,
  article: ArticleTemplate,
};

export function getTemplate(templateName: string | null | undefined): React.ComponentType<ContentTemplateProps> {
  if (templateName && TEMPLATES[templateName]) {
    return TEMPLATES[templateName];
  }
  return DefaultTemplate;
}

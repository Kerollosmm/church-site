// apps/web/src/components/layout/Header.tsx
// Server component shell for Header, fetching dynamic navigation with instant zero-env seed fallback.

import React from "react";
import { getPublicNavigation } from "@church-site/data-access";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const navigation = await getPublicNavigation();
  return <HeaderClient navigation={navigation} />;
}

"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEntityStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { ArmyList } from "@/lib/types/army-list";
import BuilderPage from "../page";

// This route renders the same BuilderPage component.
// BuilderPage reads listId from useParams() and loads the saved list on mount.
export default function EditListPage() {
  return <BuilderPage />;
}

"use client";

import PlaytestBuilderPage from "../page";

// This route renders the same PlaytestBuilderPage component.
// PlaytestBuilderPage reads listId from useParams() and loads the saved list on mount.
export default function EditPlaytestListPage() {
  return <PlaytestBuilderPage />;
}

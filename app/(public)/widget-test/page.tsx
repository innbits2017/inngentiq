"use client";

export default function WidgetTestPage() {
  return (
    <main className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold">
        Widget Test Page
      </h1>

      <p className="mt-2 text-gray-600">
        Inngentiq Widget Test
      </p>

      <script
        src="/widget/widget.bundle.js"
        data-agent="ad19dcb9-368b-40ec-a197-7345336e495a"
      />
    </main>
  );
}
"use client";

export default function TestKBPage() {
  async function saveKnowledge() {
    const res = await fetch("/api/knowledge-base", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationId: "360a8bec-fcfd-4df1-915e-ebfc932fb92d",
        title: "Housekeeping Pricing",
        content:
          "Housekeeping services start from ₹4500 per month.",
      }),
    });

    const data = await res.json();

    console.log(data);

    alert(JSON.stringify(data));
  }

  return (
    <div className="p-10">
      <button
        onClick={saveKnowledge}
        className="border px-4 py-2"
      >
        Save Knowledge
      </button>
    </div>
  );
}
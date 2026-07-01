"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [organizationName, setOrganizationName] = useState("");

async function signup() {
  const res = await fetch(
    "/api/auth/signup",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        organizationName,
        email,
        password,
      }),
    }
  );

  const data = await res.json();

  console.log(data);

  if (!res.ok) {
    alert(data.error);
    return;
  }

  alert("Account created");
}

  return (
    
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md border rounded-lg p-6">
        <h1 className="mb-6 text-2xl font-bold">
          Create Account
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />

        <input
        type="text"
        placeholder="Organization Name"
        value={organizationName}
        onChange={(e) => setOrganizationName(e.target.value)}
        className="w-full border p-2 rounded mb-4"
        />

        <button
          onClick={signup}
          disabled={loading}
          className="w-full bg-black text-white p-2 rounded"
        >
          {loading ? "Creating..." : "Signup"}
        </button>
      </div>
    </div>
    
  );
}
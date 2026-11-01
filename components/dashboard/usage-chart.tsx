
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Activity } from "lucide-react";

const data = [
  { day: "Mon", conversations: 12 },
  { day: "Tue", conversations: 18 },
  { day: "Wed", conversations: 10 },
  { day: "Thu", conversations: 26 },
  { day: "Fri", conversations: 22 },
  { day: "Sat", conversations: 34 },
  { day: "Sun", conversations: 28 },
];

export default function UsageChart() {
  return (
    <div className="h-full rounded-xl border border-[#EAE8FA] bg-white p-4 shadow-sm sm:p-5">

      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0EEFF] text-[#5149E8]">
              <Activity size={17} />
            </div>

            <h2 className="text-base font-bold text-[#20234A]">
              AI Conversations
            </h2>
          </div>

          <p className="mt-1 text-xs text-[#9293B2]">
            Weekly activity overview
          </p>
        </div>

        <span className="rounded-full bg-[#FDF6E7] px-2.5 py-1 text-[10px] font-semibold text-[#A78337]">
          Sample data
        </span>
      </div>

      {/* Chart */}
      <div className="h-[185px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
          >
            <defs>
              <linearGradient
                id="conversationLine"
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor="#5149E8" />
                <stop offset="100%" stopColor="#7565F5" />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#F0EEFF"
              strokeDasharray="4 5"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9293B2", fontSize: 11 }}
              dy={8}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9293B2", fontSize: 10 }}
              width={35}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #EAE8FA",
                boxShadow: "0 4px 15px rgba(81,73,232,0.08)",
                padding: "8px 12px",
                fontSize: 12,
              }}
            />

            <Line
              type="monotone"
              dataKey="conversations"
              name="Conversations"
              stroke="url(#conversationLine)"
              strokeWidth={2.5}
              dot={{
                r: 3,
                fill: "#5149E8",
                strokeWidth: 2,
                stroke: "#fff",
              }}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: "#E8E5FF",
              }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

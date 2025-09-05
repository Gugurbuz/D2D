import React from "react";

type Tone = "blue" | "yellow" | "green" | "red" | "gray";

export const Chip: React.FC<{ tone?: Tone; children: React.ReactNode }> = ({ tone = "gray", children }) => {
  const tones: Record<Tone, string> = {
    blue: "bg-blue-100 text-blue-800",
    yellow: "bg-yellow-100 text-yellow-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${tones[tone]} font-medium`}>
      {children}
    </span>
  );
};

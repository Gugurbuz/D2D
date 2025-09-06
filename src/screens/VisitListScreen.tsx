const buttonClassForStatus = (buttonStatus: Customer["status"] | "Tümü") => {
  const active = statusFilter === buttonStatus;

  if (buttonStatus === "Tümü") {
    return `px-4 py-2 min-w-[96px] rounded-full border text-sm transition whitespace-nowrap ${
      active
        ? "bg-gray-800 text-white border-gray-800"
        : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
    }`;
  }

  const tone = getStatusTone(buttonStatus as Customer["status"]);

  return `px-4 py-2 min-w-[96px] rounded-full border text-sm transition whitespace-nowrap ${
    active
      ? `bg-${tone}-100 text-${tone}-800 border-${tone}-200`
      : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50"
  }`;
};

export const getCurrentModuleType = () => {
  if (typeof window !== "undefined") {
    try {
      const parsed = JSON.parse(window.localStorage.getItem("module"));
      if (parsed?.module_type) return parsed.module_type;
    } catch {}
  }
  return "food";
};

export const getCurrentModuleId = () => {
  if (typeof window !== "undefined") {
    try {
      const parsed = JSON.parse(window.localStorage.getItem("module"));
      if (parsed?.id != null) return parsed.id;
    } catch {}
  }
  return 2;
};

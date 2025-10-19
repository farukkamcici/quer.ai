// Querai Chart Theme helpers
// Keep chart colors aligned to brand and theme-aware.

export const chartTheme = {
  light: {
    palette: ["#60A5FA", "#7C3AED", "#93C5FD", "#A78BFA", "#38BDF8"],
    grid: "rgba(15,23,42,0.08)",
    axis: "#64748B",
    areaFrom: "rgba(37,99,235,0.4)",
    areaTo: "rgba(124,58,237,0.1)",
  },
  dark: {
    palette: ["#93C5FD", "#A78BFA", "#60A5FA", "#C4B5FD", "#7DD3FC"],
    grid: "rgba(229,231,235,0.12)",
    axis: "#9CA3AF",
    areaFrom: "rgba(59,130,246,0.4)",
    areaTo: "rgba(139,92,246,0.15)",
  },
};

export function getChartTheme(theme = "light") {
  return chartTheme[theme];
}

export function barColor(index, theme = "light") {
  const p = chartTheme[theme].palette;
  return p[index % p.length];
}

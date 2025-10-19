import clsx from "clsx";

export function GradientBg({ className = "", children }) {
  return <div className={clsx("bg-gradient-to-br from-blue-50 to-indigo-50", className)}>{children}</div>;
}

export function GradientAccent({ className = "", children }) {
  return <div className={clsx("bg-gradient-to-r from-blue-600 to-indigo-600 text-white", className)}>{children}</div>;
}

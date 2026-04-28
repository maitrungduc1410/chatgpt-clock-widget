// @ts-nocheck
import { useEffect } from "react";
import { create } from "zustand";

// ==========================================
// 1. ZUSTAND STORE (State Management)
// ==========================================
const useWidgetStateStore = create((set) => ({
  // Initial state matching ChatGPT
  location: "Singapore, Singapore (SGT)",
  relative_offset_label: "Today, +0hrs",
  time_label: "00:00",
  hour_transform: "rotate(0deg)",
  minute_transform: "rotate(0deg)",
  second_transform: "rotate(0deg)",

  // Runs every second (replaces the complex AST)
  tick: () => set(() => {
    // Get the current time (Singapore +8)
    const now = new Date();
    // Normalize to Singapore time in case testing happens in another timezone
    const sgtTime = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);

    const h = sgtTime.getHours();
    const m = sgtTime.getMinutes();
    const s = sgtTime.getSeconds();

    const pad = (n) => n.toString().padStart(2, "0");

    return {
      time_label: `${pad(h)}:${pad(m)}`,
      second_transform: `rotate(${s * 6}deg)`,
      minute_transform: `rotate(${m * 6 + s * 0.1}deg)`,
      hour_transform: `rotate(${(h % 12) * 30 + m * 0.5}deg)`,
    };
  })
}));

// ==========================================
// 2. COMPONENT REGISTRY (Dumb Components)
// ==========================================

// --- HEADLESS COMPONENT ---
// o7t: RunInterval (our invisible workhorse)
const o7t = ({ interval = 1000 }) => {
  const tick = useWidgetStateStore((state) => state.tick);

  useEffect(() => {
    tick(); // Run immediately (leading tick)
    const timer = setInterval(tick, interval);
    return () => clearInterval(timer);
  }, [interval, tick]);

  return null; // Render nothing
};

// --- UI COMPONENTS ---
// Dj: Show (Conditional Wrapper)
const Dj = ({ when, children }) => (when ? <>{children}</> : null);

// Sfe: Row
const Sfe = ({ gap, children }) => (
  <div
    className="wkCU-"
    data-w-direction="row"
    data-w-align="center"
    data-w-justify="between"
    data-w-component="row"
    style={{ gap: `${gap * 0.25}rem` }}
  >
    {children}
  </div>
);

// kfe: Col
const kfe = ({ gap, children }) => (
  <div
    className="wkCU-"
    data-w-direction="col"
    data-w-component="col"
    style={{ gap: `${gap * 0.25}rem` }}
  >
    {children}
  </div>
);

// D3t: Title
const D3t = ({ value, size, weight }) => (
  <h3
    className="LE23f"
    data-w-component="title"
    data-w-weight={weight}
    data-w-size={size}
  >
    {value}
  </h3>
);

// yoe: Text
const yoe = ({ value, size, weight, color, children }) => (
  <p
    className="_2o4DE ldtdW"
    data-w-component="text"
    data-w-weight={weight || "normal"}
    data-w-size={size}
    data-w-whitespace="linebreaks"
    style={{ color: color === "secondary" ? "var(--color-text-secondary)" : "inherit" }}
  >
    {value || children}
  </p>
);

// Afe: Box
const Afe = ({ style, width, height, radius, background, className, ...rest }) => {
  const mergedStyle = { ...style };
  if (height) mergedStyle.height = typeof height === 'number' ? `${height}px` : height;
  if (width) mergedStyle.width = typeof width === 'number' ? `${width}px` : width;
  if (background) mergedStyle.background = background;
  if (radius === "full") mergedStyle.borderRadius = "var(--radius-full)";

  return (
    <div
      // Merge the default wkCU- class with any external class (for example _7usgN)
      className={`wkCU- ${className || ""}`.trim()}
      data-w-direction="col"
      data-w-auto-spacing=""
      // Use a provided data-w-component when available, otherwise default to "box"
      data-w-component={rest["data-w-container"] ? undefined : "box"}
      style={mergedStyle}
      // Spread any remaining data-* props onto the div
      {...rest}
    >
      {rest.children}
    </div>
  );
};

const Registry = { RunInterval: o7t, Show: Dj, Row: Sfe, Col: kfe, Title: D3t, Text: yoe, Box: Afe };

// ==========================================
// 3. MAPPER COMPONENT (Recursive compiler)
// ==========================================
// Sn reads the JSON, resolves $-prefixed variables, and renders the matching component
const Sn = ({ node }) => {
  const state = useWidgetStateStore();

  if (!node) return null;

  const resolvedProps = {};
  for (const [key, value] of Object.entries(node.props || {})) {
    // Resolve props with a $ prefix
    if (key.startsWith("$")) {
      const realKey = key.slice(1);

      // 1. Resolve $value="state.XXX"
      if (realKey === "value" && typeof value === "string" && value.startsWith("state.")) {
        resolvedProps[realKey] = state[value.split(".")[1]];
      }
      // 2. Resolve $when="state.XXX == null" (hardcoded for this demo)
      else if (realKey === "when" && value === "state.fixed_tick == null") {
        resolvedProps[realKey] = true; // The clock is in its running state
      }
      // 3. Resolve dynamic $style values containing state.xxx_transform
      else if (realKey === "style" && typeof value === "object") {
        const dynamicStyle = { ...value };
        if (value.transform && value.transform.includes("${state.")) {
          // Replace placeholders like "${state.second_transform}" with live values
          let t = value.transform;
          if (t.includes("second_transform")) t = t.replace("${state.second_transform}", state.second_transform);
          if (t.includes("minute_transform")) t = t.replace("${state.minute_transform}", state.minute_transform);
          if (t.includes("hour_transform")) t = t.replace("${state.hour_transform}", state.hour_transform);
          dynamicStyle.transform = t;
        }
        resolvedProps[realKey] = dynamicStyle;
      }
    } else {
      resolvedProps[key] = value;
    }
  }

  const Component = Registry[node.name];
  if (!Component) return <div style={{ color: 'red' }}>Missing: {node.name}</div>;

  return (
    <Component {...resolvedProps}>
      {node.children?.map((child, idx) => <Sn key={idx} node={child} />)}
    </Component>
  );
};

// ==========================================
// 4. BLUEPRINT (DIL JSON)
// ==========================================
// This JSON is mapped 1:1 with the provided HTML
const clockDIL = {
  name: "Box",
  props: {
    className: "_7usgN",          // <--- This is the missing class
    "data-w-container": "card",   // Add data attributes so the CSS can target it
    "data-size": "sm",
    "data-theme": "dark",
    style: {
      "--smoothing-background-color": "#1c1c1c",
      "--w-box-gutter-block-start": "1.25rem",
      "--w-box-gutter-block-end": "1.25rem",
      "--w-box-gutter-inline-start": "1.5rem",
      "--w-box-gutter-inline-end": "1rem",
      paddingBlock: "1.25rem",
      paddingInline: "1.5rem 1rem",
      background: "rgb(28, 28, 28)",
    }
  },
  children: [
    { name: "RunInterval", props: { interval: 1000 } }, // Runs in the background
    {
      name: "Row",
      props: { gap: 3 },
      children: [
        {
          name: "Col",
          props: { gap: 1.5 },
          children: [
            { name: "Title", props: { $value: "state.time_label", size: "xl", weight: "semibold" } },
            {
              name: "Col",
              props: { gap: 0 },
              children: [
                { name: "Text", props: { $value: "state.location", size: "sm", color: "secondary" } },
                {
                  name: "Show",
                  props: { $when: "state.fixed_tick == null" },
                  children: [
                    { name: "Text", props: { $value: "state.relative_offset_label", size: "sm", color: "secondary" } }
                  ]
                }
              ]
            }
          ]
        },
        {
          name: "Box",
          props: {
            width: 95, height: 95, radius: "full", background: "transparent",
            style: { position: "relative", flexShrink: 0, "--smoothing-background-color": "transparent" }
          },
          children: [
            // The numbers on the clock face
            ...[
              { n: "12", top: "8%", left: "50%" }, { n: "1", top: "6%", left: "71%" },
              { n: "2", top: "21%", left: "86%" }, { n: "3", top: "42%", left: "92%" },
              { n: "4", top: "63%", left: "86%" }, { n: "5", top: "78%", left: "71%" },
              { n: "6", top: "84%", left: "50%" }, { n: "7", top: "78%", left: "29%" },
              { n: "8", top: "63%", left: "14%" }, { n: "9", top: "42%", left: "8%" },
              { n: "10", top: "21%", left: "14%" }, { n: "11", top: "6%", left: "29%" }
            ].map(num => ({
              name: "Box",
              props: { style: { position: "absolute", top: num.top, left: num.left, transform: "translate(-50%, -50%)" } },
              children: [{ name: "Text", props: { value: num.n, size: "xs", weight: "semibold" } }]
            })),

            // Hour hand (shadow and main hand)
            { name: "Box", props: { $style: { height: "8px", width: "2px", background: "rgb(245, 245, 245)", position: "absolute", top: "42%", left: "50%", transformOrigin: "50% 100%", zIndex: 4, transform: "translate(-50%, -100%) ${state.hour_transform}" } } },
            { name: "Box", props: { $style: { height: "24px", width: "4px", background: "rgb(245, 245, 245)", position: "absolute", top: "42%", left: "50%", borderRadius: "999px", transformOrigin: "50% 100%", zIndex: 4, transform: "translate(-50%, -100%) ${state.hour_transform} translateY(-5px)" } } },

            // Minute hand (shadow and main hand)
            { name: "Box", props: { $style: { height: "8px", width: "2px", background: "rgb(245, 245, 245)", position: "absolute", top: "42%", left: "50%", transformOrigin: "50% 100%", zIndex: 4, transform: "translate(-50%, -100%) ${state.minute_transform}" } } },
            { name: "Box", props: { $style: { height: "36px", width: "4px", background: "rgb(245, 245, 245)", position: "absolute", top: "42%", left: "50%", borderRadius: "999px", transformOrigin: "50% 100%", zIndex: 4, transform: "translate(-50%, -100%) ${state.minute_transform} translateY(-5px)" } } },

            // Second hand
            { name: "Box", props: { $style: { height: "50px", width: "2px", background: "var(--red-300, #ff4d4f)", position: "absolute", top: "42%", left: "50%", transformOrigin: "50% 100%", zIndex: 5, transform: "translate(-50%, -100%) ${state.second_transform} translateY(6px)" } } },

            // Center dots in the middle of the clock
            { name: "Box", props: { style: { height: "6px", width: "6px", background: "white", position: "absolute", top: "42%", left: "50%", borderRadius: "999px", transform: "translate(-50%, -50%)", zIndex: 4 } } },
            { name: "Box", props: { style: { height: "4px", width: "4px", background: "var(--orange-300, #ffa940)", position: "absolute", top: "42%", left: "50%", borderRadius: "999px", transform: "translate(-50%, -50%)", zIndex: 6 } } },
            { name: "Box", props: { style: { height: "2px", width: "2px", background: "white", position: "absolute", top: "42%", left: "50%", borderRadius: "999px", transform: "translate(-50%, -50%)", zIndex: 6 } } }
          ]
        }
      ]
    }
  ]
};

// ==========================================
// 5. ROOT RENDERER
// ==========================================
export default function App() {
  return (
    <div className="widget-container" data-theme="dark">
      <div className="VJTtF" dir="auto" data-theme="dark">
        <Sn node={clockDIL} />
      </div>
    </div>
  );
}
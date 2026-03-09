import React from "react";

type AgentState = "idle" | "thinking" | "active" | "failed" | "complete";

type Agent = {
  id: "homer" | "marge" | "bart" | "lisa" | "maggie";
  name: string;
  role: string;
  color: string;
  state: AgentState;
  bubble?: string;
};

type Props = {
  agents?: Partial<Record<Agent["id"], Partial<Agent>>>;
  tickerItems?: string[];
};

const COLORS = {
  wall: "#7a9ab5",
  wallDark: "#5f7894",
  floorTop: "#5a3418",
  floorBottom: "#2f180a",
  hazardOrange: "#f06b00",
  hazardBlack: "#111111",
  console: "#8b7ba8",
  consoleDark: "#5a4b78",
  maggieRing: "#5d2d73",
  maggieRingGlow: "rgba(255, 80, 180, 0.28)",
  bubbleBg: "#f4f1ed",
  tickerBg: "#060807",
  tickerText: "#23e38a",
};

const defaultAgents: Record<Agent["id"], Agent> = {
  homer: {
    id: "homer",
    name: "Homer",
    role: "Execution",
    color: "#ff8a00",
    state: "idle",
    bubble: "Execution engine ready.",
  },
  marge: {
    id: "marge",
    name: "Marge",
    role: "Architecture",
    color: "#4e95ff",
    state: "idle",
    bubble: "Architecture governance active.",
  },
  bart: {
    id: "bart",
    name: "Bart",
    role: "QA / GUI Ops",
    color: "#31d86a",
    state: "idle",
    bubble: "QA relay connected.",
  },
  lisa: {
    id: "lisa",
    name: "Lisa",
    role: "Strategy",
    color: "#b768ff",
    state: "idle",
    bubble: "Strategy module standing by.",
  },
  maggie: {
    id: "maggie",
    name: "Maggie",
    role: "Orchestrator",
    color: "#ff5aa8",
    state: "active",
    bubble: "Orchestrator online.",
  },
};

function mergeAgents(
  overrides?: Partial<Record<Agent["id"], Partial<Agent>>>
): Record<Agent["id"], Agent> {
  return {
    homer: { ...defaultAgents.homer, ...(overrides?.homer || {}) },
    marge: { ...defaultAgents.marge, ...(overrides?.marge || {}) },
    bart: { ...defaultAgents.bart, ...(overrides?.bart || {}) },
    lisa: { ...defaultAgents.lisa, ...(overrides?.lisa || {}) },
    maggie: { ...defaultAgents.maggie, ...(overrides?.maggie || {}) },
  };
}

function bubbleBorder(stateColor: string) {
  return `3px solid ${stateColor}`;
}

function stationGlow(state: AgentState, color: string) {
  if (state === "active") return `0 0 18px ${color}66`;
  if (state === "thinking") return `0 0 14px ${color}44`;
  if (state === "failed") return "0 0 18px rgba(255,0,0,0.5)";
  if (state === "complete") return "0 0 16px rgba(120,255,120,0.45)";
  return "0 0 0 transparent";
}

function AgentAvatar({ agent }: { agent: Agent }) {
  const commonHead: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: 6,
    transform: "translateX(-50%)",
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "#efc84d",
    border: "4px solid #442800",
    zIndex: 2,
  };
  const eye: React.CSSProperties = {
    position: "absolute",
    width: 16,
    height: 22,
    background: "#fff",
    borderRadius: "50%",
    border: "2px solid #222",
    top: 22,
  };
  const pupil: React.CSSProperties = {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#1c1c1c",
    top: 8,
    left: 5,
  };
  const body: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: 58,
    transform: "translateX(-50%)",
    width: 76,
    height: 66,
    background: "#24356b",
    clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)",
    zIndex: 1,
  };

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: -24,
        transform: "translateX(-50%)",
        width: 110,
        height: 130,
      }}
    >
      <div style={body} />
      <div style={commonHead}>
        {agent.id === "marge" && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -54,
              transform: "translateX(-50%)",
              width: 40,
              height: 70,
              borderRadius: "22px 22px 8px 8px",
              background: "#244fdd",
              border: "4px solid #183798",
            }}
          />
        )}
        {agent.id === "bart" && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -12,
              transform: "translateX(-50%)",
              width: 54,
              height: 26,
              background: "#d9b01d",
              clipPath:
                "polygon(0% 100%, 8% 35%, 18% 100%, 30% 28%, 42% 100%, 54% 25%, 66% 100%, 78% 28%, 90% 100%, 100% 40%, 100% 100%)",
            }}
          />
        )}
        {agent.id === "lisa" && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -8,
              transform: "translateX(-50%)",
              width: 62,
              height: 34,
              background: "#e0b51d",
              clipPath:
                "polygon(0% 100%, 10% 35%, 22% 100%, 35% 30%, 50% 100%, 65% 30%, 78% 100%, 90% 35%, 100% 100%)",
            }}
          />
        )}
        {agent.id === "homer" && (
          <>
            <div
              style={{
                position: "absolute",
                left: 18,
                top: 0,
                width: 4,
                height: 12,
                background: "#442800",
                borderRadius: 2,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 18,
                top: 0,
                width: 4,
                height: 12,
                background: "#442800",
                borderRadius: 2,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                top: -2,
                width: 18,
                height: 8,
                borderTop: "4px solid #442800",
                borderRadius: 8,
              }}
            />
          </>
        )}
        {agent.id === "maggie" && (
          <>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: -12,
                transform: "translateX(-50%)",
                width: 44,
                height: 24,
                background: "#e0b51d",
                clipPath:
                  "polygon(0% 100%, 10% 35%, 20% 100%, 30% 25%, 40% 100%, 50% 18%, 60% 100%, 70% 25%, 80% 100%, 90% 35%, 100% 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: 10,
                transform: "translateX(-50%)",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#ff5aa8",
                border: "3px solid #b53a72",
              }}
            />
          </>
        )}
        <div style={{ ...eye, left: 16 }}>
          <div style={pupil} />
        </div>
        <div style={{ ...eye, right: 16 }}>
          <div style={pupil} />
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 42,
            transform: "translateX(-50%)",
            width: 10,
            height: 12,
            borderRadius: "50%",
            background: "#d48d36",
          }}
        />
      </div>
    </div>
  );
}

function Bubble({
  text,
  color,
  style,
}: {
  text?: string;
  color: string;
  style?: React.CSSProperties;
}) {
  if (!text) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: -70,
        transform: "translateX(-50%)",
        maxWidth: 160,
        minWidth: 120,
        padding: "10px 16px",
        fontSize: 13,
        lineHeight: 1.2,
        textAlign: "center",
        borderRadius: 18,
        background: COLORS.bubbleBg,
        border: bubbleBorder(color),
        boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
        zIndex: 5,
        ...style,
      }}
    >
      {text}
    </div>
  );
}

function Station({
  agent,
  left,
  top,
  width = 180,
  scale = 1,
}: {
  agent: Agent;
  left: string;
  top: string;
  width?: number;
  scale?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        height: 180,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "center center",
        zIndex: agent.id === "maggie" ? 4 : 3,
      }}
    >
      <Bubble text={agent.bubble} color={agent.color} />
      <AgentAvatar agent={agent} />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width,
          height: 92,
          borderRadius: 18,
          background: COLORS.console,
          border: `4px solid ${COLORS.consoleDark}`,
          boxShadow: stationGlow(agent.state, agent.color),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 12,
            top: 18,
            width: width - 24,
            height: 28,
            borderRadius: 9,
            background: "#130f19",
          }}
        />
        <div style={{ position: "absolute", left: 12, bottom: 18, display: "flex", gap: 8 }}>
          {["#25dd74", "#ff7400", "#f36db0", "#9e68ff"].map((c) => (
            <span key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 16,
            transform: "translateX(-50%)",
            fontSize: 12,
            letterSpacing: 2,
            color: "#2a2138",
          }}
        >
          {agent.name.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

function MaggiePlatform() {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "58%",
        transform: "translate(-50%, -50%)",
        width: 340,
        height: 140,
        zIndex: 2,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "26px 18px 0 18px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, #4f2d68 0%, #371648 58%, #24102f 100%)",
          boxShadow: `0 0 24px ${COLORS.maggieRingGlow}`,
          border: "4px solid #532063",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "40px 42px 18px 42px",
          borderRadius: "50%",
          border: "4px solid #8a5aa1",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "54px 70px 32px 70px",
          borderRadius: "50%",
          border: "4px solid #a874bf",
        }}
      />
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const x = 170 + Math.cos(angle) * 132;
        const y = 76 + Math.sin(angle) * 44;
        const dotColors = ["#ff5aa8", "#31d86a", "#4e95ff", "#ff8a00", "#b768ff"];
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: dotColors[i % dotColors.length],
              boxShadow: "0 0 8px rgba(255,255,255,0.25)",
            }}
          />
        );
      })}
    </div>
  );
}

function ConnectionLines() {
  return (
    <svg
      viewBox="0 0 1000 700"
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
    >
      <path
        d="M500 405 Q360 360 230 255"
        stroke="#d089ff"
        strokeWidth="2.5"
        fill="none"
        strokeDasharray="8 10"
        opacity="0.75"
      />
      <path
        d="M500 405 Q640 360 770 255"
        stroke="#d089ff"
        strokeWidth="2.5"
        fill="none"
        strokeDasharray="8 10"
        opacity="0.75"
      />
      <path
        d="M500 440 Q365 500 280 560"
        stroke="#56d47a"
        strokeWidth="2.5"
        fill="none"
        strokeDasharray="8 10"
        opacity="0.75"
      />
      <path
        d="M500 440 Q635 500 720 560"
        stroke="#4fa0ff"
        strokeWidth="2.5"
        fill="none"
        strokeDasharray="8 10"
        opacity="0.75"
      />
    </svg>
  );
}

function FloorPerspective() {
  return (
    <div
      style={{
        position: "absolute",
        inset: "30% 0 44px 0",
        zIndex: 0,
        background: `linear-gradient(${COLORS.floorTop}, ${COLORS.floorBottom})`,
      }}
    >
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, opacity: 0.15 }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={500}
            y1={0}
            x2={i * 125}
            y2={500}
            stroke="#f0d0b2"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * 82}
            x2={1000}
            y2={i * 82}
            stroke="#f0d0b2"
            strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  );
}

function BackWall() {
  return (
    <div style={{ position: "absolute", inset: 0, background: COLORS.wall, zIndex: 1 }}>
      <div
        style={{
          position: "absolute",
          inset: "0 0 auto 0",
          height: "36%",
          background: `linear-gradient(${COLORS.wall}, ${COLORS.wallDark})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 28,
          transform: "translateX(-50%)",
          width: 200,
          height: 160,
          border: "6px solid #657f9b",
          background: "#819cb8",
          boxShadow: "0 0 34px rgba(255, 210, 70, 0.3)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "68px 0 0 0",
            background: "repeating-linear-gradient(90deg, #f06b00 0 18px, #111 18px 36px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 28,
            transform: "translateX(-50%)",
            width: 68,
            height: 68,
            borderRadius: "50%",
            border: "4px solid #df2f2f",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 28,
              top: 6,
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderBottom: "24px solid #df2f2f",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 7,
              top: 34,
              width: 0,
              height: 0,
              borderTop: "10px solid transparent",
              borderBottom: "10px solid transparent",
              borderRight: "24px solid #df2f2f",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 7,
              top: 34,
              width: 0,
              height: 0,
              borderTop: "10px solid transparent",
              borderBottom: "10px solid transparent",
              borderLeft: "24px solid #df2f2f",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 28,
              top: 28,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#df2f2f",
            }}
          />
        </div>
      </div>
      <Monitor left="6%" />
      <Monitor left="82%" rightPanel />
      <RadiationSymbol left="2%" />
      <RadiationSymbol left="96%" />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "34%",
          height: 6,
          background: COLORS.hazardOrange,
        }}
      />
    </div>
  );
}

function Monitor({ left, rightPanel = false }: { left: string; rightPanel?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 40,
        width: 210,
        height: 160,
        background: "#040808",
        border: "6px solid #10222c",
      }}
    >
      {!rightPanel ? (
        Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 18,
              top: 20 + i * 18,
              width: 80 + i * 10,
              height: 4,
              background: "#1fd286",
            }}
          />
        ))
      ) : (
        <>
          {["#25dd74", "#ffbe22", "#ff4a4a", "#b768ff"].map((c, i) => (
            <React.Fragment key={c}>
              <div
                style={{
                  position: "absolute",
                  left: 14 + i * 46,
                  top: 18,
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  border: `4px solid ${c}`,
                }}
              />
              {Array.from({ length: 3 }).map((_, d) => (
                <span
                  key={d}
                  style={{
                    position: "absolute",
                    left: 19 + i * 46 + d * 10,
                    top: 62,
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: c,
                  }}
                />
              ))}
            </React.Fragment>
          ))}
        </>
      )}
    </div>
  );
}

function RadiationSymbol({ left }: { left: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 100,
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "3px solid #df2f2f",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 23,
          top: 4,
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderBottom: "16px solid #df2f2f",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 6,
          top: 28,
          width: 0,
          height: 0,
          borderTop: "6px solid transparent",
          borderBottom: "6px solid transparent",
          borderRight: "16px solid #df2f2f",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 6,
          top: 28,
          width: 0,
          height: 0,
          borderTop: "6px solid transparent",
          borderBottom: "6px solid transparent",
          borderLeft: "16px solid #df2f2f",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 21,
          top: 21,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#df2f2f",
        }}
      />
    </div>
  );
}

function Ticker({ items }: { items: string[] }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 44,
        background: COLORS.tickerBg,
        borderTop: `3px solid ${COLORS.hazardOrange}`,
        zIndex: 6,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 16px",
        overflow: "hidden",
        whiteSpace: "nowrap",
        color: COLORS.tickerText,
        fontSize: 13,
        letterSpacing: 2,
      }}
    >
      <span style={{ color: COLORS.hazardOrange }}>PLANT LOG</span>
      {items.map((item, i) => (
        <React.Fragment key={`${item}-${i}`}>
          <span style={{ color: "#333" }}>•</span>
          <span>{item}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function ControlRoomScene({
  agents: agentOverrides,
  tickerItems = ["SYSTEM", "WORKER COMPLETE", "JOB COMPLETED", "RELAY ACTIVE"],
}: Props) {
  const agents = mergeAgents(agentOverrides);

  return (
    <div style={{ position: "relative", width: "120%", left: "-10%", height: "100vh", overflow: "hidden", background: COLORS.wall, transform: "scale(0.62)", transformOrigin: "center top" }}>
      <FloorPerspective />
      <BackWall />
      <MaggiePlatform />
      <ConnectionLines />
      <Station agent={agents.homer} left="15%" top="46%" />
      <Station agent={agents.marge} left="85%" top="46%" />
      <Station agent={agents.bart} left="22%" top="74%" scale={0.92} />
      <Station agent={agents.lisa} left="78%" top="74%" scale={0.92} />
      <Station agent={agents.maggie} left="50%" top="58%" width={200} scale={1.08} />
      <Ticker items={tickerItems} />
    </div>
  );
}

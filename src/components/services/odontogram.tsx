"use client";

// Anatomical interactive odontogram — 32 permanent teeth (FDI 11–48), two arches.
// Each tooth is a distinct shape by class (incisor/canine/premolar/molar). Teeth
// are coloured by which order item owns them (one tooth → one item). Clicking a
// tooth reports its FDI number; the parent decides assignment. Synced with the
// text input the parent renders alongside.

const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

type ToothClass = "incisor" | "canine" | "premolar" | "molar";

function toothClass(fdi: number): ToothClass {
  const d = fdi % 10;
  if (d <= 2) return "incisor";
  if (d === 3) return "canine";
  if (d <= 5) return "premolar";
  return "molar";
}

// Crown drawn with the occlusal (biting) edge at the BOTTOM, root tapering up.
const SHAPES: Record<ToothClass, { w: number; path: string }> = {
  incisor: { w: 26, path: "M6,4 C9,1 17,1 20,4 L22,38 C22,46 4,46 4,38 Z" },
  canine: { w: 27, path: "M6,4 C9,1 18,1 21,4 L22,33 L13,47 L5,33 Z" },
  premolar: { w: 32, path: "M6,8 C8,3 24,3 26,8 C29,20 27,34 20,42 Q16,46 16,40 Q16,46 12,42 C5,34 3,20 6,8 Z" },
  molar: { w: 40, path: "M5,9 C9,3 31,3 35,9 C39,22 37,33 31,42 Q27,47 25,42 Q22,47 19,42 Q16,47 13,42 Q8,47 7,42 C3,33 1,22 5,9 Z" },
};

const H = 50;

function Tooth({
  fdi,
  upper,
  color,
  onClick,
}: {
  fdi: number;
  upper: boolean;
  color: string | null;
  onClick: () => void;
}) {
  const cls = toothClass(fdi);
  const { w, path } = SHAPES[cls];
  const fill = color ? color : "var(--surface-2, #1d2630)";
  const stroke = color ? color : "var(--border, #2b3640)";

  return (
    <button
      type="button"
      onClick={onClick}
      title={`السن ${fdi}`}
      className="group flex flex-col items-center"
      style={{ order: upper ? 0 : 0 }}
    >
      <span className={`text-[10px] tabular-nums ${color ? "font-bold text-fg" : "text-fg-faint"} ${upper ? "" : "order-2"}`}>{fdi}</span>
      <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} className="transition-transform group-hover:scale-110 group-active:scale-95">
        <g transform={upper ? undefined : `translate(0,${H}) scale(1,-1)`}>
          <path d={path} fill={fill} stroke={stroke} strokeWidth={color ? 1.6 : 1} className="group-hover:stroke-primary" />
        </g>
      </svg>
    </button>
  );
}

function Arch({ teeth, upper, colorOf, onTooth }: { teeth: number[]; upper: boolean; colorOf: (fdi: number) => string | null; onTooth: (fdi: number) => void }) {
  // split into two quadrants with a midline gap
  const left = teeth.slice(0, 8);
  const right = teeth.slice(8);
  return (
    <div className="flex items-end justify-center gap-[3px]">
      <div className="flex items-end gap-[2px]">
        {left.map((fdi) => <Tooth key={fdi} fdi={fdi} upper={upper} color={colorOf(fdi)} onClick={() => onTooth(fdi)} />)}
      </div>
      <div className="mx-1 h-10 w-px self-center bg-border-soft" />
      <div className="flex items-end gap-[2px]">
        {right.map((fdi) => <Tooth key={fdi} fdi={fdi} upper={upper} color={colorOf(fdi)} onClick={() => onTooth(fdi)} />)}
      </div>
    </div>
  );
}

export function Odontogram({
  assignments,
  onToothClick,
  disabled = false,
}: {
  assignments: Record<number, string>; // fdi -> color
  onToothClick?: (fdi: number) => void;
  disabled?: boolean;
}) {
  const colorOf = (fdi: number) => assignments[fdi] ?? null;
  const handle = (fdi: number) => {
    if (disabled) return;
    onToothClick?.(fdi);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border-soft bg-surface-1/40 p-4">
      <div className="mx-auto flex min-w-[640px] flex-col gap-2">
        <span className="text-center text-[11px] text-fg-faint">الفك العلوي</span>
        <Arch teeth={[...UPPER_RIGHT, ...UPPER_LEFT]} upper colorOf={colorOf} onTooth={handle} />
        <div className="my-1 border-t border-dashed border-border-soft" />
        <Arch teeth={[...LOWER_RIGHT, ...LOWER_LEFT]} upper={false} colorOf={colorOf} onTooth={handle} />
        <span className="text-center text-[11px] text-fg-faint">الفك السفلي</span>
      </div>
    </div>
  );
}

export const ALL_FDI = [...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_RIGHT, ...LOWER_LEFT];

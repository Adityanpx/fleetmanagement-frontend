/** Shown in edit forms so a deactivated vehicle/driver/company can be brought back. */
export default function ActiveToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <input type="checkbox" className="h-4 w-4 rounded border-zinc-300 accent-zinc-900" checked={checked}
        onChange={(e) => onChange(e.target.checked)} />
      <span>Active <span className="text-zinc-400">(inactive ones are hidden when creating trips)</span></span>
    </label>
  );
}

import { evaluatePassword } from "@/lib/auth/password";
import { Check, X } from "lucide-react";

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, checks } = evaluatePassword(password);
  const colors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-emerald-500", "bg-accent-blue"];
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? colors[score] : "bg-border"}`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-[11px]">
        <span className="text-muted-foreground">Strength</span>
        <span className="font-medium text-foreground">{label}</span>
      </div>
      <ul className="grid grid-cols-2 gap-1 text-[11px]">
        {[
          ["length", "10+ characters"],
          ["upper", "Uppercase"],
          ["lower", "Lowercase"],
          ["number", "Number"],
          ["symbol", "Symbol"],
        ].map(([k, lbl]) => {
          const ok = checks[k as keyof typeof checks];
          return (
            <li key={k} className={`flex items-center gap-1 ${ok ? "text-emerald-400" : "text-muted-foreground"}`}>
              {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {lbl}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

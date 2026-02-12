import { useState } from "react";
import { User, ChevronDown } from "lucide-react";

interface MockAuthBannerProps {
  user: string;
  onChangeUser: (user: string) => void;
}

const PRESET_USERS = ["jisung.jang", "test.user", "admin.dev"];

export default function MockAuthBanner({ user, onChangeUser }: MockAuthBannerProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(user);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      const prefix = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
      onChangeUser(prefix);
    }
    setEditing(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-950/90 px-4 py-2 text-sm shadow-lg backdrop-blur">
      <User className="h-4 w-4 text-amber-400" />
      <span className="text-amber-300 font-medium">Dev Mode</span>
      <span className="text-muted-foreground">as</span>
      {editing ? (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex items-center gap-2">
          <input
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleSubmit}
            className="rounded border border-input bg-background px-2 py-0.5 text-sm font-mono w-40"
            placeholder="email prefix"
          />
        </form>
      ) : (
        <button
          onClick={() => { setInputValue(user); setEditing(true); }}
          className="flex items-center gap-1 font-mono font-medium text-foreground hover:text-amber-300"
        >
          {user}
          <ChevronDown className="h-3 w-3" />
        </button>
      )}
      {!editing && (
        <div className="flex items-center gap-1 ml-2">
          {PRESET_USERS.filter((u) => u !== user).map((u) => (
            <button
              key={u}
              onClick={() => onChangeUser(u)}
              className="rounded bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {u}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

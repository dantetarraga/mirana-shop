import React from "react";
import { Button } from "@/shared/components/ui/Button";
import { X } from "lucide-react";
import { A } from "@/shared/lib/admin-classes";

interface AdminDrawerProps {
  title:    string;
  sub?:     string;
  onClose:  () => void;
  children: React.ReactNode;
}

export function AdminDrawer({ title, sub, onClose, children }: AdminDrawerProps) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-[8px] flex justify-end"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[440px] max-w-full h-screen overflow-y-auto bg-surf border-l border-[var(--bd)]"
      >
        <div
          className="px-7 py-6 flex justify-between items-start sticky top-0 z-[5] bg-surf border-b border-[var(--bd)]"
        >
          <div>
            {sub && (
              <div className={A.label}>{sub}</div>
            )}
            <div className="font-display text-[26px] font-black tracking-[-0.5px]">{title}</div>
          </div>
          <Button variant="icon" size="md" onClick={onClose}><X size={16} /></Button>
        </div>
        <div className="px-7 pt-6 pb-10 flex flex-col gap-4.5">
          {children}
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface FilterTab {
  key:   string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  /** Valor actual del input de búsqueda */
  query:       string;
  /** Placeholder del input */
  placeholder?: string;
  /** Tab activo */
  activeTab:   string;
  /** Lista de tabs */
  tabs:        FilterTab[];
  /** Callback al cambiar el query */
  onQuery:     (q: string) => void;
  /** Callback al cambiar el tab */
  onTab:       (key: string) => void;
  /** Slot para botones de acción al final (ej: "+ Nuevo producto") */
  actions?:    React.ReactNode;
}

/**
 * Barra de búsqueda + tabs de filtro reutilizable.
 */
export function FilterBar({
  query,
  placeholder = "Buscar...",
  activeTab,
  tabs,
  onQuery,
  onTab,
  actions,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-[14px] mb-[18px] flex-wrap">
      <div className="flex items-center gap-[9px] px-[14px] h-[42px] flex-1 min-w-[200px] max-w-[340px] bg-card border border-[var(--bd)]">
        <Search size={13} className="text-muted" />
        <input
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          className="bg-transparent border-none outline-none text-sm w-full font-sans text-text"
        />
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((t) => (
          <Button key={t.key} variant="tab" size="sm" active={activeTab === t.key} onClick={() => onTab(t.key)}>
            {t.label}
            {t.count != null && (
              <span className="text-[12px] opacity-70 ml-1">{t.count}</span>
            )}
          </Button>
        ))}
      </div>
      {actions && <div className="ml-auto">{actions}</div>}
    </div>
  );
}

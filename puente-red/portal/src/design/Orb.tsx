/**
 * El orbe de marca de Puente.
 *
 * Copiado del prototipo (`ProSidebar.tsx`: `radial-gradient(circle at 35% 30%, #A78BFA,
 * #5B5CF0)`). El brief §37 pide **extender** el lenguaje visual, no reinventarlo.
 */

import { brand } from "../design/tokens.ts";

export interface OrbProps {
  readonly size?: number;
}

export function Orb({ size = 36 }: OrbProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: `radial-gradient(circle at 35% 30%, ${brand.violet}, ${brand.primary})`,
      }}
    />
  );
}

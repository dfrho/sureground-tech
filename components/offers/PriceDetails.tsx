import type { Offer } from "@/lib/config/offers";
import { addOnLabel, formatUsd } from "@/lib/offers/format";

/**
 * The tier prices and add-on prices under an offer's starting price, shared by
 * the pricing page and the service pages. Renders nothing for simple offers.
 */
export function PriceDetails({ offer }: { offer: Offer }) {
  if (!offer.tiers && !offer.addOns) return null;
  return (
    <div className="mt-2 flex flex-col gap-2 text-small text-muted">
      {offer.tiers ? (
        <ul className="flex flex-col gap-1">
          {offer.tiers.map((t) => (
            <li key={t.name}>
              {t.name} ({t.duration}): {formatUsd(t.startingAt)}
            </li>
          ))}
        </ul>
      ) : null}
      {offer.addOns ? (
        <div>
          <p className="font-mono text-label uppercase">Add-ons</p>
          <ul className="mt-1 flex flex-col gap-1">
            {offer.addOns.map((a) => (
              <li key={a.name}>{addOnLabel(a)}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

import { govsByPrefecture, type LocalGov } from "../lib/catalog.ts";

interface GovSelectProps {
  gov: LocalGov;
  onGov: (code: string) => void;
}

export function GovSelect({ gov, onGov }: GovSelectProps) {
  return (
    <label className="place-field">
      <span className="visually-hidden">自治体</span>
      <select
        className="place-select"
        value={gov.code}
        onChange={(event) => onGov(event.target.value)}
      >
        {govsByPrefecture().map((group) => (
          <optgroup key={group.prefecture} label={group.prefecture}>
            {group.govs.map((item) => (
              <option key={item.code} value={item.code}>
                {item.city}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

import { firstGovInPrefecture, govsByPrefecture, type LocalGov } from "../lib/catalog.ts";

const PREF_GROUPS = govsByPrefecture();

interface GovSelectProps {
  gov: LocalGov;
  onGov: (code: string) => void;
}

export function GovSelect({ gov, onGov }: GovSelectProps) {
  const munis = PREF_GROUPS.find((group) => group.prefecture === gov.prefecture)?.govs ?? [];

  const choosePref = (prefecture: string) => {
    const first = firstGovInPrefecture(prefecture);
    if (first == null || first.code === gov.code) return;
    onGov(first.code);
  };

  return (
    <>
      <label className="place-field">
        <span className="visually-hidden">広域自治体</span>
        <select
          className="place-select"
          value={gov.prefecture}
          onChange={(event) => choosePref(event.target.value)}
        >
          {PREF_GROUPS.map((group) => (
            <option key={group.prefecture} value={group.prefecture}>
              {group.prefecture}
            </option>
          ))}
        </select>
      </label>
      <label className="place-field">
        <span className="visually-hidden">基礎自治体</span>
        <select
          className="place-select"
          value={gov.code}
          onChange={(event) => onGov(event.target.value)}
        >
          {munis.map((item) => (
            <option key={item.code} value={item.code}>
              {item.city}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

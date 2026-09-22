import { useEffect, useState } from "react";

export function useTwoFaStatus() {
  const [enabled, setEnabled] = useState(false);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/me")
      .then((response) => response.json())
      .then((data: { "2fa_enabled"?: boolean }) => {
        if (!mounted) return;
        setEnabled(Boolean(data?.["2fa_enabled"]));
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setResolved(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { enabled, resolved };
}

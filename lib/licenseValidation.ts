export function needsRevalidation(
  lastValidation: Date,
  requiredDays: number
) {
  const now = Date.now();

  const diff =
    now - new Date(lastValidation).getTime();

  return (
    diff >
    requiredDays *
      24 *
      60 *
      60 *
      1000
  );
}

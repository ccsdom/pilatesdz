export type CenterMembership = {
  uid: string;
  centerId: string;
  active: boolean;
};

// Inputs must come from a verified server identity and a trusted repository.
// This is only a scope check, not sufficient permission for a business action.
export function belongsToCenter(
  uid: string | null,
  centerId: string,
  membership: CenterMembership | null,
): boolean {
  return Boolean(uid && centerId && membership?.active &&
    membership.uid === uid && membership.centerId === centerId);
}

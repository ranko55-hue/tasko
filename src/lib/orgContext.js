import { createContext, useContext } from 'react';

// הקשר המשתמש/ארגון המחובר — נגיש לכל מסכי האפליקציה.
// value: { session, user, member, refetchMember }
export const OrgContext = createContext(null);

export function useOrg() {
  return useContext(OrgContext);
}

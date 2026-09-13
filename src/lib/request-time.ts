import "server-only";
import { cache } from "react";

// Share one time snapshot within a server render; mutations use the live clock.
export const getRequestTime = cache(() => Date.now());

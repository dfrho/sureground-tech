import { z } from "zod";

/**
 * The project's only import of "zod"; everything else imports `z` from here.
 *
 * Zod 4 runs a `new Function("")` probe once, inside try/catch, to decide
 * whether it can compile faster parsers. The site's CSP has no 'unsafe-eval',
 * so browsers report that probe as a CSP violation even though nothing breaks
 * (seen by Lighthouse on /scorecard, 2026-11-13). `jitless` skips the probe;
 * validation results are the same.
 */
z.config({ jitless: true });

export { z };

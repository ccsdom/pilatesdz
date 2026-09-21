/* eslint-disable @typescript-eslint/no-require-imports -- Firebase CLI exposes CommonJS administrative helpers. */
// Uses the existing Firebase CLI login; never creates or prints credentials.
const { configstore } = require("firebase-tools/lib/configstore");
const { requireAuth } = require("firebase-tools/lib/requireAuth");
const { Client } = require("firebase-tools/lib/apiv2");
const { ensure } = require("firebase-tools/lib/ensureApiEnabled");
const project = "pilates-center-9dee6";
const name = `projects/${project}/locations/europe-west4/jobs/pilates-credit-settlement`;
const email = `credit-settlement@${project}.iam.gserviceaccount.com`;
const uri = "https://www.pilatesdz.com/api/internal/credits";
async function main() {
  await requireAuth({ project, user: configstore.get("user"), tokens: configstore.get("tokens"), nonInteractive: true });
  const scheduler = new Client({ urlPrefix: "https://cloudscheduler.googleapis.com", apiVersion: "v1" });
  if (process.argv.includes("--check")) {
    const result = await scheduler.get(`/${name}`);
    const job = result.body;
    console.log(JSON.stringify({ name: job.name, state: job.state, schedule: job.schedule, uri: job.httpTarget?.uri, lastAttemptTime: job.lastAttemptTime, status: job.status }));
    return;
  }
  await ensure(project, "cloudscheduler.googleapis.com", "credits");
  await ensure(project, "iam.googleapis.com", "credits");
  const iam = new Client({ urlPrefix: "https://iam.googleapis.com", apiVersion: "v1" });
  const account = await iam.get(`/projects/${project}/serviceAccounts/${email}`, { resolveOnHTTPError: true });
  if (account.status === 404) {
    await iam.post(`/projects/${project}/serviceAccounts`, { accountId: "credit-settlement", serviceAccount: { displayName: "Pilates credit settlement caller" } });
  } else if (account.status !== 200) throw new Error(`Service account lookup failed (${account.status})`);
  // No Firestore permission is granted to this caller. The app verifies OIDC.
  const job = { name, schedule: "*/5 * * * *", timeZone: "Africa/Algiers", attemptDeadline: "60s", httpTarget: { uri, httpMethod: "POST", oidcToken: { serviceAccountEmail: email, audience: uri } } };
  const existing = await scheduler.get(`/${name}`, { resolveOnHTTPError: true });
  if (existing.status === 404) await scheduler.post(`/projects/${project}/locations/europe-west4/jobs`, job);
  else if (existing.status === 200) await scheduler.patch(`/${name}`, job, { queryParams: { updateMask: "schedule,timeZone,attemptDeadline,httpTarget" } });
  else throw new Error(`Scheduler lookup failed (${existing.status})`);
  await scheduler.post(`/${name}:run`, {});
  console.log("Worker configured and initial execution requested. Verify --check and the CRM before enabling automatic mode.");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

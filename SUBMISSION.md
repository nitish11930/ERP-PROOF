# EPR Proof — AWS submission

EPR Proof helps reviewers compare recycling claims with evidence and identify inconsistencies for human review.

## AWS service demonstrated: Amazon S3

The AWS Integration screen (`/settings`) performs a real bucket connectivity check, uploads evidence to S3 with AES-256 server-side encryption, and generates a signed download link valid for one hour. Requests run through authenticated server routes; AWS credentials stay on the server. Supported files: PDF, JPEG, PNG, TXT, up to 10 MB. This storage demo operates independently of DynamoDB and Bedrock.

## Run and demonstrate

1. Renew the configured AWS session with `aws login --region ap-south-1`.
2. Configure `AWS_REGION`, `AWS_S3_BUCKET` and `API_SECRET` in `.env.local`. The AWS principal needs `s3:ListBucket` on the configured bucket and `s3:PutObject` / `s3:GetObject` on its `submission-demo/*` objects.
3. Run `npm run dev` and open `http://localhost:3000`.
4. Sign in with `demo@eprproof.ai` / `EPRProof@2026`.
5. Open Settings, verify the live connection, upload an evidence document, and open the returned signed download link.
6. Capture the upload receipt and the object in the AWS S3 console as submission evidence.

For an automated upload/download check, run `node scripts/test-s3-demo.mjs` while the app is running. This uploads `submission/sample-evidence.txt`, verifies that signed retrieval returns the exact same bytes, and saves a credential-free receipt to `submission/aws-validation.json`. A failed check records the actual error.

The broader application also contains DynamoDB case management and Bedrock extraction integrations. The production role permits S3 evidence storage and the existing `EPRProof` DynamoDB table. Bedrock extraction still requires separate model access and permissions.

## Live deployment

Production: https://erp-proof.vercel.app

Source: https://github.com/nitish11930/ERP-PROOF

Vercel uses OIDC to obtain temporary credentials for `EPRProofVercelProduction`. The trust policy accepts only the `erp-proof` production project in the configured Vercel team. Policies are stored in `infra/`; AWS keys are not stored in Vercel or GitHub. Production environment variables include the AWS resource names, role ARN, and an independently generated signing secret.

## Validation

- `npm test` — verification and AWS configuration unit tests.
- `npm run build` — production compilation and TypeScript validation.
- `npx eslint src/app/settings/page.tsx src/app/api/aws/s3/route.ts` — changed code lint.

Live AWS confirmation requires an active AWS session; an expired session is shown as a connection error, never a successful mock upload.

Live production validation completed on 11 October 2026 against `https://erp-proof.vercel.app`: S3 connectivity, actual evidence upload, and byte-for-byte signed download all passed. The verified receipt is saved in `submission/aws-validation.json`.

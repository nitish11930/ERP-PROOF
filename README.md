# EPR Proof

AI-assisted EPR/e-waste recycling claim evidence verification platform.

"EPR Proof doesn't decide whether a recycler is fraudulent. It shows exactly where the evidence stops agreeing."

## Project Overview

EPR Proof is a platform that verifies recycling claims submitted by producers under Extended Producer Responsibility (EPR) mandates. It extracts data from uploaded evidence, cross-checks for consistency, identifies contradictions, and calculates a deterministic risk score for human review.

## Development

```bash
npm install
npm run dev
```

The application runs at `http://localhost:3000`.

## Demo Authentication

This platform is currently configured with synthetic demo data and authentication.

**Email**: `demo@eprproof.ai`
**Password**: `EPRProof@2026`

## Environment Setup

The backend relies on AWS S3, DynamoDB, and Bedrock. Ensure you have active AWS credentials and proper permissions in your environment before running tests or starting the server.

```bash
# Example .env.local
AWS_REGION=ap-south-1
AWS_S3_BUCKET=epr-proof-evidence-1234
AWS_DYNAMODB_TABLE=EPRProof
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
# For local dev auth (HMAC cookie signing)
API_SECRET=your-secure-secret-here
```

## Architecture

- **Frontend**: Next.js (App Router) + TypeScript
- **Styling**: Vanilla CSS (CSS custom properties, NO Tailwind)
- **Backend**: Next.js API Routes + AWS SDK (S3, DynamoDB, Bedrock)

## Current Status (Backend Completed)
- **Case Management**: CRUD operations against single-table DynamoDB.
- **Evidence Management**: Presigned S3 URLs, SHA-256 byte hashing, and file size validation.
- **Verification Engine**: Deterministic rules implemented for quantity mismatches, missing evidence, date inconsistencies, entity mismatches, batch reference mismatches, and duplicate evidence.
- **Security**: HMAC cookie signing, strict RBAC, and payload validation.
- **AI Extraction**: AWS Bedrock integration built (currently falls back if credentials/model access are missing).

## Tests
- `npm run lint` and `npm run build` validate the type safety and production build.
- `npm run test` runs the deterministic Vitest unit tests for the verification engine.
- `npm run test:extraction <s3-key>` tests the real Bedrock AI extraction pipeline (requires active AWS credentials and proper `.env.local`).
- `scripts/e2e-aws-validation.js` tests real integration with S3, DynamoDB, and the verification engine. Note: requires active AWS credentials.
- `scripts/test-api.js` is an integration test of the Next.js API boundaries. Note: requires active AWS credentials (will return HTTP 503 if DynamoDB is unreachable).

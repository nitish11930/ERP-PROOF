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

## Architecture

- **Frontend**: Next.js (App Router) + TypeScript
- **Styling**: Vanilla CSS (CSS custom properties, NO Tailwind)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Planned Backend**: AWS Serverless (S3, Lambda, API Gateway, DynamoDB, Bedrock)

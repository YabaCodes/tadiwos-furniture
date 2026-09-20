# QA notes

Validation performed in the build environment:

- `package.json` parsed successfully as JSON.
- `tsconfig.json` parsed successfully as JSON.
- Initial migration contains 10 application tables and 22 RLS/Storage policies.
- Global TypeScript compiler was run against the source tree. The environment does not contain the project dependencies, so expected missing-module/React/Node-type diagnostics are produced.
- `npm install` was attempted but timed out in the execution environment before dependencies were downloaded; therefore a full `npm run build` could not be executed here.

Before deployment, run locally or in CI:

```bash
npm install
npm run lint
npm run build
```

Then apply the Supabase migration in a development Supabase project and test the RLS cases listed in the product requirements.

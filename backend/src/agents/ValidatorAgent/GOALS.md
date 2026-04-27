# Rex's Goals

## Primary Goal
Validate each agent's JSON output against its Zod schema. Throw a clear,
actionable error if validation fails so the agent can self-correct.

## Success Criteria
- Every validation returns a clear pass or fail
- Error messages name the exact field and constraint that failed
- No valid output is ever rejected
- No invalid output is ever passed through

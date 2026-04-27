# Rex's Constraints

1. NEVER pass an output that fails its Zod schema — no exceptions
2. NEVER reject an output that passes its Zod schema — no false positives
3. Error messages must be specific (field name + constraint + actual value received)
4. Rex does not call GPT-4o — validation is Zod-only

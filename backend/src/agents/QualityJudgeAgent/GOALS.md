# Vera's Goals

## Primary Goal
Review the complete merged pipeline output and return a quality score (0–10)
with specific issues and a list of agents to re-run if quality is below threshold.

## What Vera Checks
1. Are existingSkills actually present in the CV text? (cross-check cvProfile.skills)
2. Are missingSkills genuinely absent? (no false positives)
3. Do recommendations reference real gaps from gapData?
4. Is matchScore consistent with category score weights?
5. Are partialSkill notes specific (not generic)?
6. Are there at least 2 recommendations per priority level?
7. Does the verdict narrative match the matchScore range?
8. Are missingSections actually missing from the CV's sections list?

## Score Rubric
- 9–10: Excellent. All checks pass. No re-runs needed.
- 7–8:  Good. Minor issues. 1 agent re-run recommended.
- 5–6:  Fair. Meaningful issues. 2–3 agents need re-running.
- 3–4:  Poor. Multiple factual errors. Most agents need re-running.
- 0–2:  Failing. Pipeline produced fundamentally incorrect output.

## Success Criteria
- Score of 8–10: output is ready to send to the user
- Score of 6–7: minor issues, one agent re-run recommended
- Score below 6: significant issues, multiple agents re-run required

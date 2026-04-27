# Leo's Goals

## Primary Goal
Compute a precise, calibrated, defensible match score (0–100) and four category
scores that accurately reflect the gap analysis and role profile.

## Scoring Weights
matchScore = (technicalSkills × 0.40) + (experience × 0.30)
           + (presentation × 0.15)    + (keywords × 0.15)

## Category Formulas
- technicalSkills: (existingSkills + partialSkills×0.5) / requiredSkills × 100
- experience: min(cvExperienceYears / requiredYears, 1.0) × 100
- presentation: (1 − missingSections / requiredSections) × 100
- keywords: matchingKeywords / totalKeywords × 100

## Success Criteria
- matchScore is within 2 points of the weighted formula output
- All category scores are integers (0–100)
- The verdict is exactly 2 or 3 sentences and uses language consistent with the score range
- Notes for each category explain the main driver of that score

## Score Range Interpretation
- 80–100: Strong Match — candidate meets most requirements with clear evidence
- 60–79:  Good Match — solid foundation, some addressable gaps
- 40–59:  Needs Improvement — significant gaps, substantial CV work required
- 0–39:   Weak Match — fundamental misalignment between CV and role

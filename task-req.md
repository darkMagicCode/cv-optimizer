Here’s the CV Optimizer test description:

CV Optimizer — Vibe Coding Test
For: Full Stack Developer Candidates

Overview
Build an AI-powered CV optimization tool that accepts a candidate’s CV and a target job title, analyzes the match using an LLM, and returns a structured, visually rich results page showing strengths, gaps, and actionable recommendations.

Inputs
	1.	CV File — PDF, DOCX, or TXT upload (drag & drop supported)
	2.	Job Title — Free text field (e.g. “Senior Full Stack Developer”, “React Engineer”)

Required Output Sections
1. Match Score
An overall 0–100 compatibility score displayed as a visual ring/gauge.
2. Verdict
A 2–3 sentence AI-generated summary of the candidate’s fit for the role.
3. Category Breakdown
Progress bars for: Technical Skills / Experience / Presentation / Keywords match.
4. Existing Skills
All skills found in the CV displayed as green tags.
5. Missing Skills
Skills expected for the role but absent from the CV — displayed as red tags.
6. Partial Skills
Skills present but underdeveloped — yellow tags with a short note explaining what’s lacking.
7. Missing Sections
Important CV sections not found (e.g. GitHub link, portfolio, certifications, summary) with a reason why each matters.
8. Missing Experiences
Experience areas the role requires but the CV doesn’t demonstrate (e.g. “No production deployment experience mentioned”).
9. Recommendations
Prioritized action list (High / Medium / Low) with specific, concrete steps to improve the CV for this role.

Design Expectations
	•	Dark, modern UI with a clear visual hierarchy
	•	Color system: green = present, red = missing, yellow = partial
	•	Skills displayed as styled tags, not plain lists
	•	Strengths and weaknesses should be visually distinct at a glance
	•	Loading state while analysis runs
	•	Responsive layout

Technical Expectations
	•	CV text extraction from uploaded file
	•	LLM call with structured JSON output schema
	•	Error handling for bad file types or API failures
	•	No page reload — full SPA behavior
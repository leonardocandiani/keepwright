# Grilling fallback

Use only when the `grilling` skill (mattpocock/skills) is not installed.
Same spirit: relentless interview, one topic at a time, until every branch
of the decision tree is resolved. Never move on while an answer is vague —
restate vague answers as concrete options and make the user choose.

Ask in this order, adapting wording to the RECON findings:

1. **Destination.** "When this overhaul is merged, what does this repo do
   better than today? Answer in one sentence." Push until the sentence is
   falsifiable.
2. **Sacred ground.** "Here is what I intend to change: <top P1–P3
   findings>. Which of these must NOT change?" Then: public APIs? on-disk
   formats? behavior under error? naming conventions?
3. **Kill list.** Present the recon kill list verbatim. "Anything here that
   looks dead but is load-bearing?" Get an explicit yes for aggressive
   deletion of the rest.
4. **Proof.** "What command convinces YOU it still works?" If the answer is
   "I click around", translate that into the smallest automatable check and
   make it workstream 01.
5. **Budget.** "Full depth on everything, or top-N workstreams this round?"
6. **Surprises.** "What has bitten you in this repo before that no document
   mentions?" — answers here often become sacred ground or new P1 findings.

Stop condition: you can write every section of OVERHAUL-PLAN.md without
inventing anything. If any section would require guessing, you are not done
grilling.

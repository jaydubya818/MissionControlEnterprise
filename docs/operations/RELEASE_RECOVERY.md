# Release recovery

1. Stop promotion and record the approved candidate SHA, deployed artifact
   digest, release ID, deployment ID, actor, and failure time.
2. Compare the deployed digest to the approved release record. A mismatch is a
   SEV-1 incident.
3. Determine whether database/schema or external side effects make code rollback
   unsafe. Never assume application rollback reverses data changes.
4. Select the last verified compatible artifact and obtain the required human
   rollback approval.
5. Deploy that exact artifact, then verify authentication, health, core reads,
   one safe write, audit/trace linkage, and queue/worker state.
6. Reconcile any Attempt, approval, release, webhook, PR, or deployment that was
   in flight.
7. Keep the failed candidate blocked until root cause, corrective evidence, and
   a new approval exist.

The production hosting rollback drill remains a pilot admission prerequisite;
this procedure alone is not proof.


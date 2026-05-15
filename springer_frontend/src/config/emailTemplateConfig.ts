/**
 * Central registry of email template IDs.
 *
 * When you create or rename a template in the DB / Email Template Management UI,
 * update the corresponding constant here — all components pick up the change automatically.
 */
export const EMAIL_TEMPLATE_IDS = {
  /** Campus drive / institute invite sent to TPO contacts */
  INSTITUTE_INVITE_ONCAMPUS: 3,
  /** Off-campus drive invite sent to TPO contacts */
  INSTITUTE_INVITE_OFFCAMPUS: 4,
  /** Drive invitation sent to scheduled candidates with registration code */
  DRIVE_SHORTLIST_INVITATION: 5,
  /** Round pass notification sent to candidates who passed a drive round */
  ROUND_PASS_INVITE: 6,
} as const;

package com.kanini.springer.dto.Common;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class SharedEmailContext {

    /** DB template ID to load body + default subject from. */
    private Integer templateId;

    /** Optional subject override — if null, the template's own subject is used. */
    private String subject;

    /** {{DRIVE_NAME}} */
    private String driveName;

    /** {{START_DATE}} */
    private String startDate;
    /**
     * {{LOCATION}} — if this matches a known Kanini city (case-insensitive),
     * the full office address is appended automatically.
     */
    private String location;

    /** {{ROUND_NAME}} — shared for all recipients (e.g. "APTITUDE") */
    private String roundName;

    /** Per-recipient data. */
    private List<PersonalizedRecipient> recipients;
}

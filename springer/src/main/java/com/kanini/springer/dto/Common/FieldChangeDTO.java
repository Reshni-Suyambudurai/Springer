package com.kanini.springer.dto.Common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a single field-level change in a manual override
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FieldChangeDTO {
    private String field;
    private Object old;
    private Object newValue;
}
